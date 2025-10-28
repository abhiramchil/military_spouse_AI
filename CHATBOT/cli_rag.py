import os
import sys, re, json
from collections import OrderedDict
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer
import ollama
from pathlib import Path

os.environ.setdefault("TRANSFORMERS_NO_TORCHVISION", "1")

MODEL = "llama3.1:8b"

BASE_DIR = Path(__file__).resolve().parent

with open(BASE_DIR / "docs.json", "r", encoding="utf-8") as fh:
    docs = json.load(fh)

with open(BASE_DIR / "metas.json", "r", encoding="utf-8") as fh:
    metas = json.load(fh)

index = faiss.read_index(str(BASE_DIR / "milspouse.faiss"))
emb_model = SentenceTransformer("BAAI/bge-small-en-v1.5")

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
                    "Rely ONLY on the provided references. Keep replies under 100 words, warm but direct. "
                    "Recommend specific on-post offices, buildings, or contact people listed in the references, including "
                    "building numbers, phone numbers, or emails when available. Offer 2-3 targeted resources that best fit the question. "
                    "Finish with 'Sources:' followed by the URLs you cited."
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
            print(); break
        if not q or q.lower() in {"exit", "quit"}:
            break

        ans, _ = answer(q)
        print("\n" + ans + "\n")

if __name__ == "__main__":
    main()
