// src/permissions/acl.ts
export type Role = "Admin" | "Manager" | "Staff";
export type Perm =
  | "products:read"
  | "products:write"
  | "products:view_cost" // can see unitPrice/buying price
  | "products:delete"
  | "suppliers:read"
  | "suppliers:write"
  | "users:manage"
  | "reports:financial" // cost, valuation
  | "reports:stock"     // movement, quantities
  | "sync:run"
  | "stock:update"
  | "audit:view";       // view stock transaction history details

const ACL: Record<Role, Perm[]> = {
  Admin: [
    "products:read",
    "products:write",
    "products:view_cost",
    "products:delete",
    "suppliers:read",
    "suppliers:write",
    "users:manage",
    "reports:financial",
    "reports:stock",
    "sync:run",
    "stock:update",
    "audit:view",
  ],
  Manager: [
    "products:read",
    "products:write",
    "products:view_cost",
    "suppliers:read",
    "suppliers:write",
    "reports:stock",
    "sync:run",
    "stock:update",
    "audit:view",
  ],
  Staff: [
    "products:read",
    "suppliers:read",
    "stock:update",
    "sync:run",
    // No reports, no cost view, no delete
  ],
};

export function can(role: Role | undefined, perm: Perm) {
  if (!role) return false;
  return ACL[role]?.includes(perm) ?? false;
}

export function canAny(role: Role | undefined, perms: Perm[]) {
  return perms.some((p) => can(role, p));
}
