import { useState } from "react";
import { Link } from "react-router-dom";
import { CopyButton } from "../components/CopyButton";
import { Pagination, SearchInput, SortSelect } from "../components/controls";
import { ErrorBanner, LoadingSkeleton } from "../components/feedback";
import { DeleteConfirm, LinkForm } from "../components/LinkForm";
import { useLinksList } from "../hooks/useLinksList";
import { api, friendlyMessage, shortUrlFor, type Link as LinkType } from "../lib/api";
import { formatDate, truncate } from "../lib/format";

export function LinkLedger({
  links,
  onChanged,
  onNotice
}: {
  links: LinkType[];
  onChanged: () => void;
  onNotice: (msg: string) => void;
}) {
  const [editing, setEditing] = useState<LinkType | null>(null);
  const [deleting, setDeleting] = useState<LinkType | null>(null);
  const [pending, setPending] = useState(false);

  async function confirmDelete() {
    if (!deleting) return;
    setPending(true);
    try {
      await api.deleteLink(deleting.id);
      setDeleting(null);
      onNotice("Link removed.");
      onChanged();
    } catch (e) {
      onNotice(friendlyMessage(e));
    } finally {
      setPending(false);
    }
  }

  if (!links.length) {
    return (
      <div className="rounded-2xl border border-dashed border-pine/30 px-6 py-10 text-center">
        <p className="display text-2xl">No chains yet</p>
        <p className="mt-2 text-[15px] text-pine/70">
          Shorten your first link above and it will be logged here.
        </p>
      </div>
    );
  }

  return (
    <ul className="ledger-row divide-none">
      {links.map((l) => (
        <li
          key={l.id}
          className="ledger-row flex flex-col gap-2 py-4 sm:flex-row sm:items-center"
        >
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <a
                href={shortUrlFor(l.shortCode)}
                target="_blank"
                rel="noopener"
                className="shortcode rounded-md bg-mist px-2.5 py-1 text-[15px] font-medium text-pine hover:bg-pine hover:text-paper"
                title={shortUrlFor(l.shortCode)}
              >
                /{l.shortCode}
              </a>
              <span className="rounded-full bg-route/10 px-2.5 py-1 text-xs font-semibold tabular-nums text-route">
                {l.clickCount} {l.clickCount === 1 ? "tap" : "taps"}
              </span>
              <span className="text-xs text-pine/55">{formatDate(l.createdAt)}</span>
            </div>
            <p className="truncate text-[14px] text-pine/70" title={l.originalUrl}>
              {truncate(l.originalUrl, 72)}
            </p>
            {editing?.id === l.id && (
              <div className="pt-2">
                <LinkForm
                  initial={l.originalUrl}
                  submitLabel="Save new destination"
                  editId={l.id}
                  onSaved={() => {
                    setEditing(null);
                    onNotice("Destination updated.");
                    onChanged();
                  }}
                  onCancel={() => setEditing(null)}
                />
              </div>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <CopyButton text={shortUrlFor(l.shortCode)} />
            <Link
              to={`/links/${l.id}`}
              className="rounded-full border border-pine/25 px-3 py-1.5 text-[13px] font-medium hover:border-route hover:text-route"
            >
              Stats
            </Link>
            <button
              type="button"
              onClick={() => setEditing(editing?.id === l.id ? null : l)}
              className="rounded-full border border-pine/25 px-3 py-1.5 text-[13px] font-medium hover:border-route hover:text-route"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => setDeleting(l)}
              className="rounded-full border border-pine/25 px-3 py-1.5 text-[13px] font-medium hover:border-route hover:text-route"
            >
              Delete
            </button>
          </div>
        </li>
      ))}
      {deleting && (
        <DeleteConfirm
          name={shortUrlFor(deleting.shortCode)}
          onCancel={() => setDeleting(null)}
          onConfirm={confirmDelete}
          pending={pending}
        />
      )}
    </ul>
  );
}

export function DashboardControls({
  search,
  onSearch,
  sortBy,
  sortOrder,
  onSort
}: {
  search: string;
  onSearch: (v: string) => void;
  sortBy: string;
  sortOrder: string;
  onSort: (by: string, order: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <SearchInput value={search} onChange={onSearch} />
      <SortSelect sortBy={sortBy} sortOrder={sortOrder} onChange={onSort} />
    </div>
  );
}

export function DashboardSection({ onNotice }: { onNotice: (m: string) => void }) {
  const s = useLinksList();
  return (
    <section aria-label="All links" className="mt-10">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="display text-[clamp(28px,4vw,40px)]">Ledger</h2>
        <p className="text-sm text-pine/60">
          Every chain link, newest first unless you sort it otherwise.
        </p>
      </div>
      <div className="mt-4">
        <DashboardControls
          search={s.search}
          onSearch={s.setSearch}
          sortBy={s.sortBy}
          sortOrder={s.sortOrder}
          onSort={s.setSort}
        />
      </div>
      <div className="mt-4">
        {s.loading ? <LoadingSkeleton /> : null}
        {!s.loading && s.error ? (
          <ErrorBanner message={s.error} onRetry={s.reload} />
        ) : null}
        {!s.loading && !s.error && s.data ? (
          <>
            <LinkLedger links={s.data.data} onChanged={s.reload} onNotice={onNotice} />
            <Pagination meta={s.data.meta} onPage={s.setPage} />
          </>
        ) : null}
      </div>
    </section>
  );
}
