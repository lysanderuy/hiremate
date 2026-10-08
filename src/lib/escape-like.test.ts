import { describe, expect, it } from "vitest";

import { escapeLike } from "./escape-like";

describe("escapeLike", () => {
  it("leaves plain text unchanged", () => {
    expect(escapeLike("maria santos")).toBe("maria santos");
  });

  it("escapes percent, underscore and backslash", () => {
    expect(escapeLike("50%_off\\now")).toBe("50\\%\\_off\\\\now");
  });

  it("returns an empty string for empty input", () => {
    expect(escapeLike("")).toBe("");
  });
});
