import { describe, expect, it } from "vitest";
import { buildAuthAccess, hasPermission } from "../authAccess";

describe("authAccess", () => {
  it("denies anonymous and unprovisioned users", () => {
    expect(buildAuthAccess("anonymous").permissions).toEqual([]);
    expect(buildAuthAccess("authenticated").permissions).toEqual([]);
  });

  it("accepts only a manager or admin role returned by the database", () => {
    const access = buildAuthAccess("manager");
    expect(hasPermission(access, "crm:dashboard:read")).toBe(true);
  });

  it("grants task access to an admin role", () => {
    expect(hasPermission(buildAuthAccess("admin"), "crm:tasks:write")).toBe(true);
  });
});
