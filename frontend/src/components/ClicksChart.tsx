import type { ClicksByDay } from "../lib/api";
import { formatDay } from "../lib/format";

export function ClicksChart({ data }: { data: ClicksByDay[] }) {
  if (!data.length) {
    return (
      <div className="rounded-2xl border border-dashed border-pine/30 px-6 py-10 text-center">
        <p className="display text-2xl">Quiet so far</p>
        <p className="mt-2 text-[15px] text-pine/70">
          No clicks yet. Open the short link in a new tab and the daily bars will appear
          here.
        </p>
      </div>
    );
  }
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div
      role="img"
      aria-label={`Clicks per day, ${data.length} days`}
      className="rounded-2xl border border-pine/20 bg-white p-5"
    >
      <div className="flex h-40 items-end gap-2">
        {data.map((d) => (
          <div key={d.day} className="flex min-w-0 flex-1 flex-col items-center gap-2">
            <span className="text-xs tabular-nums text-pine/70">{d.count}</span>
            <div
              className="bar-grow w-full rounded-t-md bg-moss"
              style={{
                height: `${Math.max(6, (d.count / max) * 120)}px`,
                opacity: 0.35 + 0.65 * (d.count / max)
              }}
              title={`${d.day}: ${d.count}`}
            />
            <span className="truncate text-[11px] text-pine/60">{formatDay(d.day)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
