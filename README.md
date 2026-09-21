# Linked

A production-style URL shortener API, built in phases: CRUD → validation → analytics → pagination → testing → docs → hardening → CI/CD → containerization → Kubernetes → AWS-style architecture.

## Stack

- Node.js, TypeScript, Express 5
- Prisma 7 + PostgreSQL
- Zod validation
- Vitest + Supertest
- pino structured logging

## Getting started

```bash
docker-compose up -d          # Postgres on :5432
cd backend
cp .env.test.example .env     # fill in DATABASE_URL
npm install
npx prisma migrate deploy
npm run dev
```

API docs: `http://localhost:3000/api-docs`
Health check: `http://localhost:3000/health`

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

## Project structure

```
backend/          — the API (see backend/openapi.yaml for endpoint docs)
.github/          — issue/PR templates, CI workflows
docker-compose.yml — local Postgres
```

## Phases

See project tracking for the full phase breakdown (CRUD → hardening → CI/CD → Docker → K8s → AWS-style architecture).

## License

MIT — see [LICENSE](./LICENSE).
