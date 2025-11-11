import json
import os
import re
import textwrap
import threading
from collections import OrderedDict
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List

import faiss
import numpy as np
import ollama
import requests
from bs4 import BeautifulSoup
from sentence_transformers import SentenceTransformer

os.environ.setdefault("TRANSFORMERS_NO_TORCHVISION", "1")

MODEL = "llama3.1:8b"

BASE_DIR = Path(__file__).resolve().parent
DOCS_PATH = BASE_DIR / "docs.json"
METAS_PATH = BASE_DIR / "metas.json"
INDEX_PATH = BASE_DIR / "milspouse.faiss"

with DOCS_PATH.open("r", encoding="utf-8") as fh:
    docs: List[str] = json.load(fh)

with METAS_PATH.open("r", encoding="utf-8") as fh:
    metas: List[Dict[str, str]] = json.load(fh)

index = faiss.read_index(str(INDEX_PATH))
emb_model = SentenceTransformer("BAAI/bge-small-en-v1.5")
_write_lock = threading.Lock()


def _save_corpus() -> None:
    """Persist the conversational corpus to disk and update the FAISS index."""
    with DOCS_PATH.open("w", encoding="utf-8") as fh:
        json.dump(docs, fh, ensure_ascii=False, indent=2)
    with METAS_PATH.open("w", encoding="utf-8") as fh:
        json.dump(metas, fh, ensure_ascii=False, indent=2)
    faiss.write_index(index, str(INDEX_PATH))


def _clean_html(html: str) -> BeautifulSoup:
    soup = BeautifulSoup(html, "html.parser")
    for tag in soup(["script", "style", "noscript", "svg", "img", "footer", "header"]):
        tag.decompose()
    return soup


def _extract_article(soup: BeautifulSoup) -> Dict[str, str]:
    title = (
        soup.title.get_text(" ", strip=True)
        if soup.title and soup.title.get_text(strip=True)
        else "Untitled"
    )

    candidates: List[str] = []
    for selector in ("main", "article", "[role='main']"):
        node = soup.select_one(selector)
        if node:
            text = node.get_text(" ", strip=True)
            if text:
                candidates.append(text)
    if not candidates:
        candidates.extend(p.get_text(" ", strip=True) for p in soup.find_all("p"))

    body = "\n\n".join(chunk for chunk in candidates if chunk)
    if not body.strip():
        body = soup.get_text(" ", strip=True)

    return {"title": title.strip(), "body": body.strip()}


def _chunk_text(text: str, width: int = 900) -> List[str]:
    normalized = re.sub(r"\s+", " ", text).strip()
    if not normalized:
        return []
    chunks = textwrap.wrap(
        normalized,
        width=width,
        replace_whitespace=True,
        drop_whitespace=True,
        break_long_words=False,
    )
    return [chunk.strip() for chunk in chunks if chunk.strip()]


def chunk_text(text: str, width: int = 900) -> List[str]:
    """Public wrapper so other modules can reuse the chunking strategy."""
    return _chunk_text(text, width)


def ingest_chunks(
    chunks: List[str],
    source: str,
    title: str,
    label: str | None = None,
    category: str | None = None,
    fetched_at: str | None = None,
) -> Dict[str, str | int]:
    prepared_chunks = [chunk.strip() for chunk in chunks if chunk and chunk.strip()]
    if not prepared_chunks:
        raise RuntimeError("No readable text chunks were provided.")

    if any(meta.get("source") == source for meta in metas):
        raise ValueError("This source already exists in the knowledge base.")

    embeddings = emb_model.encode(prepared_chunks, normalize_embeddings=True)
    vectors = np.asarray(embeddings, dtype="float32")

    resolved_label = label or "user-submitted"
    resolved_category = category or "user-submitted"
    fetched_timestamp = fetched_at or datetime.now(timezone.utc).isoformat()
    meta_template = {
        "source": source,
        "label": resolved_label,
        "category": resolved_category,
        "title": title or source,
        "fetched_at": fetched_timestamp,
        "chunk_count": len(prepared_chunks),
    }

    with _write_lock:
        if any(meta.get("source") == source for meta in metas):
            raise ValueError("This source already exists in the knowledge base.")
        index.add(vectors)
        for idx, chunk in enumerate(prepared_chunks):
            docs.append(chunk)
            entry = dict(meta_template)
            entry["chunk_index"] = idx
            metas.append(entry)
        _save_corpus()

    return {
        "url": source,
        "title": meta_template["title"],
        "chunks_added": len(prepared_chunks),
        "fetched_at": fetched_timestamp,
    }


def ingest_url(
    url: str,
    label: str | None = None,
    category: str | None = None,
) -> Dict[str, str | int]:
    """
    Fetch a URL, extract readable text, embed the content, and append it to the corpus.
    Returns summary metadata for the ingested URL.
    """
    normalized_url = url.strip()
    if not normalized_url:
        raise ValueError("A URL is required.")

    if any(meta.get("source") == normalized_url for meta in metas):
        raise ValueError("This URL already exists in the knowledge base.")

    try:
        response = requests.get(normalized_url, timeout=(5, 45))
        response.raise_for_status()
    except requests.RequestException as exc:
        raise RuntimeError(f"Failed to retrieve '{normalized_url}'.") from exc

    soup = _clean_html(response.text)
    article = _extract_article(soup)
    if not article["body"]:
        raise RuntimeError("No readable content was found at the provided URL.")

    chunks = _chunk_text(article["body"])
    if not chunks:
        raise RuntimeError("Unable to derive text chunks from the provided URL.")

    return ingest_chunks(
        chunks,
        normalized_url,
        article["title"] or normalized_url,
        label,
        category,
    )


def retrieve_pairs(q, k=8, threshold=0.25):
    qv = emb_model.encode([q], normalize_embeddings=True).astype("float32")
    D, I = index.search(qv, min(k, len(docs)))
    results = [(metas[i]["source"], docs[i]) for s, i in zip(D[0], I[0]) if s >= threshold]
    return results


def answer(q: str):
    pairs = retrieve_pairs(q, k=8, threshold=0.4)
    if not pairs:
        return "I couldn't find relevant information in the spouse resources for that question.", []

    grouped = OrderedDict()
    for url, text in pairs:
        grouped.setdefault(url, [])
        if len(grouped[url]) < 2:
            grouped[url].append(text[:900])

    numbered_urls = list(grouped.keys())
    ctx_lines = [f"{url}\n{'\n'.join(grouped[url])}" for url in numbered_urls]

    prompt = (
        "Use the following references to answer the user’s question. "
        "Do not include links other than those below. "
        "At the end, add a 'Sources:' section with only the URLs you used.\n\n"
        "References:\n" + "\n\n".join(ctx_lines) + "\n\n"
        f"User: {q}"
    )

    r = ollama.chat(
        model=MODEL,
        messages=[
            {
                "role": "system",
                "content": (
                    "You mentor U.S. military spouses stationed at Fort Moore (formerly Fort Benning) in Georgia. "
                    "Rely ONLY on the provided references. Keep replies under 110 words, warm but direct. "
                    "Structure the reply as: one short opening sentence, then a bullet list (using '- ') with 2-3 targeted recommendations "
                    "naming specific on-post offices, buildings, or contacts with practical details (building numbers, phones, emails, etc.). "
                    "End with a 'Sources:' heading on its own line and list each cited URL on separate lines prefixed with '- '."
                ),
            },
            {"role": "user", "content": prompt},
        ],
    )
    return r.message.content, numbered_urls


def main():
    print("CLI Interface\n")
    while True:
        try:
            q = input("> ").strip()
        except (EOFError, KeyboardInterrupt):
            print()
            break
        if not q or q.lower() in {"exit", "quit"}:
            break

        ans, _ = answer(q)
        print("\n" + ans + "\n")


if __name__ == "__main__":
    main()
