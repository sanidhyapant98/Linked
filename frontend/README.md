# Linked Frontend

React + Vite + TypeScript SPA for the Linked URL shortener API. Implements the contract in `FRONTEND_BUILD_GUIDE.md` and `../backend/openapi.yaml` — no auth, all endpoints public.

## Stack

- React 19 + React Router 7 + Vite 8
- Tailwind CSS 4 (via `@tailwindcss/vite`)
- Native `fetch` apiClient (`src/lib/api.ts`), no axios
- Custom SVG bar chart (no chart lib)

## Pages

| Route        | View                                                                                                           |
| ------------ | -------------------------------------------------------------------------------------------------------------- |
| `/`          | Shorten form + result card + ledger (auto-refreshes on create)                                                 |
| `/links`     | Full ledger: search (debounced 300ms) + sort + pagination                                                      |
| `/links/:id` | Header (short URL, copy/open, edit/delete) + daily chart + recent clicks + full click history (own pagination) |
| `*`          | 404 with back-to-home                                                                                          |
| Footer       | `HealthBadge` polling `GET /health` every 30s                                                                  |

Short links are rendered as `<a href="{BASE}/{shortCode}" target="_blank" rel="noopener">` — never `fetch()`ed (avoids CORS + redirect issues).

## Configuration

```bash
cp .env.example .env   # then edit
```

| Var                 | Default                 | Notes                                                                                                                                 |
| ------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `VITE_API_BASE_URL` | `http://localhost:3000` | Trailing slash stripped; baked at `vite build` time. For compose/nginx use `http://localhost:3000`; for prod bake the ALB/CF API URL. |

Backend CORS must allow the frontend origin: set backend `CORS_ORIGIN=http://localhost:5173` (dev) or `http://localhost:8080` (compose) and restart the backend.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # tsc -b && vite build → dist/
npm run preview  # serve dist locally
npm run lint     # oxlint
```

Backend must be running first (`../backend`, `GET /health` → `{"status":"ok"}`).

Docker: `docker compose up --build` from repo root serves the built SPA on `:8080` via nginx (`nginx.conf`: SPA `try_files`, gzip, 1y immutable assets).

## API layer

`src/lib/api.ts`:

- Types mirror OpenAPI: `Link`, `CreateLinkResponse`, `Click`, `ClicksByDay`, `LinkAnalytics`, `PaginationMeta`, `PaginatedLinks`, `PaginatedClicks`.
- `apiFetch<T>`: 10s timeout → `network` error; `204` → `undefined`; `429` → `rate-limit`; `404` → `not-found`; `422` → `validation` with `fieldErrors`; else `unknown`.
- Helpers: `normalizeUrl` (prepends `https://`), `assertValidUrl` (`http(s)` only, backend-identical messages), `shortUrlFor`, `baseUrl`, `friendlyMessage`.
- `api`: `createLink`, `listLinks` (clamped `page ≥ 1`, `limit 1–100`), `getLink`, `updateLink`, `deleteLink`, `getAnalytics`, `getClicks` (clamped), `health`.

## UX / edge cases

- Empty/invalid URL → inline error, no API call.
- `422` shows `details[0].message` / field error; `404` → "Link not found"; `429` → "Too many requests…"; network → retry banner.
- `DELETE 204` never calls `.json()`.
- After create, ledger refetches (`refreshKey`); after edit, list + detail reload; after delete from detail, redirect to `/links` with toast + confirm dialog.
- Pagination resets to page 1 on search/sort change; `limit` max 100 default 20.
- Loading skeletons, `ErrorBanner` + retry, empty states ("No chains yet", "Quiet so far"), toasts, responsive layout, skip-to-content link, `aria-busy`/`role=alert`/`aria-live`.

## Project structure

```
src/
  lib/api.ts        — types, ApiError, apiFetch, api helpers
  lib/format.ts     — formatDate, formatDay, truncate, hostOf
  hooks/useLinksList.ts — search/sort/page state, debounced fetch, request-id guard
  components/       — CopyButton (clipboard + fallback), controls (Pagination/Search/Sort),
                      feedback (ErrorBanner/LoadingSkeleton), LinkForm/DeleteConfirm,
                      ClicksChart, HealthBadge
  pages/Home.tsx, pages/Dashboard.tsx, pages/Detail.tsx
  App.tsx           — router + shell + footer health + toasts
nginx.conf          — prod SPA serving
```

See `FRONTEND_BUILD_GUIDE.md` for the full build spec and acceptance criteria.
