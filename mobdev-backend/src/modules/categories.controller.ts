import { Response } from "express";
import { prisma } from "../db";
import { AuthedReq } from "../auth/auth.middleware";
import { z } from "zod";

const categorySchema = z.object({
  name: z.string().min(1),
});

export async function listCategories(req: AuthedReq, res: Response) {
  const uid = req.user!.id;
  const data = await prisma.category.findMany({
    where: { ownerUserId: uid },
    orderBy: { name: "asc" },
  });
  res.json({ ok: true, data });
}

export async function createCategory(req: AuthedReq, res: Response) {
  const uid = req.user!.id;
  const parsed = categorySchema.safeParse(req.body);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Invalid body";
    return res.status(400).json({ ok: false, message: msg });
  }
  const { name } = parsed.data;

  const data = await prisma.category.upsert({
    where: { name_ownerUserId: { name, ownerUserId: uid } },
    update: {},
    create: { name, ownerUserId: uid },
  });

  res.json({ ok: true, data });
}
