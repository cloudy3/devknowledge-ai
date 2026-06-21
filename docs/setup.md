# Local setup

Prerequisites: Node.js 22+, npm, PostgreSQL 13+ with pgvector, a DigitalOcean Space, and an Inference model access key.

1. Create a database, ensure the application role may create extensions, then copy `backend/.env.example` to `backend/.env` and fill in credentials.
2. In `backend`, run `npm install`, `npm run migrate`, and `npm run dev`.
3. Copy `frontend/.env.example` to `frontend/.env`; in `frontend`, run `npm install` and `npm run dev`.
4. Open `http://localhost:5173`.

Real `.env` files are ignored. The upload request remains open while inference runs, so App Platform request timeouts and model latency should be watched for large documents.

