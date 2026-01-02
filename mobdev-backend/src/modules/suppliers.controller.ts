import { Response } from "express";
import { prisma } from "../db";
import { AuthedReq } from "../auth/auth.middleware";
import { z } from "zod";

const supplierSchema = z.object({
  name: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  note: z.string().optional(),
});

export async function listSuppliers(req: AuthedReq, res: Response) {
  const uid = req.user!.id;
  const data = await prisma.supplier.findMany({
    where: { ownerUserId: uid },
    orderBy: { name: "asc" }
  });
  res.json({ ok: true, data });
}

export async function createSupplier(req: AuthedReq, res: Response) {
  const uid = req.user!.id;
  const parsed = supplierSchema.safeParse(req.body);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Invalid body";
    return res.status(400).json({ ok: false, message: msg });
  }
  const body = parsed.data;
  try {
    const data = await prisma.supplier.create({
      data: { ...body, ownerUserId: uid }
    });
    res.json({ ok: true, data });
  } catch (e: any) {
    res.status(400).json({ ok: false, message: e.message });
  }
}

/** Delta: updatedAt > since olanları döndürür (yoksa hepsini) */
export async function deltaSuppliers(req: AuthedReq, res: Response) {
  const uid = req.user!.id;
  const since = req.query.since ? new Date(String(req.query.since)) : null;

  const data = await prisma.supplier.findMany({
    where: {
      ownerUserId: uid,
      ...(since ? { updatedAt: { gt: since } } : {})
    },
    orderBy: { updatedAt: "asc" }
  });

  res.json({ ok: true, data });
}

/** Mobilin gönderdiği listeyi (name+ownerUserId unique) upsert eder */
export async function bulkUpsertSuppliers(req: AuthedReq, res: Response) {
  const uid = req.user!.id;
  const items = (req.body as any[]) ?? [];

  for (const it of items) {
    await prisma.supplier.upsert({
      where: { name_ownerUserId: { name: it.name, ownerUserId: uid } },
      update: {
        phone: it.phone ?? null,
        email: it.email ?? null,
        address: it.address ?? null,
        note: it.note ?? null,
        // updatedAt Prisma tarafından @updatedAt ile otomatik set edilir
      },
      create: {
        name: it.name,
        phone: it.phone ?? null,
        email: it.email ?? null,
        address: it.address ?? null,
        note: it.note ?? null,
        ownerUserId: uid,
      },
    });
  }

  res.json({ ok: true, count: items.length });
}
