# Architecture

DevKnowledge AI is a two-component application backed by PostgreSQL and DigitalOcean managed services.

```text
React static site → Express API → DigitalOcean Spaces
                         ├──────→ DigitalOcean Inference
                         └──────→ PostgreSQL + pgvector
```

During ingestion, Express validates and extracts the in-memory upload, creates overlapping text chunks, requests embeddings in batches, stores the private original in Spaces, then saves metadata and vectors in one SQL transaction. If persistence fails, the uploaded object is removed.

During chat, the API embeds the question and performs cosine search across all chunks. The five closest chunks are labeled and sent to the answer model. User/assistant messages and the exact retrieved citations are committed together under an anonymous browser-session UUID.

The API never returns Spaces keys or credentials. Errors use a stable JSON envelope, and model output is accompanied by server-derived structured citations rather than trusted to invent its own source metadata.

