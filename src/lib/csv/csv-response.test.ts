import { describe, expect, it } from "vitest";

import { csvResponse } from "./csv-response";

describe("csvResponse", () => {
  it("sets download headers and the body", async () => {
    const response = csvResponse("a,b\r\n", "users_2026-01-02.csv");
    expect(response.headers.get("Content-Type")).toBe("text/csv; charset=utf-8");
    expect(response.headers.get("Content-Disposition")).toBe(
      'attachment; filename="users_2026-01-02.csv"',
    );
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(await response.text()).toBe("a,b\r\n");
  });
});
