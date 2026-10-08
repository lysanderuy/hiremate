import { describe, expect, it } from "vitest";

import { buildQuery, parseViewState, type ViewState } from "./view-state";

const LISTING = "7c1f2b0a-5d4e-4a63-9b8c-1e2d3f4a5b6c";

const defaults: ViewState = {
  listing: LISTING,
  status: undefined,
  q: "",
  band: undefined,
  sort: "match",
  page: 1,
};

function parse(query: string): ViewState {
  return parseViewState(new URLSearchParams(query), LISTING);
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
        band: "fair",
        sort: "name",
        page: 3,
      }),
    );
    expect(params.get("status")).toBe("shortlisted");
    expect(params.get("q")).toBe("maria");
    expect(params.get("band")).toBe("fair");
    expect(params.get("sort")).toBe("name");
    expect(params.get("page")).toBe("3");
  });
});

describe("parseViewState", () => {
  it("returns defaults for an empty query", () => {
    expect(parse("")).toEqual(defaults);
  });

  it("uses the listing passed in, not the URL param", () => {
    expect(parse("listing=other").listing).toBe(LISTING);
  });

  it("ignores an unknown status, band and sort", () => {
    const state = parse("status=hired&band=great&sort=oldest");
    expect(state.status).toBeUndefined();
    expect(state.band).toBeUndefined();
    expect(state.sort).toBe("match");
  });

  it("accepts a known status, band and sort", () => {
    const state = parse("status=interview&band=weak&sort=newest");
    expect(state.status).toBe("interview");
    expect(state.band).toBe("weak");
    expect(state.sort).toBe("newest");
  });

  it("trims and caps the search", () => {
    expect(parse("q=%20%20maria%20%20").q).toBe("maria");
    expect(parse(`q=${"a".repeat(100)}`).q).toHaveLength(80);
  });

  it("falls back to page 1 for invalid pages", () => {
    expect(parse("page=0").page).toBe(1);
    expect(parse("page=abc").page).toBe(1);
    expect(parse("page=-2").page).toBe(1);
    expect(parse("page=4").page).toBe(4);
  });
});
