import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../env";
import { prisma } from "../db";

export type UserRole = "Admin" | "Manager" | "Staff";
export type AuthedReq = Request & { user?: { id: number; role: UserRole; organizationId: number } };

function hasTimedOut(payload: any) {
  if (!payload?.iat) return false;
  const issued = payload.iat * 1000;
  const idleMs = env.SESSION_IDLE_MINUTES * 60 * 1000;
  return Date.now() - issued > idleMs;
}

export function authRequired(req: AuthedReq, res: Response, next: NextFunction) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token) return res.status(401).json({ ok: false, message: "No token" });

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as any;
    if (hasTimedOut(payload)) {
      return res.status(401).json({ ok: false, message: "Session timed out" });
    }
    // Backward compatibility: if token relies on old schema, it might fail.
    // Ideally we require organizationId. For dev reset, it should be fine.
    req.user = { id: payload.id, role: payload.role, organizationId: payload.organizationId };

    res.on("finish", () => {
      if (!req.user) return;
      prisma.userActivity
        .create({
          data: {
            userId: req.user.id,
            action: req.route?.path || req.path,
            path: req.originalUrl,
            method: req.method,
            status: res.statusCode,
          },
        })
        .catch(() => {});
    });

    next();
  } catch {
    return res.status(401).json({ ok: false, message: "Invalid token" });
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: AuthedReq, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ ok: false, message: "Forbidden" });
    }
    next();
  };
}

export const onlyAdmin = requireRole("Admin");
