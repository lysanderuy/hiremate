import { describe, expect, it, vi } from "vitest";

import { retryDatabaseRead } from "./retry";

describe("retryDatabaseRead", () => {
  it("retries a transient database connection failure once", async () => {
    const error = Object.assign(new Error("connection reset"), { code: "ECONNRESET" });
    const operation = vi.fn().mockRejectedValueOnce(error).mockResolvedValueOnce("success");

    await expect(retryDatabaseRead(operation)).resolves.toBe("success");
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it("does not retry a non-transient failure", async () => {
    const operation = vi.fn().mockRejectedValue(new Error("invalid query"));

    await expect(retryDatabaseRead(operation)).rejects.toThrow("invalid query");
    expect(operation).toHaveBeenCalledTimes(1);
  });
});
