# DevKnowledge AI

A production-style full-stack retrieval-augmented generation application. Upload text, Markdown, or PDF documents and ask questions whose answers are grounded in semantically retrieved source chunks.

## Features

- Private originals in DigitalOcean Spaces
- Text extraction, overlapping chunking, and batched Qwen3 embeddings
- PostgreSQL metadata, browser-session chat history, and pgvector cosine search
- Grounded DeepSeek answers with persisted source citations
- Responsive React UI with upload, loading, retry, history, and citation states
- Validated configuration, bounded upstream calls, request logging, transactional writes, and graceful shutdown

## Stack and structure

- `frontend/` — React, Vite, TypeScript, plain CSS
- `backend/` — Express, TypeScript, PostgreSQL, pgvector, AWS S3 client, OpenAI-compatible inference client
- `docs/` — [architecture](docs/architecture.md), [local setup](docs/setup.md), and [deployment](docs/deployment.md)

## Quick start

See [docs/setup.md](docs/setup.md). Each application is independently installable:

```bash
cd backend
npm install
npm run migrate
npm run dev
```

```bash
cd frontend
npm install
npm run dev
```

The backend listens on port 8080 by default and exposes `GET /health`, `POST /documents/upload`, `GET /documents`, `POST /chat`, and `GET /chat/history`.

## Configuration

Copy both `.env.example` files and never commit real secrets. Backend settings cover PostgreSQL, Spaces, DigitalOcean Inference, allowed frontend origins, upload size, chunk size/overlap, retrieval count, environment, and port. The frontend requires `VITE_API_BASE_URL`.

Qwen3 Embedding 0.6B produces 1,024-dimensional vectors in this integration. Changing embedding models requires changing `vector(1024)` in the migration, recreating the HNSW index, and re-embedding existing documents; changing only the model environment value is unsafe.

## Quality commands

Run `npm test` and `npm run build` at the repository root, or use `test`, `typecheck`, and `build` inside either application. Set `TEST_DATABASE_URL` when adding/running database integration tests against a disposable pgvector-enabled database.

## v1 boundaries

The app is a single-user portfolio demo without authentication. Each tab has an anonymous session UUID, retrieval searches all documents, uploads are synchronous, and scanned PDFs are unsupported because OCR is not included. Queues, streaming, document deletion, access controls, and hybrid/reranked search are sensible future improvements.

For App Platform component settings and managed-service preparation, see [docs/deployment.md](docs/deployment.md).

