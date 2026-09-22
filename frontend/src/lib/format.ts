export function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function formatDay(day: string): string {
  // day: YYYY-MM-DD
  try {
    return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(
      new Date(`${day}T12:00:00`)
    );
  } catch {
    return day;
  }
}

export function truncate(s: string, n = 56): string {
  if (s.length <= n) return s;
  return `${s.slice(0, n - 1)}…`;
}

export function hostOf(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}
