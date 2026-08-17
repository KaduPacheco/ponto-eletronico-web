import type { User } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import { buildAuthAccess, getDefaultAuthorizedCrmRoute, hasPermission } from "@/lib/authAccess";

function createUser(overrides: Partial<User> = {}) {
  return {
    id: "user-1",
    app_metadata: {},
    user_metadata: {},
    aud: "authenticated",
    created_at: "2026-04-13T10:00:00.000Z",
    ...overrides,
  } as User;
}

describe("authAccess", () => {
  it("builds anonymous access when there is no user", () => {
    const access = buildAuthAccess(null);

    expect(access).toEqual({
      role: "anonymous",
      permissions: [],
    });
    expect(hasPermission(access, "crm:access")).toBe(false);
  });

  it("grants all permissions to admin users", () => {
    const user = createUser({
      app_metadata: {
        crm_role: "admin",
      },
    });

    const access = buildAuthAccess(user);

    expect(access.role).toBe("admin");
    expect(access.permissions).toEqual([
      "crm:access",
      "crm:dashboard:read",
      "crm:leads:read",
      "crm:leads:write",
      "crm:notes:write",
      "crm:tasks:write",
    ]);
    expect(hasPermission(access, "crm:tasks:write")).toBe(true);
  });

  it("grants all permissions to manager users", () => {
    const user = createUser({
      app_metadata: {
        crm_role: "manager",
      },
    });

    const access = buildAuthAccess(user);

    expect(access.role).toBe("manager");
    expect(access.permissions).toEqual([
      "crm:access",
      "crm:dashboard:read",
      "crm:leads:read",
      "crm:leads:write",
      "crm:notes:write",
      "crm:tasks:write",
    ]);
    expect(hasPermission(access, "crm:notes:write")).toBe(true);
    expect(hasPermission(access, "crm:tasks:write")).toBe(true);
  });

  it("ignores user metadata permissions", () => {
    const user = createUser({
      app_metadata: {
        role: "authenticated",
      },
      user_metadata: {
        crm_permissions: ["crm:tasks:write"],
      },
    });

    const access = buildAuthAccess(user);

    expect(access.role).toBe("authenticated");
    expect(access.permissions).toEqual([]);
    expect(hasPermission(access, "crm:tasks:write")).toBe(false);
  });

  it("denies CRM permissions by default for authenticated users", () => {
    const user = createUser({
    });

    const access = buildAuthAccess(user);

    expect(access.role).toBe("authenticated");
    expect(access.permissions).toEqual([]);
  });

  it("resolves the safest CRM fallback route from the current permissions", () => {
    expect(
      getDefaultAuthorizedCrmRoute({
        role: "manager",
        permissions: ["crm:access", "crm:dashboard:read"],
      }),
    ).toBe("/crm");

    expect(
      getDefaultAuthorizedCrmRoute({
        role: "manager",
        permissions: ["crm:access", "crm:leads:read"],
      }),
    ).toBe("/crm/leads");

    expect(
      getDefaultAuthorizedCrmRoute({
        role: "authenticated",
        permissions: ["crm:access"],
      }),
    ).toBe("/crm/login");
  });
});
