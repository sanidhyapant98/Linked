# Linked — Full Project Plan (Phases 1–15, Revised for Real AWS)

> Status as of 2026-09-23: Phases 1–9 done + frontend built ad-hoc.
> Revision: drop Floci/LocalStack simulation (old Phase 13), deploy to real AWS Free Tier.
> Strategy: K8s learned locally (kind/minikube), production on ECS Fargate + RDS + S3/CloudFront.

Stack: Node.js + TypeScript + Express 5, Prisma 7 + PostgreSQL, Zod, Vitest + Supertest,
pino, React + Vite + TS + Tailwind, Docker, GitHub Actions, Terraform, AWS (ECR, ECS Fargate, RDS, S3, CloudFront, ALB, Secrets Manager, CloudWatch).

---

## Phase 1 — Improve Link Management ✅ DONE

Focus: More complete CRUD.

- [x] POST /api/links — create short link
- [x] GET /api/links — list links
- [x] GET /api/links/:id — get by ID
- [x] PUT /api/links/:id — update destination
- [x] DELETE /api/links/:id — delete (204)
- [x] GET /:shortCode — 302 redirect + click record
- [x] Prisma Link/Click models + migrations

Outcome: full CRUD + redirect works locally.

## Phase 2 — Validation & Error Handling ✅ DONE

Focus: Production-quality API behavior.

- [x] Zod validators (`backend/src/validators/`)
- [x] 422 ValidationError shape `{ error: { message, details[] } }`
- [x] 404 `{ error: { message: "Link not found" } }`
- [x] Central error middleware, no unhandled rejections
- [x] Frontend mirrors messages (`FRONTEND_BUILD_GUIDE.md` §2.3–2.4)

Outcome: predictable 404/422/429/network contract.

## Phase 3 — Proper Click/Analytics Model ✅ DONE

Focus: Real analytics architecture.

- [x] Click table: id, createdAt, referrer, userAgent, ipAddress
- [x] clickCount denormalized on Link
- [x] GET /api/links/:id/analytics → `{ totalClicks, recentClicks, clicksByDay }`
- [x] GET /api/links/:id/clicks (paginated raw history)
- [x] Frontend detail page: header + chart + recent + full history table

Outcome: aggregated + raw analytics, empty-state safe.

## Phase 4 — Pagination & API Design ✅ DONE

Focus: Scalable APIs.

- [x] `?page&limit&sortBy&sortOrder&search` on GET /api/links
- [x] `sortBy: createdAt | clickCount | originalUrl`, `limit` 1–100 default 20
- [x] `{ data, meta: { page, limit, totalItems, totalPages, hasNextPage, hasPreviousPage } }`
- [x] Paginated GET /:id/clicks
- [x] Frontend: debounced search (~300ms), sort selects, pagination resets to page 1 on filter change

Outcome: list endpoints scale, frontend uses `meta` correctly.

## Phase 5 — Testing ✅ DONE

Focus: Confidence in application behavior.

- [x] Vitest + Supertest (`backend/src/tests/`)
- [x] Covers CRUD, 404/422, pagination, analytics, redirect, /health
- [x] `LinkedTest` DB via `backend/docker/init-test-db.sh`
- [x] `cd backend && npm test` green in CI (Postgres service)

Outcome: regressions caught pre-merge.

## Phase 6 — API Documentation ✅ DONE

Focus: Professional API contract.

- [x] `backend/openapi.yaml` canonical spec
- [x] Swagger UI at `/api-docs` + `/openapi.json`
- [x] `FRONTEND_BUILD_GUIDE.md` §2 as consumer contract
- [ ] TODO (moved to 9.5): update root + frontend READMEs (currently stale/template)

Outcome: backend contract documented; frontend docs pending polish.

## Phase 7 — Application Hardening ✅ DONE (backend)

Focus: Security, logging, configuration.

- [x] helmet, cors (`CORS_ORIGIN`), compression
- [x] express-rate-limit (separate `/api/*` 100/min + redirect 300/min → 429)
- [x] pino + pino-http structured logging, graceful shutdown (`backend/src/index.ts`)
- [x] `backend/src/config/env.ts` — PORT, DATABASE_URL, CORS, rate limits, LOG_LEVEL
- [x] No secrets committed (`.env`, `.env.test` gitignored)

Outcome: backend hardened; frontend/compose hardening → Phase 9.5/10.

## Phase 8 — Git/GitHub Workflow ✅ DONE

Focus: Prepare repository for CI/CD.

- [x] Conventional commits + commitlint + husky + lint-staged
- [x] ESLint + Prettier + `.nvmrc`
- [x] Issue/PR templates, CODEOWNERS, CONTRIBUTING.md
- [x] `main` branch protection (PR + CI required — verify in GitHub settings)

Outcome: clean collaboration workflow.

## Phase 9 — GitHub Actions CI/CD ✅ DONE (CI only, CD → Phase 14)

Focus: Automated build/test.

- [x] `.github/workflows/ci.yml`: changes filter → root lint/format, backend test+build (Postgres service), frontend lint+build
- [x] Concurrency cancel-in-progress, `contents: read`
- [ ] TODO (Phase 14): `deploy.yml` for AWS (OIDC → ECR → ECS/RDS/S3/CF)

Outcome: CI green on PRs; CD not yet built.

---

## Phase 9.5 — Frontend Retro-fit (NEW, 1–2 days)

Why: frontend was built outside the phase plan; bring it to Phase 2/5/6/7 bar.

- [ ] Config: `VITE_API_BASE_URL` defaults to `http://localhost:3000`, `.env.example` present
- [ ] `src/lib/api.ts`: typed `apiFetch<T>`, helpers (list/create/get/update/delete/analytics/clicks), 204 no-`.json()`, 404/422/429 typed errors
- [ ] Pages: Home shorten (`/`) + Dashboard (`/links`) + Detail (`/links/:id`) + 404; health badge optional
- [ ] UX checklist per `FRONTEND_BUILD_GUIDE.md` §3.4 (inline validation, copy full short URL via `<a target="_blank">` not fetch, optimistic delete + redirect, skeletons/toasts, responsive/a11y)
- [ ] Docs: rewrite `frontend/README.md` (remove Vite template), update root `README.md` with frontend run/build/compose instructions
- [ ] Verify: `cd frontend && npm run dev`, `npm run build` (`tsc -b && vite build`) clean; manual CRUD + search/sort/paginate + analytics + redirect + 404/422/429 paths against local backend

Outcome: frontend production-quality, documented, verifiable.

---

## Phase 10 — Docker Production-Ready (70% done → finish)

Focus: containerize application, pushable to ECR.

Current: `backend/Dockerfile` (multi-stage, `migrate deploy && node dist/index.js`),
`frontend/Dockerfile` (node build → nginx SPA), `docker-compose.yml` (db + backend + frontend).

- [ ] Backend: add `HEALTHCHECK` (`/health`), non-root `USER`, confirm `dist/` + pruned prod deps, `.dockerignore` covers `node_modules/dist/.env/prisma/migrations` noise
- [ ] Frontend: `ARG VITE_API_BASE_URL` baked correctly per env; nginx gzip + SPA `try_files` + 1y immutable assets (already in `frontend/nginx.conf`) — add security headers + `HEALTHCHECK`
- [ ] Compose: `db` healthcheck (`pg_isready`), backend `depends_on: healthy`, pinned `postgres:17-alpine`, named volume `postgres_data`, prod-parity envs (PORT, DATABASE_URL, CORS_ORIGIN, RATE_LIMIT_*, LOG_LEVEL, ENABLE_API_DOCS)
- [ ] Verify: `docker compose up --build -d`, `curl localhost:3000/health`, `curl localhost:8080`, `docker compose down -v` clean rebuild
- [ ] AWS prep: create ECR repos `linked-backend`, `linked-frontend` (or skip frontend image if going S3 — decide in Phase 13); `aws ecr get-login-password | docker login`, tag `:sha`, push

Outcome:lean, healthy images; compose parity; ECR push proven.

---

## Phase 11 — Kubernetes Fundamentals (local-only, $0)

Focus: Deploy application to K8s (learn, don't pay).

Tool: `kind` or `minikube` + `kubectl`. Do NOT create EKS here (control plane ~$73/mo, not Free Tier).

- [ ] `k8s/namespace.yaml`, `postgres.yaml` (Deployment+Service or StatefulSet, PVC — dev only), `backend.yaml` (Deployment 2 replicas + ClusterIP Service, env from ConfigMap/Secret), `frontend.yaml` (Deployment + Service), `ingress.yaml` (nginx ingress → `/` frontend, `/api` + `/:shortCode` backend)
- [ ] Probes: liveness/readiness on `GET /health`; `initialDelaySeconds` tuned for Prisma migrate
- [ ] Config: `ConfigMap` (PORT, CORS_ORIGIN, LOG_LEVEL) + `Secret` (DATABASE_URL — `kubectl create secret`, never commit)
- [ ] Practice: `apply`, `get pods/svc/ingress`, `logs -f`, `port-forward`, `scale --replicas=3`, `rollout restart`, `exec` psql check
- [ ] Migrations: `kubectl create job migrate --image=<backend>:<sha> -- npx prisma migrate deploy` pattern

Outcome: can deploy/debug/scale full stack on local K8s.

## Phase 12 — Kubernetes Production Concepts (local-only)

Focus: Make deployment realistic (portfolio-ready manifests, still $0).

- [ ] `resources: requests/limits` on all containers; HPA (CPU 70%, min 2 max 5) on backend; PDB `minAvailable: 1`
- [ ] `startupProbe` for slow DB connect; graceful `terminationGracePeriodSeconds: 30` (matches `backend/src/index.ts` shutdown)
- [ ] Immutable tags (`image: <ecr>/<app>:<sha>`, `imagePullPolicy: IfNotPresent`), `readOnlyRootFilesystem` where possible, non-root, `ServiceAccount` per app
- [ ] Environment separation: `k8s/base/` + `k8s/overlays/dev|prod` (kustomize) or `values-dev/prod.yaml` (helm) — pick one
- [ ] Optional stretch (same-day cleanup): one ephemeral EKS `t3.small` to prove manifests work in cloud, then destroy
- [ ] Verify: `kubectl top`, HPA scale under load, pod kill → self-heal, `kustomize build` / `helm template` clean

Outcome: realistic, secure manifests without an EKS bill.

---

## Phase 13 — AWS Foundations + Terraform (replaces old Floci phase)

Focus: Real Free-Tier IaC baseline. No simulation.

Recommended prod (Free Tier safe): **ECS Fargate + RDS + S3/CloudFront**.
Why not EKS prod: control-plane + NAT + LB costs blow Free Tier. Why S3/CF for frontend: ~$0 vs always-on Fargate nginx.

- [ ] IAM: admin with MFA, GitHub OIDC provider → deploy role (no long-lived keys), least-privilege dev group, `aws configure sso`
- [ ] Network (`infra/` Terraform): VPC (2 AZs, public/private), IGW, NAT (note: NAT costs — use single NAT or public-subnet Fargate for learning, document trade-off), ALB SG + ECS SG + RDS SG (least ingress)
- [ ] Data: RDS Postgres `db.t3.micro`, 20GB gp2, private subnets, automated snapshots; `DATABASE_URL` in Secrets Manager/SSM Parameter Store (never in TF state plaintext)
- [ ] Compute: ECR repos, ECS Fargate cluster + task defs (backend `256 CPU / 512 MB`, `awslogs` to CloudWatch), ALB listener (HTTP 80 → target ` /health`), target-tracking autoscaling
- [ ] Static: S3 private bucket + CloudFront OAC + `VITE_API_BASE_URL=https://<alb-or-api-domain>` baked at build; ACM cert + Route 53 optional (custom domain stretch)
- [ ] Cost guards: Budgets + billing alarm ($5), `terraform plan` cost review, tagging `Project=Linked`
- [ ] Verify: `terraform init/validate/plan/apply` in `infra/`; ALB `/health` → `{"status":"ok"}`, RDS connectivity from ECS exec, CF serves frontend

Outcome: reproducible Free-Tier infra in code.

## Phase 14 — CI/CD to AWS (CD)

Focus: push to main → AWS.

- [ ] `.github/workflows/deploy.yml` (OIDC `id-token: write` → `aws-actions/configure-aws-credentials` with role ARN, no stored secrets):
  1. backend: `npm ci && npm test && docker build/tag/push ECR:<sha>`
  2. migrate: one-off `aws ecs run-task` → `npx prisma migrate deploy` (fail deploy on migrate fail)
  3. backend deploy: `aws ecs update-service --force-new-deployment`, wait stable
  4. frontend: `VITE_API_BASE_URL=<prod-url> npm run build && aws s3 sync dist/ s3://<bucket> && aws cloudfront create-invalidation`
- [ ] Environments: `staging` auto-deploy, `prod` manual approval (`environment: prod`)
- [ ] Image hygiene: ECR lifecycle (keep last 10), immutable `:sha` + moving `:latest-staging`
- [ ] Verify: staging deploy green, `migrate deploy` logs in CloudWatch, CF invalidation completes, rollback via previous task-def revision documented

Outcome: automated, auditable, rollback-capable releases.

## Phase 15 — Final Capstone (end-to-end production workflow)

Focus: Prove + present + protect wallet.

- [ ] Live test matrix: shorten → list/search/sort/paginate → edit → analytics + clicks → copy/open redirect (new tab) → delete → 404/422/429 handling; via `https://<cloudfront>` + `https://<alb-or-api>/health`
- [ ] Observability: CloudWatch logs insights (pino JSON), ALB 5xx + ECS CPU + RDS connections alarms, uptime check
- [ ] Docs: root `README.md` architecture diagram (CF → S3, ALB → ECS → RDS/Secrets), env table, runbooks (deploy, migrate, rollback, `terraform destroy`), cost table + Free-Tier limits
- [ ] Security pass: ALB HTTPS redirect (ACM), S3 block-public-access, RDS non-public, Secrets rotation note, CORS locked to CF domain, rate limits tuned for ALB
- [ ] Cleanup drill (mandatory on Free Tier): `terraform destroy`, delete ECR images, empty S3/CF, snapshot delete, confirm $0 in Billing; record demo GIF/screenshots before destroy
- [ ] Portfolio: repo pinned, live URLs (or post-destroy screenshots), phase summary in README

Outcome: hire-ready production story with cost discipline.

---

## Appendix A — What was dropped/changed and why

- Old Phase 13 (Floci/LocalStack): dropped — real AWS access available; simulation adds no value now.
- Old Phase 10–12 Docker/K8s-to-AWS: split — Docker finishes locally, K8s stays local for learning, prod goes ECS (Free-Tier reality).
- Frontend: inserted as Phase 9.5 since it was built out-of-plan and needs hardening/docs.

## Appendix B — Free-Tier cost watchlist

- EKS control plane NOT free (~$73/mo) — keep EKS ephemeral or skip prod EKS.
- NAT Gateway (~$32/mo + data) — prefer single NAT or public Fargate for learning; document.
- RDS `db.t3.micro` 750h + 20GB + ALB 750h are Free-Tier-eligible (12mo) — still set billing alarms.
- ECR: 500MB private storage free (12mo); S3/CF: 5GB + 1M req + 50GB out/in + 1TB CF out (12mo/ongoing splits) — plenty for this app.
- Always `terraform destroy` + verify Billing Explorer $0 after capstone demo.
