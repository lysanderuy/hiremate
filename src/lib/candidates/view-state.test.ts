import { describe, expect, it } from "vitest";

import { buildQuery, parseViewState, type ViewState } from "./view-state";

const LISTING = "7c1f2b0a-5d4e-4a63-9b8c-1e2d3f4a5b6c";
const SKILLS = ["react", "typescript", "postgresql"];

const defaults: ViewState = {
  listing: LISTING,
  status: undefined,
  q: "",
  sort: "newest",
  skills: [],
};

function parse(query: string, listingSkills: string[] = SKILLS): ViewState {
  return parseViewState(new URLSearchParams(query), LISTING, listingSkills);
}

describe("buildQuery", () => {
  it("emits only the listing for default state", () => {
    expect(buildQuery(defaults)).toBe(`listing=${LISTING}`);
  });

  it("includes non-default values", () => {
    const params = new URLSearchParams(
      buildQuery({
        ...defaults,
        status: "shortlisted",
        q: "maria",
        sort: "oldest",
        skills: ["react", "typescript"],
      }),
    );
    expect(params.get("status")).toBe("shortlisted");
    expect(params.get("q")).toBe("maria");
    expect(params.get("sort")).toBe("oldest");
    expect(params.get("skills")).toBe("react,typescript");
  });
});

describe("parseViewState", () => {
  it("returns defaults for an empty query", () => {
    expect(parse("")).toEqual(defaults);
  });

  it("uses the listing passed in, not the URL param", () => {
    expect(parse("listing=other").listing).toBe(LISTING);
  });

  it("ignores an unknown status and sort", () => {
    const state = parse("status=hired&sort=score");
    expect(state.status).toBeUndefined();
    expect(state.sort).toBe("newest");
  });

  it("accepts a known status and sort", () => {
    const state = parse("status=withdrawn&sort=oldest");
    expect(state.status).toBe("withdrawn");
    expect(state.sort).toBe("oldest");
  });

  it("trims and caps the search", () => {
    expect(parse("q=%20%20maria%20%20").q).toBe("maria");
    expect(parse(`q=${"a".repeat(100)}`).q).toHaveLength(80);
  });

  it("dedupes skills, lowercases them and keeps listing order", () => {
    const state = parse("skills=TypeScript,react,REACT,,");
    expect(state.skills).toEqual(["react", "typescript"]);
  });

  it("drops skills that the listing does not have", () => {
    expect(parse("skills=react,rust").skills).toEqual(["react"]);
  });

  it("only considers the first 30 requested skills", () => {
    const many = Array.from({ length: 35 }, (_, i) => `skill${i}`);
    const requested = [...many.slice(0, 30), "late"].join(",");
    const state = parse(`skills=${requested}`, [...many, "late"]);
    expect(state.skills).toHaveLength(30);
    expect(state.skills).not.toContain("late");
    expect(state.skills).not.toContain("skill30");
  });

  it("round-trips through buildQuery", () => {
    const state: ViewState = {
      listing: LISTING,
      status: "interview",
      q: "maria santos",
      sort: "oldest",
      skills: ["react", "postgresql"],
    };
    expect(parse(buildQuery(state))).toEqual(state);
    expect(parse(buildQuery(defaults))).toEqual(defaults);
  });
});
