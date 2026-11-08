import { describe, expect, it } from "vitest";

import { adminUserIdSchema, listAdminUsersQuerySchema } from "./admin-user.validator";

describe("adminUserIdSchema", () => {
  it("accepts a uuid and rejects anything else", () => {
    expect(adminUserIdSchema.safeParse("9d2c4f6a-1b3e-4a85-8c07-6e5d4c3b2a19").success).toBe(true);
    expect(adminUserIdSchema.safeParse("nope").success).toBe(false);
  });
});

describe("listAdminUsersQuerySchema", () => {
  it("defaults to page 1 with no filters", () => {
    expect(listAdminUsersQuerySchema.parse({})).toEqual({ page: 1 });
  });

  it("trims q and coerces page", () => {
    const result = listAdminUsersQuerySchema.parse({ q: "  jo  ", page: "3" });
    expect(result.q).toBe("jo");
    expect(result.page).toBe(3);
  });

  it("rejects a q over 80 characters", () => {
    expect(listAdminUsersQuerySchema.safeParse({ q: "a".repeat(81) }).success).toBe(false);
  });

  it("accepts known roles and statuses only", () => {
    expect(listAdminUsersQuerySchema.safeParse({ role: "administrator" }).success).toBe(true);
    expect(listAdminUsersQuerySchema.safeParse({ status: "suspended" }).success).toBe(true);
    expect(listAdminUsersQuerySchema.safeParse({ role: "owner" }).success).toBe(false);
    expect(listAdminUsersQuerySchema.safeParse({ status: "banned" }).success).toBe(false);
  });

  it("bounds page between 1 and 1000", () => {
    expect(listAdminUsersQuerySchema.safeParse({ page: "0" }).success).toBe(false);
    expect(listAdminUsersQuerySchema.safeParse({ page: "1000" }).success).toBe(true);
    expect(listAdminUsersQuerySchema.safeParse({ page: "1001" }).success).toBe(false);
    expect(listAdminUsersQuerySchema.safeParse({ page: "1.5" }).success).toBe(false);
  });
});
