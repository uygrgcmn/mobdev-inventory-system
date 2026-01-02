// mobdev-backend/src/middleware/roleGuard.ts
import { Response, NextFunction } from "express";
import { AuthedReq } from "../auth/auth.middleware";

export function requireRole(roles: ("Admin" | "Manager" | "Staff")[]) {
  return (req: AuthedReq, res: Response, next: NextFunction) => {
    const userRole = req.user?.role;
    if (!userRole || !roles.includes(userRole)) {
      return res.status(403).json({ ok: false, message: "Forbidden" });
    }
    next();
  };
}
