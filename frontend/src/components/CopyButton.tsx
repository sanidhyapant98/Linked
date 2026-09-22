import { useState } from "react";

export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
        } catch {
          const ta = document.createElement("textarea");
          ta.value = text;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          ta.remove();
        }
        setDone(true);
        setTimeout(() => setDone(false), 1400);
      }}
      className="inline-flex items-center gap-1.5 rounded-full border border-pine/25 bg-white px-3 py-1.5 text-[13px] font-medium text-pine transition-colors hover:border-route hover:text-route"
      aria-live="polite"
    >
      <span aria-hidden="true" className="inline-block h-2 w-2 rounded-full bg-current" />
      {done ? "Copied" : label}
    </button>
  );
}
