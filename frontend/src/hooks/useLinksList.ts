import { useCallback, useEffect, useState } from "react";
import { ApiError, api, friendlyMessage, type Link as LinkType } from "../lib/api";

function useDebounced(value: string, ms = 300): string {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export interface LinksListMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export function useLinksList() {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ data: LinkType[]; meta: LinksListMeta } | null>(
    null
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const debounced = useDebounced(search);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.listLinks({
        page,
        limit: 20,
        sortBy,
        sortOrder,
        search: debounced
      });
      setData(res);
    } catch (e) {
      if (e instanceof ApiError && e.kind === "network") setError(e.message);
      else setError(friendlyMessage(e));
    } finally {
      setLoading(false);
    }
  }, [page, sortBy, sortOrder, debounced]);

  // Data fetch on query change: syncing component state with the API (external system).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await api.listLinks({
        page,
        limit: 20,
        sortBy,
        sortOrder,
        search: debounced
      });
      if (cancelled) return;
      setData(res);
      setError("");
      setLoading(false);
    })().catch((e: unknown) => {
      if (cancelled) return;
      if (e instanceof ApiError && e.kind === "network") setError(e.message);
      else setError(friendlyMessage(e));
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [page, sortBy, sortOrder, debounced]);

  return {
    search,
    setSearch: (v: string) => {
      setSearch(v);
      setPage(1);
      setError("");
      setLoading(true);
    },
    sortBy,
    sortOrder,
    setSort: (by: string, order: string) => {
      setSortBy(by);
      setSortOrder(order);
      setPage(1);
      setError("");
      setLoading(true);
    },
    page,
    setPage: (p: number) => {
      setPage(p);
      setError("");
      setLoading(true);
    },
    data,
    error,
    loading,
    reload: load
  };
}
