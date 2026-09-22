# Linked URL Shortener — Frontend Build Guide (for any AI assistant)

> Goal: Build a frontend in `frontend/` for the existing backend in `backend/`.
> This document is the single source of truth. Any AI model should follow it step-by-step without needing to inspect backend code (but references are included).

---

## 1. Project Context

**What it is:** `Linked` — a production-style URL shortener API.

**Backend stack (already done, do NOT rebuild):**

- Node.js + TypeScript + Express 5
- Prisma 7 + PostgreSQL
- Zod validation, pino logging, express-rate-limit, helmet, cors, compression
- Vitest + Supertest
- Swagger docs at `http://localhost:3000/api-docs`, spec at `http://localhost:3000/openapi.json` and `backend/openapi.yaml`

**Frontend status:** `frontend/` is currently empty. You are to scaffold and build it.

**Backend base URL:**

- Dev: `http://localhost:3000`
- No authentication. All endpoints are public.
- CORS: controlled by backend `CORS_ORIGIN` env (default `*`). If frontend runs on e.g. `http://localhost:5173`, set backend `.env` to `CORS_ORIGIN=http://localhost:5173` and restart backend.

**How to run backend (tell user / AI to do this first):**

```bash
docker-compose up -d
cd backend
cp .env.test.example .env   # fill DATABASE_URL, e.g. postgresql://postgres:postgres@localhost:5432/Linked
npm install
npx prisma migrate deploy
npm run dev                  # runs on PORT (default 3000)
```

Health check: `GET http://localhost:3000/health` → `{"status":"ok","database":"connected"}`

---

## 2. Full API Contract (must implement against this)

Base: `http://localhost:3000`. All JSON uses `Content-Type: application/json`.

### 2.1 Data Models (TypeScript types to create in frontend)

```ts
interface Link {
  id: number;
  shortCode: string;
  originalUrl: string;
  clickCount: number;
  createdAt: string; // ISO date-time
  updatedAt: string; // ISO date-time
}

interface CreateLinkResponse {
  id: number;
  shortCode: string;
  originalUrl: string;
  createdAt: string;
}

interface Click {
  id: number;
  createdAt: string;
  referrer: string | null;
  userAgent: string | null;
  ipAddress: string | null; // only in /clicks, not in analytics.recentClicks
}

interface ClicksByDay {
  day: string;
  count: number;
} // day: "YYYY-MM-DD"

interface LinkAnalytics {
  id: number;
  shortCode: string;
  originalUrl: string;
  totalClicks: number;
  recentClicks: Array<Omit<Click, "ipAddress">>;
  clicksByDay: ClicksByDay[];
}

interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface PaginatedLinks {
  data: Link[];
  meta: PaginationMeta;
}
interface PaginatedClicks {
  data: Click[];
  meta: PaginationMeta;
}

interface ErrorResponse {
  error: { message: string };
}
interface ValidationErrorResponse {
  error: {
    message: "Validation failed";
    details: Array<{ path: string; message: string }>;
  };
}
```

Short URL construction (frontend must do this): `${BACKEND_URL}/${shortCode}`
Example: `http://localhost:3000/Ab3xK9`

### 2.2 Endpoints

#### POST /api/links — Create shortened link

Request: `{ "originalUrl": "https://example.com/some/very/long/path" }`

- `originalUrl` required, must be valid URL (include `https://`).
- Success `201`: `CreateLinkResponse`
- Error `422`: `ValidationErrorResponse`
- Used by: shorten form.

#### GET /api/links?page=1&limit=20&sortBy=createdAt&sortOrder=desc&search=... — List links

Query params:

- `page`: int >=1, default 1
- `limit`: int 1-100, default 20
- `sortBy`: `createdAt | clickCount | originalUrl`, default `createdAt`
- `sortOrder`: `asc | desc`, default `desc`
- `search`: optional, case-insensitive match on `originalUrl` or `shortCode`
- Success `200`: `PaginatedLinks`
- Error `422` on invalid params.
- Used by: dashboard list with search/sort/pagination.

#### GET /api/links/:id — Get link by ID

- `:id` must match `^\d+$`, else `422`.
- Success `200`: `Link`
- Error `404`: `{error:{message:"Link not found"}}`
- Used by: detail view fallback.

#### PUT /api/links/:id — Update destination URL

Request: same as POST `{ originalUrl }`

- Success `200`: `Link`
- Errors: `404`, `422`
- Used by: edit modal.

#### DELETE /api/links/:id — Delete link

- Success `204` (no body). Frontend must handle empty response, remove from list optimistically with confirm dialog.
- Errors: `404`, `422`

#### GET /api/links/:id/analytics — Aggregated analytics

- Success `200`: `LinkAnalytics`
- Errors: `404`, `422`
- Used by: detail page header + chart + recent clicks table.
- Note: `totalClicks` should equal `Link.clickCount`. `clicksByDay` may be empty.

#### GET /api/links/:id/clicks?page=1&limit=20 — Raw click history (paginated)

- Success `200`: `PaginatedClicks`
- Errors: `404`, `422`
- Used by: detail page click-history table with pagination.

#### GET /:shortCode — Redirect (do NOT call via fetch/axios)

- Records click (IP, UA, referrer) then `302` to `originalUrl`.
- `404` if unknown code.
- Frontend usage: render as normal `<a href="${BACKEND_URL}/${shortCode}" target="_blank">`. Do NOT `fetch()` it (CORS + redirect handling). To test, open in new tab.

#### GET /health — Liveness probe

- `200`: `{status:"ok", database:"connected"}`
- `503`: `{status:"error", database:"disconnected"}`
- Used by: optional status badge / banner.

### 2.3 Error handling rules (frontend must implement)

- `422`: show `error.details[].message` per field if available, else generic. For create/update form, map `originalUrl` errors inline.
- `404`: show "Link not found / Short link not found".
- `429` (rate limit): backend limits are `RATE_LIMIT_MAX` (default 100/min for `/api/*`) and `REDIRECT_RATE_LIMIT_MAX` (default 300/min for redirects). Show "Too many requests, try again shortly".
- Network failure: show retry UI.
- `DELETE 204`: no JSON to parse — do not call `.json()`.

### 2.4 Validation to mirror in frontend (before calling API)

- `originalUrl`: required, valid `http(s)` URL. Auto-prepend `https://` if user omits scheme (optional but recommended), then validate with `new URL()`.
- `page/limit`: coerce to numbers, clamp `limit` 1-100.
- Copy backend messages: `"originalUrl must be a valid URL"`, `"id must be a positive integer"`.

---

## 3. Frontend Requirements

### 3.1 Recommended stack (AI: ask user if they want different, else use this)

- React + Vite + TypeScript (or Next.js if user wants SSR — default to Vite SPA for simplicity).
- Styling: Tailwind CSS or plain CSS modules. Keep it clean/responsive.
- Data fetching: native `fetch` + small `apiClient` wrapper, or `axios`. No auth headers needed.
- Charts: lightweight — custom SVG bars or `recharts` for `clicksByDay`. Do not over-engineer.
- Config: `VITE_API_BASE_URL` env (default `http://localhost:3000`). Example `.env.example`: `VITE_API_BASE_URL=http://localhost:3000`.

### 3.2 Required pages / views (minimum viable)

1. **Home / Shorten (`/`)**
   - Input for long URL + "Shorten" button.
   - On `201`: show result card with short URL (`{BASE}/{shortCode}`), original URL, copy-to-clipboard button, "View stats" link, QR optional.
   - Inline validation + API error display. Loading state. Disable button while pending.
2. **Dashboard / All Links (`/links` or same page section)**
   - Table/cards: short URL (clickable, copy btn), original URL (truncated), clicks, created date, actions (stats, edit, delete).
   - Search box (debounced ~300ms → `search` param), sort dropdowns (`sortBy`, `sortOrder`), pagination controls using `meta` (`hasNextPage/hasPreviousPage`, `totalPages`, `totalItems`).
   - Empty state, loading skeleton, error + retry.
3. **Link Detail / Analytics (`/links/:id`)**
   - Header: short URL + copy + open, original URL, total clicks, created/updated dates, edit + delete actions.
   - Chart: clicks per day (`clicksByDay`) — bar/line. Handle empty array with "No clicks yet".
   - Recent clicks list (`recentClicks` from analytics).
   - Full click history table (`GET /:id/clicks` with own pagination): date, referrer, userAgent (truncated), ipAddress.
4. **404 / Not Found** for bad `:id` or `:shortCode` resolution failure.
5. (Optional) Health badge in footer/header via `GET /health`.

### 3.3 Required components / utilities

- `apiClient`: baseURL from env, JSON headers, helper that throws typed errors for 404/422/429, special-cases 204.
  ```ts
  // Example contract AI should implement:
  // apiFetch<T>(path: string, options?: RequestInit): Promise<T>
  // listLinks(params), createLink(url), getLink(id), updateLink(id,url),
  // deleteLink(id), getAnalytics(id), getClicks(id,page,limit)
  ```
- `CopyButton` (navigator.clipboard with fallback).
- `Pagination`, `SearchInput`, `SortSelect`, `LinkForm` (create/edit), `DeleteConfirm`, `ClicksChart`, `ErrorBanner`, `LoadingSkeleton`.
- Date formatting: `Intl.DateTimeFormat` / `toLocaleString`. Truncate long URLs with ellipsis + `title` tooltip.

### 3.4 UX / edge cases checklist

- [ ] Empty `originalUrl` → inline error, no API call.
- [ ] Invalid URL → show backend-equivalent message.
- [ ] After create, prepend new link to dashboard list or refetch page 1.
- [ ] After edit, update list + detail.
- [ ] After delete, remove from UI, redirect from detail to dashboard, toast confirm.
- [ ] Copy uses full absolute short URL, not just code.
- [ ] External short links use `<a target="_blank" rel="noopener">`, never `fetch`.
- [ ] Pagination resets to page 1 on search/sort change.
- [ ] Handle `limit` max 100, default 20.
- [ ] Responsive mobile layout. Accessible labels, keyboard focus, button disabled states.

---

## 4. Step-by-Step Tasks (AI: execute in order)

1. **Scaffold:** Init Vite React-TS app in `frontend/` (keep repo root files). Add `.env.example`, update `frontend/README` if needed. Install deps.
2. **API layer:** Create `src/lib/api.ts` with types from §2.1 + all functions from §2.2 + error handling from §2.3. Base URL from `import.meta.env.VITE_API_BASE_URL`.
3. **Shorten flow:** Build home form → `POST /api/links` → result card + copy.
4. **Dashboard:** List with search/sort/pagination → `GET /api/links`.
5. **Detail:** Route `/links/:id` → parallel `GET /api/links/:id` + `GET /:id/analytics` + `GET /:id/clicks`. Add edit (`PUT`) + delete (`DELETE`) + chart.
6. **Polish:** Loading/error/empty states, toasts, responsive CSS, health badge.
7. **Verify:** Run backend + frontend together, manually test all CRUD + analytics + redirect in browser, test 404/422/429 paths. Run `npm run build` / `tsc` clean.

**Do NOT:** change backend code, add auth, or assume endpoints not listed in `backend/openapi.yaml`.

---

## 5. Acceptance Criteria (definition of done)

- `VITE_API_BASE_URL` configurable; defaults to `http://localhost:3000`.
- User can shorten, list, search, sort, paginate, edit, delete, view analytics + click history, copy/open short links.
- All API errors (422/404/429/network) show user-friendly messages; no unhandled promise rejections; `204` handled.
- `npm run dev` + `npm run build` work in `frontend/`.
- Code is TypeScript-typed (no `any` for API models), small components, no secrets committed.

---

## 6. Copy-Paste Prompt (user: paste this + this file to any AI)

> Build the frontend for my URL shortener using FRONTEND_BUILD_GUIDE.md as the spec.
> Backend is already running at http://localhost:3000 per backend/openapi.yaml.
> Scaffold a React+Vite+TS app in frontend/ (or continue existing one), implement the apiClient + Home/Shorten + Dashboard + Detail/Analytics pages per §3-§4, handle all errors per §2.3, and verify with build. Ask me only for: (1) React+Vite vs Next.js, (2) Tailwind vs plain CSS, (3) my backend URL if not localhost:3000.

---

## 7. References

- `backend/openapi.yaml` — canonical endpoint/schema docs
- `backend/src/app.ts` — CORS, rate-limit, route mounting (`/api/links`, `/:shortCode`, `/health`, `/api-docs`)
- `backend/src/routes/link.routes.ts` — route list
- `backend/src/validators/link.validator.ts` — validation rules/messages
- `backend/src/controllers/link.controllers.ts` — exact response shapes/status codes
- `backend/prisma/schema.prisma` — Link/Click models
- `backend/src/config/env.ts` — PORT, CORS_ORIGIN, rate-limit envs
