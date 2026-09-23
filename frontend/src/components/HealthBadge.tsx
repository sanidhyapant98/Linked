import { useEffect, useState } from "react";
import { api } from "../lib/api";

type Status = "checking" | "ok" | "down";

export function HealthBadge() {
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    let cancelled = false;
    async function check() {
      try {
        const h = await api.health();
        if (!cancelled) setStatus(h.database === "connected" ? "ok" : "down");
      } catch {
        if (!cancelled) setStatus("down");
      }
    }
    void check();
    const t = setInterval(check, 30_000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  const label =
    status === "ok"
      ? "API connected"
      : status === "down"
        ? "API unreachable"
        : "Checking API";
  const dot =
    status === "ok" ? "bg-green-600" : status === "down" ? "bg-route" : "bg-pine/40";

  return (
    <span
      role="status"
      title={label}
      className="inline-flex items-center gap-1.5 rounded-full border border-pine/20 bg-white px-2.5 py-1 text-xs font-medium text-pine/70"
    >
      <span aria-hidden="true" className={`h-2 w-2 rounded-full ${dot}`} />
      {label}
    </span>
  );
}
