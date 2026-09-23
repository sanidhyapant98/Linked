export interface Link {
  id: number;
  shortCode: string;
  originalUrl: string;
  clickCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLinkResponse {
  id: number;
  shortCode: string;
  originalUrl: string;
  createdAt: string;
}

export interface Click {
  id: number;
  createdAt: string;
  referrer: string | null;
  userAgent: string | null;
  ipAddress: string | null;
}

export interface ClicksByDay {
  day: string;
  count: number;
}

export interface LinkAnalytics {
  id: number;
  shortCode: string;
  originalUrl: string;
  totalClicks: number;
  recentClicks: Array<Omit<Click, "ipAddress">>;
  clicksByDay: ClicksByDay[];
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedLinks {
  data: Link[];
  meta: PaginationMeta;
}

export interface PaginatedClicks {
  data: Click[];
  meta: PaginationMeta;
}

export type SortBy = "createdAt" | "clickCount" | "originalUrl";
export type SortOrder = "asc" | "desc";

export interface ListLinksParams {
  page?: number;
  limit?: number;
  sortBy?: SortBy | string;
  sortOrder?: SortOrder | string;
  search?: string;
}

const REQUEST_TIMEOUT_MS = 10_000;

export type ApiErrorKind =
  "validation" | "not-found" | "rate-limit" | "network" | "unknown";

export class ApiError extends Error {
  kind: ApiErrorKind;
  fieldErrors: Record<string, string>;
  status: number;
  constructor(
    kind: ApiErrorKind,
    message: string,
    status: number,
    fieldErrors: Record<string, string> = {}
  ) {
    super(message);
    this.kind = kind;
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

const BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ||
  "http://localhost:3000";

export function baseUrl(): string {
  return BASE;
}

export function shortUrlFor(shortCode: string): string {
  return `${BASE}/${shortCode}`;
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...options,
      signal: controller.signal,
      headers: { "Content-Type": "application/json", ...(options.headers || {}) }
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") {
      throw new ApiError(
        "network",
        "Request timed out. Check your connection and try again.",
        0
      );
    }
    throw new ApiError(
      "network",
      "Could not reach the server. Check your connection and try again.",
      0
    );
  } finally {
    clearTimeout(timeout);
  }

  if (res.status === 204) return undefined as unknown as T;
  if (res.status === 429)
    throw new ApiError("rate-limit", "Too many requests, try again shortly.", 429);
  if (res.status === 404) {
    let msg = "Link not found.";
    try {
      const b = (await res.json()) as { error?: { message?: string } };
      if (b?.error?.message)
        msg = b.error.message.includes("not found") ? b.error.message : "Link not found.";
    } catch {
      /* keep default */
    }
    throw new ApiError("not-found", msg, 404);
  }
  if (res.status === 422) {
    try {
      const b = (await res.json()) as {
        error?: { message?: string; details?: Array<{ path: string; message: string }> };
      };
      const fieldErrors: Record<string, string> = {};
      for (const d of b?.error?.details || []) fieldErrors[d.path] = d.message;
      const msg =
        (b?.error?.details?.[0]?.message as string | undefined) ||
        b?.error?.message ||
        "Validation failed.";
      throw new ApiError("validation", msg, 422, fieldErrors);
    } catch (e) {
      if (e instanceof ApiError) throw e;
      throw new ApiError("validation", "Validation failed.", 422);
    }
  }
  if (!res.ok) {
    try {
      const b = (await res.json()) as { error?: { message?: string } };
      throw new ApiError(
        "unknown",
        b?.error?.message || `Request failed (${res.status}).`,
        res.status
      );
    } catch (e) {
      if (e instanceof ApiError) throw e;
      throw new ApiError("unknown", `Request failed (${res.status}).`, res.status);
    }
  }
  return (await res.json()) as T;
}

export function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return trimmed;
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function assertValidUrl(input: string): string {
  const candidate = normalizeUrl(input);
  if (!candidate)
    throw new ApiError("validation", "Enter a URL first.", 0, {
      originalUrl: "Enter a URL first."
    });
  try {
    const u = new URL(candidate);
    if (u.protocol !== "http:" && u.protocol !== "https:") {
      throw new Error("bad scheme");
    }
    return candidate;
  } catch {
    throw new ApiError("validation", "originalUrl must be a valid URL", 0, {
      originalUrl: "originalUrl must be a valid URL"
    });
  }
}

function clampPage(n: unknown, fallback = 1): number {
  const v = Math.floor(Number(n));
  return Number.isFinite(v) && v >= 1 ? v : fallback;
}

function clampLimit(n: unknown, fallback = 20): number {
  const v = Math.floor(Number(n));
  if (!Number.isFinite(v)) return fallback;
  return Math.min(100, Math.max(1, v));
}

export const api = {
  createLink: (originalUrl: string) =>
    apiFetch<CreateLinkResponse>("/api/links", {
      method: "POST",
      body: JSON.stringify({ originalUrl })
    }),
  listLinks: (params: ListLinksParams = {}) => {
    const q = new URLSearchParams();
    q.set("page", String(clampPage(params.page)));
    q.set("limit", String(clampLimit(params.limit)));
    q.set("sortBy", params.sortBy || "createdAt");
    q.set("sortOrder", params.sortOrder || "desc");
    if (params.search?.trim()) q.set("search", params.search.trim());
    return apiFetch<PaginatedLinks>(`/api/links?${q.toString()}`);
  },
  getLink: (id: number | string) => {
    if (!/^\d+$/.test(String(id)))
      throw new ApiError("validation", "id must be a positive integer", 0);
    return apiFetch<Link>(`/api/links/${id}`);
  },
  updateLink: (id: number | string, originalUrl: string) => {
    if (!/^\d+$/.test(String(id)))
      throw new ApiError("validation", "id must be a positive integer", 0);
    return apiFetch<Link>(`/api/links/${id}`, {
      method: "PUT",
      body: JSON.stringify({ originalUrl })
    });
  },
  deleteLink: (id: number | string) => {
    if (!/^\d+$/.test(String(id)))
      throw new ApiError("validation", "id must be a positive integer", 0);
    return apiFetch<void>(`/api/links/${id}`, { method: "DELETE" });
  },
  getAnalytics: (id: number | string) => {
    if (!/^\d+$/.test(String(id)))
      throw new ApiError("validation", "id must be a positive integer", 0);
    return apiFetch<LinkAnalytics>(`/api/links/${id}/analytics`);
  },
  getClicks: (id: number | string, page = 1, limit = 20) => {
    if (!/^\d+$/.test(String(id)))
      throw new ApiError("validation", "id must be a positive integer", 0);
    return apiFetch<PaginatedClicks>(
      `/api/links/${id}/clicks?page=${clampPage(page)}&limit=${clampLimit(limit)}`
    );
  },
  health: () => apiFetch<{ status: string; database: string }>("/health")
};

export function friendlyMessage(e: unknown): string {
  if (e instanceof ApiError) return e.message;
  if (e instanceof Error) return e.message;
  return "Something went wrong.";
}
