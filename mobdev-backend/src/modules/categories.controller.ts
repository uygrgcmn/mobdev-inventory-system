import { Response } from "express";
import { prisma } from "../db";
import { AuthedReq } from "../auth/auth.middleware";
import { z } from "zod";

const categorySchema = z.object({
  name: z.string().min(1),
});

export async function listCategories(req: AuthedReq, res: Response) {
  const orgId = req.user!.organizationId;
  const data = await prisma.category.findMany({
    where: { organizationId: orgId },
    orderBy: { name: "asc" },
  });
  res.json({ ok: true, data });
}

export async function createCategory(req: AuthedReq, res: Response) {
  const orgId = req.user!.organizationId;
  const parsed = categorySchema.safeParse(req.body);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Invalid body";
    return res.status(400).json({ ok: false, message: msg });
  }
  const { name } = parsed.data;

  const data = await prisma.category.upsert({
    where: { name_organizationId: { name, organizationId: orgId } },
    update: {},
    create: { name, organizationId: orgId },
  });

  res.json({ ok: true, data });
}
