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

export function buildAuthAccess(role: AuthRole) {
  if (role === "anonymous") {
    return { role: "anonymous", permissions: [] };
  }

  // The role comes from get_my_crm_access(), backed only by crm_user_roles.
  // RLS remains authoritative for every data operation.
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
