// mobdev-backend/src/users/users.controller.ts
import { Request, Response } from "express";
import { prisma } from "../db"; // mevcut prisma instance

export async function listUsers(req: Request, res: Response) {
  const users = await prisma.user.findMany({
    select: { id: true, username: true, role: true },
    orderBy: { id: "asc" },
  });
  res.json(users);
}

export async function createUser(req: Request, res: Response) {
  const { username, password, role } = req.body;
  if (!username || !password || !role) {
    return res.status(400).json({ error: "Eksik alanlar" });
  }
  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) return res.status(400).json({ error: "Kullanıcı zaten var" });
  const user = await prisma.user.create({ data: { username, password, role } });
  res.json({ id: user.id, username: user.username, role: user.role });
}

export async function updateUser(req: Request, res: Response) {
  const id = Number(req.params.id);
  const { username, password, role } = req.body;
  const user = await prisma.user.update({
    where: { id },
    data: { username, password, role },
  });
  res.json(user);
}

export async function deleteUser(req: Request, res: Response) {
  const id = Number(req.params.id);
  await prisma.user.delete({ where: { id } });
  res.json({ success: true });
}
