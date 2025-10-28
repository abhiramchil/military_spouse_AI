"""Rebuild the Fort Moore retrieval corpus and FAISS index from curated seeds."""

from __future__ import annotations

import json
import re
import time
from collections import deque
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Set, Tuple
from urllib.parse import urljoin, urlparse

import faiss
import requests
from bs4 import BeautifulSoup
from requests.adapters import HTTPAdapter
from sentence_transformers import SentenceTransformer
from urllib3.util.retry import Retry

BASE_DIR = Path(__file__).resolve().parent
DOCS_PATH = BASE_DIR / "docs.json"
METAS_PATH = BASE_DIR / "metas.json"
INDEX_PATH = BASE_DIR / "milspouse.faiss"
SEED_CONFIG_PATH = BASE_DIR / "seed_config.json"


@dataclass
class CrawlTarget:
    seed_label: str
    seed_category: Optional[str]
    start_url: str
    allowed_domains: List[str]
    follow_patterns: List[re.Pattern]
    exclude_patterns: List[re.Pattern]
    max_depth: int
    user_agent: str
    rate_limit_seconds: float
    use_headless: bool
    priority: Optional[int]
    content_selectors: List[str]
    title_selectors: List[str]
    strip_selectors: List[str]
    date_selectors: List[str]


def load_seed_config(path: Path = SEED_CONFIG_PATH) -> Tuple[Dict[str, Any], List[Dict[str, Any]]]:
    with path.open("r", encoding="utf-8") as fh:
        data = json.load(fh)
    defaults = data.get("defaults", {}) or {}
    seeds = data.get("seeds", []) or []
    return defaults, seeds


def compile_patterns(patterns: Iterable[str]) -> List[re.Pattern]:
    compiled: List[re.Pattern] = []
    for pattern in patterns:
        try:
            compiled.append(re.compile(pattern))
        except re.error:
            continue
    return compiled


def build_targets() -> List[CrawlTarget]:
    defaults, seeds = load_seed_config()
    targets: List[CrawlTarget] = []

    for entry in seeds:
        targets.append(
            CrawlTarget(
                seed_label=entry["label"],
                seed_category=entry.get("category"),
                start_url=entry["url"],
                allowed_domains=list(entry.get("allowed_domains") or defaults.get("allowed_domains") or []),
                follow_patterns=compile_patterns(entry.get("follow_patterns") or defaults.get("follow_patterns") or []),
                exclude_patterns=compile_patterns(entry.get("exclude_patterns") or defaults.get("exclude_patterns") or []),
                max_depth=int(entry.get("max_depth", defaults.get("max_depth", 0) or 0)),
                user_agent=(
                    entry.get("user_agent")
                    or defaults.get("user_agent")
                    or "milspouse-rag-bot/1.0"
                ),
                rate_limit_seconds=float(
                    entry.get("rate_limit_seconds")
                    or defaults.get("rate_limit_seconds")
                    or 1.0
                ),
                use_headless=bool(entry.get("use_headless", defaults.get("use_headless", False))),
                priority=entry.get("priority", defaults.get("priority")),
                content_selectors=list(entry.get("content_selectors") or defaults.get("content_selectors") or []),
                title_selectors=list(entry.get("title_selectors") or defaults.get("title_selectors") or []),
                strip_selectors=list(entry.get("strip_selectors") or defaults.get("strip_selectors") or []),
                date_selectors=list(entry.get("date_selectors") or defaults.get("date_selectors") or []),
            )
        )

    targets.sort(key=lambda t: (t.priority or 0), reverse=True)
    return targets


def is_allowed(url: str, allowed_domains: List[str]) -> bool:
    if not allowed_domains:
        return True
    netloc = urlparse(url).netloc.lower()
    return any(netloc.endswith(domain.lower()) for domain in allowed_domains)


def matches_any(patterns: List[re.Pattern], url: str) -> bool:
    return any(pattern.search(url) for pattern in patterns)


def extract_text(
    html: str,
    content_selectors: List[str],
    title_selectors: List[str],
    strip_selectors: List[str],
    date_selectors: List[str],
) -> Tuple[str, str, Optional[str]]:
    soup = BeautifulSoup(html, "html.parser")

    for selector in strip_selectors:
        for node in soup.select(selector):
            node.decompose()

    title_text: Optional[str] = None
    for selector in title_selectors:
        node = soup.select_one(selector)
        if node and node.get_text(strip=True):
            title_text = node.get_text(" ", strip=True)
            break
    if not title_text and soup.title and soup.title.get_text(strip=True):
        title_text = soup.title.get_text(" ", strip=True)

    body_text: Optional[str] = None
    for selector in content_selectors:
        nodes = soup.select(selector)
        if nodes:
            chunk = "\n\n".join(node.get_text(" ", strip=True) for node in nodes)
            if chunk.strip():
                body_text = chunk
                break
    if not body_text:
        body_text = soup.get_text(" ", strip=True)

    published: Optional[str] = None
    for selector in date_selectors:
        node = soup.select_one(selector)
        if node:
            if node.has_attr("datetime"):
                published = node["datetime"]
                break
            text = node.get_text(" ", strip=True)
            if text:
                published = text
                break

    title_text = title_text or "Untitled"
    body_text = body_text.strip()
    return title_text, body_text, published


def crawl_target(target: CrawlTarget) -> List[Tuple[str, Dict[str, str]]]:
    session = requests.Session()
    session.headers.update({"User-Agent": target.user_agent})
    retry_strategy = Retry(
        total=4,
        backoff_factor=1.5,
        status_forcelist=[429, 500, 502, 503, 504],
        allowed_methods=["HEAD", "GET"],
        raise_on_status=False,
    )
    adapter = HTTPAdapter(max_retries=retry_strategy, pool_maxsize=10)
    session.mount("https://", adapter)
    session.mount("http://", adapter)

    visited: Set[str] = set()
    to_visit = deque([(target.start_url, 0)])
    harvested: List[Tuple[str, Dict[str, str]]] = []

    while to_visit:
        url, depth = to_visit.popleft()
        if url in visited:
            continue
        visited.add(url)

        if not is_allowed(url, target.allowed_domains):
            continue
        if matches_any(target.exclude_patterns, url):
            continue

        try:
            response = session.get(url, timeout=(5, 60))
            response.raise_for_status()
        except requests.RequestException:
            continue

        title, body, published = extract_text(
            response.text,
            target.content_selectors,
            target.title_selectors,
            target.strip_selectors,
            target.date_selectors,
        )

        if len(body.split()) < 50:
            continue

        text = f"{title}\n\n{body}"
        metadata = {
            "source": url,
            "label": target.seed_label,
            "category": target.seed_category or "uncategorized",
            "title": title,
            "fetched_at": datetime.now(timezone.utc).isoformat(),
        }
        if published:
            metadata["published"] = published
        harvested.append((text, metadata))

        if depth >= target.max_depth:
            continue

        soup = BeautifulSoup(response.text, "html.parser")
        for anchor in soup.find_all("a", href=True):
            href = anchor["href"].strip()
            if href.startswith("#"):
                continue
            next_url = urljoin(url, href)
            if next_url in visited:
                continue
            if not matches_any(target.follow_patterns, next_url):
                continue
            if matches_any(target.exclude_patterns, next_url):
                continue
            to_visit.append((next_url, depth + 1))

        if target.rate_limit_seconds:
            time.sleep(target.rate_limit_seconds)

    return harvested


def rebuild_corpus() -> None:
    targets = build_targets()
    all_docs: List[str] = []
    all_metas: List[Dict[str, str]] = []

    for target in targets:
        documents = crawl_target(target)
        for text, metadata in documents:
            all_docs.append(text)
            all_metas.append(metadata)

    if not all_docs:
        raise RuntimeError("No documents harvested. Check seed configuration or connectivity.")

    DOCS_PATH.write_text(json.dumps(all_docs, ensure_ascii=False, indent=2), encoding="utf-8")
    METAS_PATH.write_text(json.dumps(all_metas, ensure_ascii=False, indent=2), encoding="utf-8")

    model = SentenceTransformer("BAAI/bge-small-en-v1.5")
    embeddings = model.encode(all_docs, normalize_embeddings=True, batch_size=32)
    embeddings = embeddings.astype("float32")

    dim = embeddings.shape[1]
    index = faiss.IndexFlatIP(dim)
    index.add(embeddings)
    faiss.write_index(index, str(INDEX_PATH))


if __name__ == "__main__":
    rebuild_corpus()
