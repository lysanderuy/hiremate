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
