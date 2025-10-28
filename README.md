# Military Spouse Job Connect - AI Chatbot Frontend

A React.js frontend application for an AI chatbot designed to help military spouses connect with job opportunities and career resources.

## Running the full stack

1. **Back-end (Python RAG service)**
   ```bash
   cd CHATBOT
   source venv/bin/activate  # or `pip install -r requirements.txt`
   python server.py          # serves FastAPI on http://localhost:8000
   ```
   The chatbot endpoint is exposed at `POST /api/chat` and returns JSON with `reply` and `sources`.

2. **Front-end (React)**
   ```bash
   npm install
   REACT_APP_RAG_API_URL=http://localhost:8000/api/chat npm start
   ```
   The React widget will POST user prompts to the Python backend and stream responses back into the chat window.

## Curated Fort Moore seed list

All crawl sources live in `CHATBOT/seed_config.json`. Add or edit entries there to expand the Fort Moore corpus (each seed controls allowed domains, follow patterns, crawl depth, etc.).

## Rebuilding the RAG corpus and index

Run the automated crawler/encoder to update `docs.json`, `metas.json`, and the FAISS index from the seed plan:
```bash
source CHATBOT/venv/bin/activate
python -m CHATBOT.build_corpus
```
> **Heads-up:** This issues live HTTP requests to the Fort Moore resource sites. Respect the configured rate limits, and expect the run to take a few minutes while documents are fetched and embedded.
