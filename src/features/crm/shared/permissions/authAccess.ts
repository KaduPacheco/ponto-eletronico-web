import { User } from "@supabase/supabase-js";
import { CRM_ROUTES } from "@/features/crm/shared/constants/routes";
import { AuthAccess, AuthPermission, AuthRole } from "@/features/crm/shared/types/auth-access";

export type { AuthAccess, AuthPermission, AuthRole } from "@/features/crm/shared/types/auth-access";

const ALL_AUTH_PERMISSIONS: AuthPermission[] = [
  "crm:access",
  "crm:dashboard:read",
  "crm:leads:read",
  "crm:leads:write",
  "crm:notes:write",
  "crm:tasks:write",
];

export function buildAuthAccess(user: User | null): AuthAccess {
  if (!user) {
    return { role: "anonymous", permissions: [] };
  }

  const role = resolveAuthRole(user);

  // This is only a UI affordance. Database RLS is authoritative.
  // app_metadata is set by trusted server-side administration, unlike user_metadata.
  if (role === "admin" || role === "manager") {
    return { role, permissions: [...ALL_AUTH_PERMISSIONS] };
  }

  return { role, permissions: [] };
}

export function hasPermission(access: AuthAccess, permission: AuthPermission) {
  return access.permissions.includes(permission);
}

export function getDefaultAuthorizedCrmRoute(access: AuthAccess) {
  if (hasPermission(access, "crm:dashboard:read")) return CRM_ROUTES.root;
  if (hasPermission(access, "crm:leads:read")) return CRM_ROUTES.leads;
  return CRM_ROUTES.login;
}

function resolveAuthRole(user: User): AuthRole {
  const candidates = [user.app_metadata?.crm_role, user.app_metadata?.role];

  for (const candidate of candidates) {
    if (candidate === "admin" || candidate === "manager" || candidate === "authenticated") {
      return candidate;
    }
  }

  return "authenticated";
}
