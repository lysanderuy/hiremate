import { APPLICATION_STATUSES, type ApplicationStatus } from "@/types/applications";
import { APPLICATION_BANDS, type MatchBand } from "@/validators/application.validator";

export const MAX_SEARCH_LENGTH = 80;
export const PAGE_SIZE = 10;

export const SORT_VALUES = ["match", "newest", "name"] as const;
export const BAND_VALUES = APPLICATION_BANDS;

export type SortValue = (typeof SORT_VALUES)[number];
export type BandFilter = MatchBand | undefined;
export type StatusFilter = ApplicationStatus | undefined;

export type ViewState = {
  listing: string;
  status: StatusFilter;
  q: string;
  band: BandFilter;
  sort: SortValue;
  page: number;
};

export function buildQuery({ listing, status, q, band, sort, page }: ViewState): string {
  const params = new URLSearchParams({ listing });
  if (status) params.set("status", status);
  if (q) params.set("q", q);
  if (band) params.set("band", band);
  if (sort !== "match") params.set("sort", sort);
  if (page > 1) params.set("page", String(page));
  return params.toString();
}

export function parseViewState(params: URLSearchParams, listing: string): ViewState {
  const statusParam = params.get("status");
  const bandParam = params.get("band");
  const sortParam = params.get("sort");
  const pageParam = Number.parseInt(params.get("page") ?? "", 10);
  return {
    listing,
    status: APPLICATION_STATUSES.find((value) => value === statusParam),
    q: (params.get("q") ?? "").trim().slice(0, MAX_SEARCH_LENGTH),
    band: BAND_VALUES.find((value) => value === bandParam),
    sort: SORT_VALUES.find((value) => value === sortParam) ?? "match",
    page: Number.isInteger(pageParam) && pageParam > 1 ? pageParam : 1,
  };
}
