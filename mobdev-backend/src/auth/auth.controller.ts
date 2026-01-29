// mobdev-backend/src/auth/auth.controller.ts
import { Request, Response } from "express";
import { prisma } from "../db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../env";
import { z } from "zod";
import { AuthedReq } from "./auth.middleware";

/* ------------------------------ Schemas ------------------------------ */

const passwordRule = z
  .string()
  .min(12, "Password must be at least 12 chars")
  .regex(/[A-Z]/, "Password must include an uppercase letter")
  .regex(/[a-z]/, "Password must include a lowercase letter")
  .regex(/[0-9]/, "Password must include a digit")
  .regex(/[^A-Za-z0-9]/, "Password must include a special character");

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 chars"),
  password: passwordRule,
  // Role is always Admin for new registrations
  organizationName: z.string().min(2, "Company name is required"),
});

const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

/* ------------------------------ Helpers ------------------------------ */

function signToken(payload: { id: number; role: "Admin" | "Manager" | "Staff"; organizationId: number }) {
  if (!env.JWT_SECRET) throw new Error("Missing JWT_SECRET");
  return jwt.sign(payload as jwt.JwtPayload, env.JWT_SECRET as jwt.Secret, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
}

/* --------------------------------- API -------------------------------- */

export async function register(req: Request, res: Response) {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? "Invalid body";
      return res.status(400).json({ ok: false, message: msg });
    }

    const { username, password, organizationName } = parsed.data;

    const exists = await prisma.user.findUnique({ where: { username } });
    if (exists) {
      return res.status(400).json({ ok: false, message: "Username exists" });
    }

    const hash = await bcrypt.hash(password, 10);

    // Always create a new Organization for public registration
    const org = await prisma.organization.create({
      data: { name: organizationName }
    });

    const u = await prisma.user.create({
      data: {
        username,
        password: hash,
        role: "Admin", // Always Admin
        organizationId: org.id,
      },
    });

    return res.json({
      ok: true,
      data: {
        id: u.id,
        username: u.username,
        role: u.role,
        organizationId: u.organizationId,
        organizationName: org.name
      },
    });
  } catch (e: any) {
    console.error("REGISTER_ERROR:", e);
    return res.status(500).json({ ok: false, message: e?.message || "Register failed" });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, message: "Invalid body" });
    }

    const { username, password } = parsed.data;

    const u = await prisma.user.findUnique({
      where: { username },
      include: { organization: true }
    });
    if (!u) return res.status(401).json({ ok: false, message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, u.password);
    if (!ok) return res.status(401).json({ ok: false, message: "Invalid credentials" });

    const token = signToken({ id: u.id, role: u.role, organizationId: u.organizationId });

    return res.json({
      ok: true,
      data: {
        token,
        user: {
          id: u.id,
          username: u.username,
          role: u.role,
          organizationId: u.organizationId,
          organizationName: (u as any).organization?.name // needs include in query
        },
      },
    });
  } catch (e: any) {
    console.error("LOGIN_ERROR:", e);
    return res.status(500).json({ ok: false, message: e?.message || "Login failed" });
  }
}

/** Token doğrulandıktan sonra mevcut kullanıcıyı döndürür */
export async function me(req: AuthedReq, res: Response) {
  try {
    const id = req.user!.id;
    const u = await prisma.user.findUnique({
      where: { id },
      include: { organization: true },
    });
    // @ts-ignore
    const orgName = u.organization?.name;
    if (!u) return res.status(404).json({ ok: false, message: "User not found" });

    return res.json({
      ok: true,
      data: {
        id: u.id,
        username: u.username,
        role: u.role,
        organizationId: u.organizationId,
        organizationName: orgName
      }
    });
  } catch (e: any) {
    console.error("ME_ERROR:", e);
    return res.status(500).json({ ok: false, message: e?.message || "Failed to fetch user" });
  }
}
