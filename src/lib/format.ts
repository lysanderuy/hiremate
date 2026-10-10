const numberFormat = new Intl.NumberFormat("en-US");

const dateFormat = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

export function formatSalaryRange(min: number | null, max: number | null): string {
  if (min === null || max === null) return "Not specified";
  return `PHP ${numberFormat.format(min)} to ${numberFormat.format(max)} per month`;
}

export function formatDate(iso: string): string {
  return dateFormat.format(new Date(iso));
}

const MS_PER_DAY = 86_400_000;
const POSTED_AGO_MAX_DAYS = 30;

function utcDayStart(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

export function formatPostedAgo(iso: string, now: Date = new Date()): string {
  const posted = new Date(iso);
  const days = Math.max(0, Math.round((utcDayStart(now) - utcDayStart(posted)) / MS_PER_DAY));
  if (days === 0) return "Posted today";
  if (days === 1) return "Posted yesterday";
  if (days > POSTED_AGO_MAX_DAYS) return `Posted ${formatDate(iso)}`;
  return `Posted ${days} days ago`;
}
