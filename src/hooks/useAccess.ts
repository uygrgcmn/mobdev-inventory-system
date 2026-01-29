import { useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { can, canAny, Perm } from "../permissions/acl";

export function useAccess() {
  const { user } = useAuth();
  const role = user?.role;

  const check = useCallback((p: Perm) => can(role as any, p), [role]);
  const checkAny = useCallback((arr: Perm[]) => canAny(role as any, arr), [role]);

  return {
    role,
    can: check,
    canAny: checkAny,
  };
}
