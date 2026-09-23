export function ErrorBanner({
  message,
  onRetry
}: {
  message: string;
  onRetry?: () => void;
}) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="flex flex-wrap items-center gap-3 rounded-2xl border border-pine bg-mist px-4 py-3 text-[15px] text-pine"
    >
      <span
        aria-hidden="true"
        className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-pine text-[13px] text-paper"
      >
        !
      </span>
      <p className="min-w-0 flex-1">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-full bg-pine px-4 py-1.5 text-sm font-medium text-paper hover:bg-moss"
        >
          Try again
        </button>
      )}
    </div>
  );
}

export function LoadingSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div aria-busy="true" aria-label="Loading" className="divide-y divide-line">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex animate-pulse items-center gap-4 py-4">
          <div className="h-9 w-20 rounded-full bg-mist" />
          <div className="h-4 flex-1 rounded bg-mist" />
          <div className="h-4 w-14 rounded bg-mist" />
        </div>
      ))}
    </div>
  );
}
