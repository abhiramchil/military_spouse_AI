from typing import List

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.concurrency import run_in_threadpool
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl

from .cli_rag import answer, ingest_file, ingest_url

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


@app.post("/api/sources/upload", response_model=AddSourceResponse)
async def upload_source_endpoint(
    file: UploadFile = File(...),
    label: str | None = Form(None),
    category: str | None = Form(None),
) -> AddSourceResponse:
    payload = await file.read()
    if not file.filename:
        raise HTTPException(status_code=400, detail="Uploaded files must include a filename.")
    if not payload:
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")

    try:
        result = await run_in_threadpool(
            ingest_file,
            payload,
            file.filename,
            label,
            category,
        )
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:  # pragma: no cover - guard unexpected failures
        raise HTTPException(status_code=500, detail="Unable to ingest the provided file.") from exc

    return AddSourceResponse(**result)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
