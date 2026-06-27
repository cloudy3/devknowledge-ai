# DigitalOcean App Platform deployment

1. Provision a PostgreSQL 13+ database and run `CREATE EXTENSION vector;` (the migration does this when the application user has permission).
2. Create a private Space and an access key with read/write access. Configure browser CORS only if clients will access Spaces directly; this application does not.
3. Create a Gradient AI model access key with access to the configured embedding and answer models.
4. Add the repository to App Platform with two components:
   - **Web service**: source directory `backend`, build `npm ci && npm run build`, run `npm start`, HTTP port `8080`, health check `/health`.
   - **Static site**: source directory `frontend`, build `npm ci && npm run build`, output directory `dist`.
5. Add all backend values from `backend/.env.example` as encrypted runtime variables. Set `DATABASE_URL` from the database bindable variable and `FRONTEND_ORIGIN` to the static site's public URL.
6. Set frontend build variable `VITE_API_BASE_URL` to the web service's public URL.
7. Run `npm run migrate` from a backend job or local trusted machine against the production database before serving traffic.

App Platform supplies `PORT`; the API binds to it. For custom database CA verification, remove the pragmatic `rejectUnauthorized: false` setting and provide the managed database CA certificate.

