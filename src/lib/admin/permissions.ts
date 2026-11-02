import { ApiError } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/permissions";
import { userRoles, type UserRole } from "@/models/User";
import { adminPermissions, type AdminPermission } from "@/types/admin";
export { adminPermissions };
export type { AdminPermission };

const permissionsByRole: Record<UserRole, readonly AdminPermission[]> = {
  super_admin: adminPermissions,
  admin: adminPermissions.filter((permission) => permission !== "settings:manage" && permission !== "finance:manage"),
  manager: [
    "dashboard:view", "creator:read", "creator:manage", "brand:read", "campaign:read", "campaign:manage",
    "enquiry:read", "enquiry:manage", "contact:read", "contact:manage", "content:read", "content:manage",
    "analytics:read", "notification:read", "activity:read",
  ],
  campaign_manager: ["dashboard:view", "creator:read", "brand:read", "campaign:read", "campaign:manage", "analytics:read", "notification:read"],
  creator_manager: ["dashboard:view", "creator:read", "creator:manage", "campaign:read", "notification:read"],
  sales_executive: ["dashboard:view", "brand:read", "enquiry:read", "enquiry:manage", "contact:read", "contact:manage", "notification:read"],
  finance_manager: ["dashboard:view", "campaign:read", "analytics:read", "finance:read", "finance:manage"],
  brand: [],
  creator: [],
};

export function roleHasPermission(role: UserRole, permission: AdminPermission, overrides?: readonly string[]): boolean {
  const allowed = permissionsByRole[role].includes(permission);
  return allowed && (overrides === undefined || overrides.includes(permission));
}

export function getRolePermissions(role: UserRole): readonly AdminPermission[] {
  return permissionsByRole[role];
}

export async function requireAdminPermission(permission: AdminPermission) {
  const user = await getCurrentUser();
  if (!roleHasPermission(user.role, permission, user.permissions)) {
    throw new ApiError("You do not have permission to perform this action.", 403);
  }
  return user;
}

export async function requireAdminRole() {
  const user = await getCurrentUser();
  const role = userRoles.find((candidate) => candidate === user.role);
  if (!role || !roleHasPermission(role, "dashboard:view", user.permissions)) {
    throw new ApiError("You do not have permission to access the admin area.", 403);
  }
  return user;
}

export function canAssignRole(actor: UserRole, target: UserRole): boolean {
  if (target === "super_admin" || target === "brand" || target === "creator") return false;
  return actor === "super_admin" || (actor === "admin" && target !== "admin");
}
