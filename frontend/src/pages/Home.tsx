import { useState } from "react";
import { Link } from "react-router-dom";
import { CopyButton } from "../components/CopyButton";
import {
  ApiError,
  api,
  assertValidUrl,
  friendlyMessage,
  shortUrlFor,
  type CreateLinkResponse
} from "../lib/api";
import { DashboardSection } from "./Dashboard";

export function Home({ onNotice }: { onNotice: (m: string) => void }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<CreateLinkResponse | null>(null);
  const [ledgerKey, setLedgerKey] = useState(0);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    let url: string;
    try {
      url = assertValidUrl(value);
    } catch (err) {
      setError(friendlyMessage(err));
      return;
    }
    setPending(true);
    try {
      const r = await api.createLink(url);
      setResult(r);
      setValue("");
      setLedgerKey((k) => k + 1);
      onNotice(`Short link /${r.shortCode} ready.`);
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors.originalUrl)
        setError(err.fieldErrors.originalUrl);
      else setError(friendlyMessage(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <section aria-label="Shorten a link" className="pt-10 sm:pt-14">
        <p className="text-[15px] font-medium text-moss">
          A URL shortener that remembers every tap
        </p>
        <h1 className="display mt-3 max-w-[16ch] text-[clamp(44px,8vw,92px)]">
          Long addresses in, chain links out.
        </h1>
        <p className="mt-4 max-w-[62ch] text-[17px] leading-relaxed text-pine/75">
          Paste the unwieldy thing. Linked hands back a short code, keeps the destination
          editable, and counts each visit by day so you know what actually gets opened.
        </p>

        <div className="mt-8 rounded-[28px] border-[1.5px] border-pine bg-mist/60 p-3 sm:p-4">
          <form onSubmit={submit} noValidate>
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="flex-1">
                <span className="sr-only">Long URL to shorten</span>
                <input
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="Paste a long link, like example.com/essay-on-rivers"
                  inputMode="url"
                  autoComplete="url"
                  className="w-full rounded-full border-[1.5px] border-pine bg-white px-5 py-3.5 text-[16px] outline-none placeholder:text-pine/40 focus:border-route"
                />
              </label>
              <button
                type="submit"
                disabled={pending}
                aria-busy={pending}
                className="rounded-full bg-route px-7 py-3.5 text-[15px] font-semibold text-white disabled:opacity-60 hover:brightness-110"
              >
                {pending ? "Linking…" : "Shorten"}
              </button>
            </div>
            {error && (
              <p role="alert" className="mt-2 px-2 text-[14px] font-medium text-route">
                {error}
              </p>
            )}
          </form>
        </div>

        {result && (
          <article
            aria-live="polite"
            className="ticket stamp-in mt-6 flex flex-col gap-4 rounded-2xl p-5 sm:flex-row sm:items-center"
          >
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium text-pine/60">Your chain link</p>
              <a
                href={shortUrlFor(result.shortCode)}
                target="_blank"
                rel="noopener"
                className="shortcode mt-1 block truncate text-[26px] font-medium text-route hover:underline"
                title={shortUrlFor(result.shortCode)}
              >
                {shortUrlFor(result.shortCode)}
              </a>
              <p
                className="mt-1 truncate text-[14px] text-pine/65"
                title={result.originalUrl}
              >
                {result.originalUrl}
              </p>
            </div>
            <div
              aria-hidden="true"
              className="ticket-perf hidden self-stretch sm:block"
            />
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <CopyButton text={shortUrlFor(result.shortCode)} />
              <Link
                to={`/links/${result.id}`}
                className="rounded-full bg-pine px-4 py-2 text-[13px] font-medium text-paper hover:bg-moss"
              >
                View stats
              </Link>
              <button
                type="button"
                onClick={() => setResult(null)}
                className="rounded-full border border-pine/25 px-4 py-2 text-[13px] font-medium"
              >
                Shorten another
              </button>
            </div>
          </article>
        )}
      </section>

      <DashboardSection onNotice={onNotice} refreshKey={ledgerKey} />
    </div>
  );
}
