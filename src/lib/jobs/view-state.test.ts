import { describe, expect, it } from "vitest";

import { buildQuery, parseMinPay, parseViewState, type JobsViewState } from "./view-state";

const defaults: JobsViewState = {
  q: "",
  location: "",
  type: undefined,
  minPay: undefined,
  sort: "newest",
  page: 1,
};

function parse(query: string): JobsViewState {
  return parseViewState(new URLSearchParams(query));
}

describe("buildQuery", () => {
  it("emits nothing for default state", () => {
    expect(buildQuery(defaults)).toBe("");
  });

  it("includes non-default values", () => {
    const params = new URLSearchParams(
      buildQuery({
        q: "react",
        location: "Manila",
        type: "contract",
        minPay: 40000,
        sort: "best_match",
        page: 3,
      }),
    );
    expect(params.get("q")).toBe("react");
    expect(params.get("location")).toBe("Manila");
    expect(params.get("type")).toBe("contract");
    expect(params.get("minPay")).toBe("40000");
    expect(params.get("sort")).toBe("best_match");
    expect(params.get("page")).toBe("3");
  });

  it("keeps a minimum pay of zero", () => {
    expect(buildQuery({ ...defaults, minPay: 0 })).toBe("minPay=0");
  });
});

describe("parseViewState", () => {
  it("returns defaults for an empty query", () => {
    expect(parse("")).toEqual(defaults);
  });

  it("ignores an unknown type and sort", () => {
    const state = parse("type=freelance&sort=oldest");
    expect(state.type).toBeUndefined();
    expect(state.sort).toBe("newest");
  });

  it("accepts a known type and sort", () => {
    const state = parse("type=part_time&sort=best_match");
    expect(state.type).toBe("part_time");
    expect(state.sort).toBe("best_match");
  });

  it("trims and caps text filters", () => {
    expect(parse("q=%20%20react%20%20").q).toBe("react");
    expect(parse(`location=${"a".repeat(100)}`).location).toHaveLength(80);
  });

  it("falls back to page 1 for invalid pages and caps at 1000", () => {
    expect(parse("page=0").page).toBe(1);
    expect(parse("page=abc").page).toBe(1);
    expect(parse("page=-2").page).toBe(1);
    expect(parse("page=4").page).toBe(4);
    expect(parse("page=5000").page).toBe(1000);
  });
});

describe("parseMinPay", () => {
  it("accepts whole numbers", () => {
    expect(parseMinPay("40000")).toBe(40000);
    expect(parseMinPay(" 0 ")).toBe(0);
  });

  it("rejects empty, negative, decimal and non-numeric input", () => {
    expect(parseMinPay(null)).toBeUndefined();
    expect(parseMinPay("")).toBeUndefined();
    expect(parseMinPay("-5")).toBeUndefined();
    expect(parseMinPay("1.5")).toBeUndefined();
    expect(parseMinPay("abc")).toBeUndefined();
  });

  it("caps very large values", () => {
    expect(parseMinPay("999999999999")).toBe(100_000_000);
  });
});
