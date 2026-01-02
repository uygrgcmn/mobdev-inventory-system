import { Response } from "express";
import { prisma } from "../db";
import { AuthedReq } from "../auth/auth.middleware";
import { z } from "zod";

const changeSchema = z
  .object({
    sku: z.string(),
    name: z.string(),
    categoryId: z.number().int().positive().optional(),
    category: z.string().min(1).optional(),
    quantity: z.coerce.number().int().min(0),
    unitPrice: z.coerce.number().min(0),
    supplierId: z.number().int().positive().optional(),
    supplierName: z.string().min(1).optional(),
    expiryDate: z.string().nullable().optional(),
    barcode: z.string().optional(),
    minStock: z.coerce.number().int().min(0).optional(),
  })
  .refine((d) => d.categoryId || d.category, { message: "Category required" })
  .refine((d) => d.supplierId || d.supplierName, { message: "Supplier required" });

/** Mobilin upload ettiği değişiklikleri uygula */
export async function uploadChanges(req: AuthedReq, res: Response) {
  const uid = req.user!.id;
  const changes = req.body as any[];

  for (const item of changes) {
    const parsed = changeSchema.safeParse(item);
    if (!parsed.success) {
      return res.status(400).json({ ok: false, message: "Invalid change payload" });
    }
    const payload = parsed.data;

    // Category resolve
    let categoryId = payload.categoryId;
    let categoryName = payload.category?.trim();
    if (!categoryId) {
      const cat = await prisma.category.upsert({
        where: { name_ownerUserId: { name: categoryName!, ownerUserId: uid } },
        update: {},
        create: { name: categoryName!, ownerUserId: uid },
      });
      categoryId = cat.id;
      categoryName = cat.name;
    } else {
      const cat = await prisma.category.findFirst({ where: { id: categoryId, ownerUserId: uid } });
      if (!cat) return res.status(400).json({ ok: false, message: "Category not found" });
      categoryName = cat.name;
    }

    // Supplier resolve
    let supplierId = payload.supplierId;
    let supplierName = payload.supplierName?.trim();
    if (!supplierId) {
      const sup = await prisma.supplier.upsert({
        where: { name_ownerUserId: { name: supplierName!, ownerUserId: uid } },
        update: {},
        create: { name: supplierName!, ownerUserId: uid },
      });
      supplierId = sup.id;
      supplierName = sup.name;
    } else {
      const sup = await prisma.supplier.findFirst({ where: { id: supplierId, ownerUserId: uid } });
      if (!sup) return res.status(400).json({ ok: false, message: "Supplier not found" });
      supplierName = sup.name;
    }

    const existing = await prisma.product.findUnique({
      where: { sku_ownerUserId: { sku: payload.sku, ownerUserId: uid } },
    });

    if (!existing && req.user?.role === "Staff") {
      return res.status(403).json({ ok: false, message: "Staff cannot create new products" });
    }

    if (existing && req.user?.role === "Staff") {
      const wantExpiry = payload.expiryDate ?? null;
      if (wantExpiry !== existing.expiryDate) {
        return res.status(403).json({ ok: false, message: "Staff cannot modify expiry date" });
      }
    }

    if (existing) {
      await prisma.product.update({
        where: { sku_ownerUserId: { sku: payload.sku, ownerUserId: uid } },
        data: {
          name: payload.name,
          category: categoryName,
          categoryId,
          quantity: payload.quantity,
          unitPrice: payload.unitPrice,
          supplierName,
          supplierId,
          expiryDate: payload.expiryDate ?? existing.expiryDate,
          barcode: payload.barcode ?? existing.barcode,
          minStock: payload.minStock ?? existing.minStock,
        },
      });
    } else {
      await prisma.product.create({
        data: {
          sku: payload.sku,
          name: payload.name,
          category: categoryName,
          categoryId,
          quantity: payload.quantity,
          unitPrice: payload.unitPrice,
          supplierName,
          supplierId,
          expiryDate: payload.expiryDate ?? null,
          barcode: payload.barcode ?? null,
          minStock: payload.minStock ?? 0,
          ownerUserId: uid,
        },
      });
    }
  }
  res.json({ ok:true });
}

/** Sunucudaki değişiklikleri indir (since paramı varsa ona göre) */
export async function downloadChanges(req: AuthedReq, res: Response) {
  const uid = req.user!.id;
  const since = req.query.since ? new Date(String(req.query.since)) : null;
  const data = await prisma.product.findMany({
    where: { ownerUserId: uid, ...(since ? { updatedAt: { gt: since } } : {}) },
  });
  res.json({ ok:true, data });
}
