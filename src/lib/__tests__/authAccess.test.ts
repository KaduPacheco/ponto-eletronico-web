import { describe, expect, it } from "vitest";
import { buildAuthAccess, hasPermission } from "../authAccess";

describe("authAccess", () => {
  it("retorna acesso anonimo quando não há usuário", () => {
    const access = buildAuthAccess(null);

    expect(access.role).toBe("anonymous");
    expect(access.permissions).toEqual([]);
    expect(hasPermission(access, "crm:access")).toBe(false);
  });

  it("garante permissões padrao para usuário autenticado", () => {
    const access = buildAuthAccess({
      app_metadata: {},
      user_metadata: {},
    } as never);

    expect(access.role).toBe("authenticated");
    expect(access.permissions).toContain("crm:access");
    expect(access.permissions).toContain("crm:leads:write");
    expect(hasPermission(access, "crm:dashboard:read")).toBe(true);
  });

  it("respeita permissões customizadas vindas do metadata", () => {
    const access = buildAuthAccess({
      app_metadata: {
        crm_role: "manager",
        crm_permissions: ["crm:dashboard:read", "crm:leads:read"],
      },
      user_metadata: {},
    } as never);

    expect(access.role).toBe("manager");
    expect(access.permissions).toEqual(["crm:access", "crm:dashboard:read", "crm:leads:read"]);
    expect(hasPermission(access, "crm:leads:write")).toBe(false);
  });
});
