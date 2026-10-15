import { describe, expect, it } from "vitest";

import { normalizeMatcherUrl } from "./matcher-url";

describe("normalizeMatcherUrl", () => {
  it("strips trailing slashes", () => {
    expect(normalizeMatcherUrl("https://matcher.example.com/", true)).toBe(
      "https://matcher.example.com",
    );
  });

  it("allows http outside production", () => {
    expect(normalizeMatcherUrl("http://matcher.internal:8000", false)).toBe(
      "http://matcher.internal:8000",
    );
  });

  it("allows http for localhost in production", () => {
    expect(normalizeMatcherUrl("http://localhost:8000", true)).toBe("http://localhost:8000");
    expect(normalizeMatcherUrl("http://127.0.0.1:8000/", true)).toBe("http://127.0.0.1:8000");
  });

  it("rejects http for remote hosts in production", () => {
    expect(normalizeMatcherUrl("http://matcher.example.com", true)).toBeNull();
  });

  it("rejects invalid and non-http urls", () => {
    expect(normalizeMatcherUrl("not a url", false)).toBeNull();
    expect(normalizeMatcherUrl("ftp://matcher.example.com", false)).toBeNull();
  });
});
