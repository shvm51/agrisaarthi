/** Small formatting helpers — numbers, currency, relative time. */

export function inr(n: number): string {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

export function inr2(n: number): string {
  return (
    "₹" +
    n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  );
}

export function pct(n: number): string {
  return `${Math.round(n)}%`;
}

/** "5m ago", "2h ago" — keeps the home feed feeling live. */
export function timeAgo(iso: string, now = Date.now()): string {
  const s = Math.max(1, Math.floor((now - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function greetingKey(hour: number): "greet.morning" | "greet.afternoon" | "greet.evening" {
  if (hour < 12) return "greet.morning";
  if (hour < 17) return "greet.afternoon";
  return "greet.evening";
}
