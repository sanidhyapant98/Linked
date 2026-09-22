import { useEffect, useRef, useState } from "react";
import type { PaginationMeta } from "../lib/api";

export function Pagination({
  meta,
  onPage,
}: {
  meta: PaginationMeta;
  onPage: (page: number) => void;
}) {
  return (
    <nav className="flex flex-wrap items-center gap-3 pt-4" aria-label="Pages">
      <button
        type="button"
        disabled={!meta.hasPreviousPage}
        onClick={() => onPage(meta.page - 1)}
        className="rounded-full border border-pine/25 px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40 hover:border-route hover:text-route"
      >
        Newer
      </button>
      <p className="text-sm text-pine/70">
        Page {meta.page} of {Math.max(1, meta.totalPages)} · {meta.totalItems} links
      </p>
      <button
        type="button"
        disabled={!meta.hasNextPage}
        onClick={() => onPage(meta.page + 1)}
        className="rounded-full border border-pine/25 px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40 hover:border-route hover:text-route"
      >
        Older
      </button>
    </nav>
  );
}

export function SearchInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-pine/25 bg-white px-4 py-2.5 focus-within:border-pine">
      <span aria-hidden="true" className="text-pine/50">⌕</span>
      <span className="sr-only">Search links</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search destination or code"
        className="w-full bg-transparent text-[15px] outline-none placeholder:text-pine/40"
      />
    </label>
  );
}

export function SortSelect({
  sortBy,
  sortOrder,
  onChange,
}: {
  sortBy: string;
  sortOrder: string;
  onChange: (by: string, order: string) => void;
}) {
  const options = [
    { value: "createdAt", label: "Newest", hint: "Recently shortened first" },
    { value: "clickCount", label: "Most tapped", hint: "Highest taps first" },
    { value: "originalUrl", label: "Destination", hint: "Ordered A to Z" },
  ];
  const current = options.find((o) => o.value === sortBy) ?? options[0];
  const descending = sortOrder !== "asc";
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointer(e: PointerEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open ]);

  return (
    <div className="flex items-stretch gap-2">
      <div ref={wrapRef} className="relative">
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          title="Choose how the ledger is ordered"
          className={`group flex items-center gap-2 rounded-full border-[1.5px] border-pine bg-white py-2 pl-4 pr-3 text-sm transition-colors hover:bg-mist/60 ${open ? "bg-mist/60" : ""}`}
        >
          <span aria-hidden="true" className={`flex h-6 w-6 items-center justify-center rounded-full text-[13px] transition-colors ${open ? "bg-pine text-paper" : "bg-mist text-pine group-hover:bg-pine group-hover:text-paper"}`}>
            ⇅
          </span>
          <span className="text-[13px] font-medium text-pine/55">Sort</span>
          <span className="text-sm font-semibold text-pine">{current.label}</span>
          <svg
            aria-hidden="true"
            viewBox="0 0 12 12"
            className={`h-3 w-3 text-pine/70 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M2.5 4.5 6 8l3.5-3.5" />
          </svg>
        </button>
        {open && (
          <ul
            role="listbox"
            aria-label="Sort links by"
            className="absolute right-0 top-full z-50 mt-2 w-64 rounded-2xl border-[1.5px] border-pine bg-paper p-1.5 shadow-[4px_4px_0_0_var(--color-pine)]"
          >
            {options.map((o) => {
              const selected = o.value === current.value;
              return (
                <li key={o.value} role="option" aria-selected={selected}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(o.value, sortOrder);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                      selected ? "bg-pine text-paper" : "text-pine hover:bg-mist/70"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[12px] ${
                        selected ? "bg-paper text-pine" : "bg-mist text-pine/60"
                      }`}
                    >
                      {selected ? "✓" : "·"}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold leading-tight">{o.label}</span>
                      <span className={`block text-xs leading-tight ${selected ? "text-paper/70" : "text-pine/55"}`}>
                        {o.hint}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <button
        type="button"
        onClick={() => onChange(sortBy, descending ? "asc" : "desc")}
        aria-label={descending ? "Sorted descending, switch to ascending" : "Sorted ascending, switch to descending"}
        title={descending ? "Descending — show newest / largest first" : "Ascending — show oldest / smallest first"}
        className="flex w-[42px] items-center justify-center rounded-full border-[1.5px] border-pine bg-pine text-paper transition-colors hover:bg-moss"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 16 16"
          className={`h-4 w-4 transition-transform duration-200 ${descending ? "" : "rotate-180"}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M8 2.5v11" />
          <path d="M4.5 10.5 8 14l3.5-3.5" />
        </svg>
      </button>
    </div>
  );
}
