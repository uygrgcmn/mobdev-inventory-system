// src/permissions/acl.ts
export type Role = "Admin" | "Manager" | "Staff";
export type Perm =
  | "products:read"
  | "products:write"
  | "suppliers:read"
  | "suppliers:write"
  | "users:manage"
  | "reports:read"
  | "sync:run";

const ACL: Record<Role, Perm[]> = {
  Admin: [
    "products:read",
    "products:write",
    "suppliers:read",
    "suppliers:write",
    "users:manage",
    "reports:read",
    "sync:run",
  ],
  Manager: [
    "products:read",
    "products:write",
    "suppliers:read",
    "suppliers:write",
    "reports:read",
    "sync:run",
  ],
  Staff: [
    "products:read",
    "suppliers:read",
    "reports:read",
  ],
};

export function can(role: Role | undefined, perm: Perm) {
  if (!role) return false;
  return ACL[role]?.includes(perm) ?? false;
}

export function canAny(role: Role | undefined, perms: Perm[]) {
  return perms.some((p) => can(role, p));
}
