// src/hooks/useAccess.ts
import { useAuth } from "../context/AuthContext";
import { can, canAny, Perm } from "../permissions/acl";

export function useAccess() {
  const { user } = useAuth();
  const role = user?.role;
  return {
    role,
    can: (p: Perm) => can(role as any, p),
    canAny: (arr: Perm[]) => canAny(role as any, arr),
  };
}
