import { APPLICATION_STATUSES, type ApplicationStatus } from "@/types/applications";

export const MAX_URL_SKILLS = 30;
export const MAX_SEARCH_LENGTH = 80;

export type SortValue = "newest" | "oldest";
export type StatusFilter = ApplicationStatus | undefined;

export type ViewState = {
  listing: string;
  status: StatusFilter;
  q: string;
  sort: SortValue;
  skills: string[];
};

export function buildQuery({ listing, status, q, sort, skills }: ViewState): string {
  const params = new URLSearchParams({ listing });
  if (status) params.set("status", status);
  if (q) params.set("q", q);
  if (sort !== "newest") params.set("sort", sort);
  if (skills.length > 0) params.set("skills", skills.join(","));
  return params.toString();
}

export function parseViewState(
  params: URLSearchParams,
  listing: string,
  listingSkills: string[],
): ViewState {
  const statusParam = params.get("status");
  const status = APPLICATION_STATUSES.find((value) => value === statusParam);
  const sort: SortValue = params.get("sort") === "oldest" ? "oldest" : "newest";
  const q = (params.get("q") ?? "").trim().slice(0, MAX_SEARCH_LENGTH);
  const requested = new Set(
    (params.get("skills") ?? "")
      .split(",")
      .map((skill) => skill.trim().toLowerCase())
      .filter(Boolean)
      .slice(0, MAX_URL_SKILLS),
  );
  const skills = listingSkills.filter((skill) => requested.has(skill));
  return { listing, status, q, sort, skills };
}
