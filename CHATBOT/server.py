from pathlib import Path
from typing import List
from uuid import uuid4

from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.concurrency import run_in_threadpool
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl

from .cli_rag import answer, ingest_url, chunk_text, ingest_chunks

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    reply: str
    sources: List[str] = []


class AddSourceRequest(BaseModel):
    url: HttpUrl
    label: str | None = None
    category: str | None = None


class AddSourceResponse(BaseModel):
    url: str
    title: str
    chunks_added: int
    fetched_at: str


BASE_DIR = Path(__file__).resolve().parent
UPLOADS_DIR = BASE_DIR / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

MAX_UPLOAD_SIZE = 5 * 1024 * 1024  # 5 MB
ALLOWED_SUFFIXES = {".txt", ".pdf", ".docx"}


def _extract_text_from_file(path: Path, suffix: str) -> str:
    """Extract readable text from a saved upload based on its extension."""
    if suffix == ".txt":
        return path.read_text(encoding="utf-8", errors="ignore")

    if suffix == ".pdf":
        from pypdf import PdfReader

        reader = PdfReader(str(path))
        pages = []
        for page in reader.pages:
            text = page.extract_text() or ""
            if text.strip():
                pages.append(text.strip())
        return "\n\n".join(pages)

    if suffix == ".docx":
        from docx import Document

        document = Document(str(path))
        paragraphs = [para.text.strip() for para in document.paragraphs if para.text.strip()]
        return "\n\n".join(paragraphs)

    raise RuntimeError(f"Unsupported file extension '{suffix}'.")


@app.post("/api/chat", response_model=ChatResponse)
async def chat_endpoint(payload: ChatRequest) -> ChatResponse:
    message = payload.message.strip()
    if not message:
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    reply_text, sources = await run_in_threadpool(answer, message)

    return ChatResponse(reply=reply_text, sources=sources or [])


@app.post("/api/sources", response_model=AddSourceResponse)
async def add_source_endpoint(payload: AddSourceRequest) -> AddSourceResponse:
    try:
        result = await run_in_threadpool(
            ingest_url,
            str(payload.url),
            payload.label,
            payload.category,
        )
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:  # pragma: no cover - guard unexpected failures
        raise HTTPException(status_code=500, detail="Unable to ingest the provided URL.") from exc

    return AddSourceResponse(**result)


@app.post("/api/uploads", response_model=AddSourceResponse)
async def upload_source_endpoint(
    file: UploadFile = File(...),
    label: str | None = Form(None),
    category: str | None = Form(None),
) -> AddSourceResponse:
    filename = (file.filename or "").strip()
    if not filename:
        raise HTTPException(status_code=400, detail="A filename is required.")

    suffix = Path(filename).suffix.lower()
    if suffix not in ALLOWED_SUFFIXES:
        allowed = ", ".join(sorted(ALLOWED_SUFFIXES))
        raise HTTPException(status_code=415, detail=f"Unsupported file type. Allowed: {allowed}.")

    payload = await file.read()
    if not payload:
        raise HTTPException(status_code=400, detail="The uploaded file was empty.")

    if len(payload) > MAX_UPLOAD_SIZE:
        raise HTTPException(status_code=413, detail="File exceeds the 5 MB upload limit.")

    upload_id = uuid4().hex
    stored_path = UPLOADS_DIR / f"{upload_id}{suffix}"
    stored_path.write_bytes(payload)

    try:
        text = await run_in_threadpool(_extract_text_from_file, stored_path, suffix)
    except Exception as exc:  # pragma: no cover - parsing failures should be rare
        raise HTTPException(status_code=400, detail="Unable to read the uploaded document.") from exc

    if not text.strip():
        raise HTTPException(status_code=400, detail="No readable text was found in that file.")

    chunks = chunk_text(text)
    if not chunks:
        raise HTTPException(status_code=400, detail="Unable to derive text chunks from that file.")

    source_id = f"local-file://{upload_id}"
    original_name = Path(filename).name
    try:
        result = await run_in_threadpool(
            ingest_chunks,
            chunks,
            source_id,
            original_name,
            label,
            category,
        )
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:  # pragma: no cover
        raise HTTPException(status_code=500, detail="Unable to ingest the uploaded file.") from exc

    return AddSourceResponse(**result)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
