// mobdev-backend/src/users/users.controller.ts
import { Response } from "express";
import { prisma } from "../db";
import { AuthedReq } from "../auth/auth.middleware";
import bcrypt from "bcryptjs";

export async function listUsers(req: any, res: Response) {
  const adminReq = req as AuthedReq;
  const orgId = adminReq.user!.organizationId;

  const users = await prisma.user.findMany({
    where: { organizationId: orgId },
    select: { id: true, username: true, role: true },
    orderBy: { id: "asc" },
  });
  res.json(users);
}

export async function createUser(req: any, res: Response) {
  const adminReq = req as AuthedReq;
  const orgId = adminReq.user!.organizationId;

  const { username, password, role } = req.body;
  if (!username || !password || !role) {
    return res.status(400).json({ error: "Eksik alanlar" });
  }
  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) return res.status(400).json({ error: "Kullanıcı zaten var" });

  const hash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      username,
      password: hash,
      role,
      organizationId: orgId
    }
  });
  res.json({ id: user.id, username: user.username, role: user.role });
}

export async function updateUser(req: any, res: Response) {
  const adminReq = req as AuthedReq;
  const orgId = adminReq.user!.organizationId;

  const id = Number(req.params.id);
  const { username, password, role } = req.body;

  // Ensure user exists in this Org
  const target = await prisma.user.findFirst({ where: { id, organizationId: orgId } });
  if (!target) return res.status(404).json({ error: "Kullanıcı bulunamadı" });

  const data: any = { username, role };
  if (password) {
    data.password = await bcrypt.hash(password, 10);
  }

  const user = await prisma.user.update({
    where: { id },
    data,
  });
  res.json({ id: user.id, username: user.username, role: user.role });
}

export async function deleteUser(req: any, res: Response) {
  const adminReq = req as AuthedReq;
  const orgId = adminReq.user!.organizationId;

  const id = Number(req.params.id);

  // Prevent deleting self? Maybe.
  if (id === adminReq.user!.id) {
    return res.status(400).json({ error: "Kendinizi silemezsiniz" });
  }

  const target = await prisma.user.findFirst({ where: { id, organizationId: orgId } });
  if (!target) return res.status(404).json({ error: "Kullanıcı bulunamadı" });

  await prisma.user.delete({ where: { id } });
  res.json({ success: true });
}
