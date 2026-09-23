import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ClicksChart } from "../components/ClicksChart";
import { CopyButton } from "../components/CopyButton";
import { ErrorBanner, LoadingSkeleton } from "../components/feedback";
import { DeleteConfirm, LinkForm } from "../components/LinkForm";
import {
  api,
  friendlyMessage,
  shortUrlFor,
  type LinkAnalytics,
  type PaginatedClicks
} from "../lib/api";
import { formatDate, truncate } from "../lib/format";

export function Detail({ onNotice }: { onNotice: (m: string) => void }) {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<LinkAnalytics | null>(null);
  const [clicks, setClicks] = useState<PaginatedClicks | null>(null);
  const [clickPage, setClickPage] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deletePending, setDeletePending] = useState(false);

  async function load(page = 1) {
    setLoading(true);
    setError("");
    try {
      const [a, c] = await Promise.all([
        api.getAnalytics(id),
        api.getClicks(id, page, 20)
      ]);
      setAnalytics(a);
      setClicks(c);
      setClickPage(page);
    } catch (e) {
      setError(friendlyMessage(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function confirmDelete() {
    setDeletePending(true);
    try {
      await api.deleteLink(id);
      onNotice("Link removed.");
      navigate("/links");
    } catch (e) {
      onNotice(friendlyMessage(e));
    } finally {
      setDeletePending(false);
    }
  }

  if (loading) {
    return (
      <div className="pt-10">
        <LoadingSkeleton rows={5} />
      </div>
    );
  }
  if (error || !analytics) {
    return (
      <div className="pt-10">
        <ErrorBanner message={error || "Link not found."} onRetry={() => load(1)} />
        <p className="mt-4">
          <Link to="/" className="font-medium text-route hover:underline">
            Back to the shorten rail
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="pt-10">
      <Link to="/links" className="text-sm font-medium text-pine/60 hover:text-route">
        ← All links
      </Link>
      <header className="mt-3 border-y-[1.5px] border-pine py-6">
        <div className="flex flex-wrap items-center gap-3">
          <a
            href={shortUrlFor(analytics.shortCode)}
            target="_blank"
            rel="noopener"
            className="shortcode rounded-lg bg-pine px-3 py-2 text-xl font-medium text-paper hover:bg-moss"
          >
            /{analytics.shortCode}
          </a>
          <span className="rounded-full bg-route/10 px-3 py-1.5 text-sm font-semibold tabular-nums text-route">
            {analytics.totalClicks} {analytics.totalClicks === 1 ? "tap" : "taps"}
          </span>
        </div>
        <p
          className="mt-3 break-all text-[15px] text-pine/75"
          title={analytics.originalUrl}
        >
          {truncate(analytics.originalUrl, 100)}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <CopyButton text={shortUrlFor(analytics.shortCode)} />
          <a
            href={shortUrlFor(analytics.shortCode)}
            target="_blank"
            rel="noopener"
            className="rounded-full border border-pine/25 px-4 py-2 text-[13px] font-medium hover:border-route hover:text-route"
          >
            Open short link
          </a>
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className="rounded-full border border-pine/25 px-4 py-2 text-[13px] font-medium hover:border-route hover:text-route"
          >
            {editing ? "Close editor" : "Edit destination"}
          </button>
          <button
            type="button"
            onClick={() => setDeleting(true)}
            className="rounded-full border border-pine/25 px-4 py-2 text-[13px] font-medium hover:border-route hover:text-route"
          >
            Delete
          </button>
        </div>
        {editing && (
          <div className="mt-4 max-w-2xl">
            <LinkForm
              initial={analytics.originalUrl}
              submitLabel="Save new destination"
              editId={analytics.id}
              onSaved={() => {
                setEditing(false);
                onNotice("Destination updated.");
                load(clickPage);
              }}
              onCancel={() => setEditing(false)}
            />
          </div>
        )}
      </header>

      <section aria-label="Clicks per day" className="mt-8">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="display text-3xl">Daily taps</h2>
          <p className="text-sm text-pine/60">Each bar is one calendar day.</p>
        </div>
        <div className="mt-4">
          <ClicksChart data={analytics.clicksByDay} />
        </div>
      </section>

      <section aria-label="Recent clicks" className="mt-8">
        <h2 className="display text-3xl">Latest arrivals</h2>
        {!analytics.recentClicks.length ? (
          <p className="mt-3 text-[15px] text-pine/65">
            Nobody has tapped this one yet. Share it and check back.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-line border-y border-line">
            {analytics.recentClicks.map((c) => (
              <li
                key={c.id}
                className="flex flex-col gap-1 py-3 text-[14px] sm:flex-row sm:items-center sm:gap-4"
              >
                <span className="tabular-nums text-pine/70">
                  {formatDate(c.createdAt)}
                </span>
                <span
                  className="min-w-0 flex-1 truncate text-pine/80"
                  title={c.userAgent || ""}
                >
                  {truncate(c.userAgent || "Unknown device", 64)}
                </span>
                <span className="truncate text-pine/60" title={c.referrer || ""}>
                  {c.referrer || "Direct visit"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-label="Full click history" className="mt-8">
        <h2 className="display text-3xl">Full history</h2>
        {!clicks || !clicks.data.length ? (
          <p className="mt-3 text-[15px] text-pine/65">
            No recorded visits on this page of history.
          </p>
        ) : (
          <>
            <div className="mt-4 overflow-x-auto rounded-2xl border border-pine/20">
              <table className="w-full min-w-160 border-collapse text-left text-[14px]">
                <thead>
                  <tr className="bg-mist/70 text-pine/70">
                    <th scope="col" className="px-4 py-3 font-medium">
                      When
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      Referrer
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      Device
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      Address
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line bg-white">
                  {clicks.data.map((c) => (
                    <tr key={c.id}>
                      <td className="whitespace-nowrap px-4 py-3 tabular-nums">
                        {formatDate(c.createdAt)}
                      </td>
                      <td
                        className="max-w-55 truncate px-4 py-3"
                        title={c.referrer || ""}
                      >
                        {c.referrer || "Direct"}
                      </td>
                      <td
                        className="max-w-65 truncate px-4 py-3"
                        title={c.userAgent || ""}
                      >
                        {truncate(c.userAgent || "Unknown", 48)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 tabular-nums text-pine/65">
                        {c.ipAddress || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center gap-3 pt-4 text-sm">
              <button
                type="button"
                disabled={!clicks.meta.hasPreviousPage}
                onClick={() => load(clickPage - 1)}
                className="rounded-full border border-pine/25 px-4 py-2 font-medium disabled:opacity-40"
              >
                Newer
              </button>
              <span className="text-pine/65">
                Page {clicks.meta.page} of {Math.max(1, clicks.meta.totalPages)}
              </span>
              <button
                type="button"
                disabled={!clicks.meta.hasNextPage}
                onClick={() => load(clickPage + 1)}
                className="rounded-full border border-pine/25 px-4 py-2 font-medium disabled:opacity-40"
              >
                Older
              </button>
            </div>
          </>
        )}
      </section>

      {deleting && (
        <DeleteConfirm
          name={shortUrlFor(analytics.shortCode)}
          onCancel={() => setDeleting(false)}
          onConfirm={confirmDelete}
          pending={deletePending}
        />
      )}
    </div>
  );
}

export function NotFound() {
  return (
    <div className="pt-16">
      <p className="shortcode text-lg text-moss">404</p>
      <h1 className="display mt-2 text-[clamp(40px,7vw,72px)]">
        That link fell off the chain.
      </h1>
      <p className="mt-3 max-w-[52ch] text-[16px] text-pine/70">
        The address you asked for is not here. It may have been deleted, or the id was
        mistyped.
      </p>
      <p className="mt-6">
        <Link
          to="/"
          className="rounded-full bg-pine px-6 py-3 text-[15px] font-medium text-paper hover:bg-moss"
        >
          Back to shortening
        </Link>
      </p>
    </div>
  );
}
