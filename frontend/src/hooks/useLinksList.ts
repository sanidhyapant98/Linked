import { useCallback, useEffect, useRef, useState } from "react";
import { friendlyMessage, api, type Link as LinkType } from "../lib/api";

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

export function useLinksList(externalRefreshKey = 0) {
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
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const id = ++requestId.current;
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
      if (requestId.current !== id) return;
      setData(res);
    } catch (e: unknown) {
      if (requestId.current !== id) return;
      setError(friendlyMessage(e));
    } finally {
      if (requestId.current === id) setLoading(false);
    }
  }, [page, sortBy, sortOrder, debounced]);

  // Effect syncs with the API (external system): fetch on query change is intentional.
  useEffect(() => {
    void load();
  }, [load, externalRefreshKey]);

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
      setPage(Math.max(1, Math.floor(p) || 1));
      setError("");
      setLoading(true);
    },
    data,
    error,
    loading,
    reload: load
  };
}
