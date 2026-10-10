import { EMPLOYMENT_TYPES, type EmploymentType } from "@/types/jobs";
import { OPEN_LISTING_SORTS } from "@/validators/open-listing.validator";

export const MAX_SEARCH_LENGTH = 80;
export const MAX_MIN_PAY = 100_000_000;

export type JobsSort = (typeof OPEN_LISTING_SORTS)[number];

export type JobsViewState = {
  q: string;
  location: string;
  type: EmploymentType | undefined;
  minPay: number | undefined;
  sort: JobsSort;
  page: number;
};

export function parseMinPay(value: string | null): number | undefined {
  const trimmed = (value ?? "").trim();
  if (!/^\d+$/.test(trimmed)) return undefined;
  return Math.min(Number.parseInt(trimmed, 10), MAX_MIN_PAY);
}

export function buildQuery({ q, location, type, minPay, sort, page }: JobsViewState): string {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (location) params.set("location", location);
  if (type) params.set("type", type);
  if (minPay !== undefined) params.set("minPay", String(minPay));
  if (sort !== "newest") params.set("sort", sort);
  if (page > 1) params.set("page", String(page));
  return params.toString();
}

export function parseViewState(params: URLSearchParams): JobsViewState {
  const typeParam = params.get("type");
  const sortParam = params.get("sort");
  const pageParam = Number.parseInt(params.get("page") ?? "", 10);
  return {
    q: (params.get("q") ?? "").trim().slice(0, MAX_SEARCH_LENGTH),
    location: (params.get("location") ?? "").trim().slice(0, MAX_SEARCH_LENGTH),
    type: EMPLOYMENT_TYPES.find((value) => value === typeParam),
    minPay: parseMinPay(params.get("minPay")),
    sort: OPEN_LISTING_SORTS.find((value) => value === sortParam) ?? "newest",
    page: Number.isInteger(pageParam) && pageParam > 1 ? Math.min(pageParam, 1000) : 1,
  };
}
