import { describe, expect, it } from "vitest";
import { buildAuthAccess, getDefaultAuthorizedCrmRoute, hasPermission } from "@/lib/authAccess";

describe("authAccess", () => {
  it("denies access without an authenticated session", () => {
    expect(buildAuthAccess("anonymous")).toEqual({ role: "anonymous", permissions: [] });
  });

  it("grants CRM permissions only to database-provided manager and admin roles", () => {
    for (const role of ["manager", "admin"] as const) {
      const access = buildAuthAccess(role);
      expect(access.permissions).toContain("crm:tasks:write");
    }
  });

  it("denies CRM permissions by default for authenticated users", () => {
    const access = buildAuthAccess("authenticated");
    expect(access.permissions).toEqual([]);
    expect(hasPermission(access, "crm:access")).toBe(false);
  });

  it("grants dashboard access to a manager", () => {
    expect(hasPermission(buildAuthAccess("manager"), "crm:dashboard:read")).toBe(true);
  });

  it("grants lead editing to an admin", () => {
    expect(hasPermission(buildAuthAccess("admin"), "crm:leads:write")).toBe(true);
  });

  it("does not turn an authenticated role into CRM access", () => {
    expect(hasPermission(buildAuthAccess("authenticated"), "crm:tasks:write")).toBe(false);
  });

  it("resolves the safest fallback route", () => {
    expect(getDefaultAuthorizedCrmRoute({ role: "manager", permissions: ["crm:access", "crm:dashboard:read"] })).toBe("/crm");
    expect(getDefaultAuthorizedCrmRoute({ role: "authenticated", permissions: [] })).toBe("/crm/login");
  });
});
