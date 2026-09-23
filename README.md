# Linked

A production-style URL shortener, built in phases: CRUD → validation → analytics → pagination → testing → docs → hardening → CI/CD → containerization → Kubernetes → AWS architecture.

## Stack

- Backend: Node.js, TypeScript, Express 5, Prisma 7 + PostgreSQL, Zod, Vitest + Supertest, pino
- Frontend: React 19 + Vite + TypeScript, React Router 7, Tailwind CSS 4 (see `frontend/README.md`)
- Infra: Docker Compose, GitHub Actions, Terraform + AWS (Phase 13+)

## Getting started

```bash
docker-compose up -d          # Postgres on :5432
cd backend
cp .env.test.example .env     # fill in DATABASE_URL, e.g. postgresql://postgres:postgres@localhost:5432/Linked
npm install
npx prisma migrate deploy
npm run dev                   # API on :3000
```

```bash
cd frontend
cp .env.example .env          # VITE_API_BASE_URL=http://localhost:3000
npm install
npm run dev                   # SPA on :5173 (set backend CORS_ORIGIN=http://localhost:5173)
```

Or run everything containerized:

```bash
docker compose up --build     # API :3000, SPA :8080 (nginx), Postgres :5432
```

API docs: `http://localhost:3000/api-docs`
Health checks: `http://localhost:3000/health` (API), footer badge in SPA (polls `/health`).

## Repo tooling (root)

```bash
npm install        # husky, eslint, prettier, commitlint
npm run lint
npm run format
```

Git hooks run lint-staged on commit and commitlint on commit message.

## Testing

```bash
cd backend
npm test
```

Requires a `LinkedTest` database (`docker-compose` provisions it automatically via `backend/docker/init-test-db.sh`).

Frontend checks:

```bash
cd frontend
npm run lint
npm run build    # tsc -b && vite build (typecheck + prod build)
```

## Project structure

```
backend/          — the API (see backend/openapi.yaml for endpoint docs)
frontend/         — the SPA (see frontend/README.md + frontend/FRONTEND_BUILD_GUIDE.md)
.github/          — issue/PR templates, CI workflows
docker-compose.yml — local Postgres + API + SPA
plan.md           — full phase breakdown (Phases 1–15, incl. 9.5 frontend retro-fit)
```

## Phases

See `plan.md` for the full phase breakdown (CRUD → hardening → CI/CD → Docker → K8s → AWS architecture).

## License

MIT — see [LICENSE](./LICENSE).
