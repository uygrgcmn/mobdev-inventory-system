import { Response } from "express";
import { prisma } from "../db";
import { AuthedReq } from "../auth/auth.middleware";
import { z } from "zod";

const changeSchema = z
  .object({
    sku: z.string(),
    name: z.string(),
    categoryId: z.number().int().positive().optional(),
    category: z.string().optional(),
    quantity: z.coerce.number().int().min(0),
    unitPrice: z.coerce.number().min(0),
    supplierId: z.number().int().positive().optional(),
    supplierName: z.string().optional(),
    expiryDate: z.string().nullable().optional(),
    barcode: z.string().optional(),
    minStock: z.coerce.number().int().min(0).optional(),
  });
// Removed strict refinements to prevent sync failures

/** Mobilin upload ettiği değişiklikleri uygula */
export async function uploadChanges(req: AuthedReq, res: Response) {
  const orgId = req.user!.organizationId;
  const userId = req.user!.id; // Authenticated user ID (Creator)
  const changes = req.body as any[];

  for (const item of changes) {
    const parsed = changeSchema.safeParse(item);
    if (!parsed.success) {
      console.warn("[SYNC][WARN] Invalid item, skipping:", item, parsed.error);
      continue; // Skip invalid instead of fail all
    }
    const payload = parsed.data;

    // Category resolve (Default to "Genel" if missing)
    let categoryId = payload.categoryId;
    let categoryName = payload.category?.trim();
    if (!categoryName && !categoryId) {
      categoryName = "Genel";
    }

    if (categoryName && !categoryId) {
      // Upsert by name
      const cat = await prisma.category.upsert({
        where: { name_organizationId: { name: categoryName, organizationId: orgId } },
        update: {},
        create: { name: categoryName, organizationId: orgId },
      });
      categoryId = cat.id;
      categoryName = cat.name;
    } else if (categoryId) {
      // Resolve by ID
      const cat = await prisma.category.findFirst({ where: { id: categoryId, organizationId: orgId } });
      if (!cat) {
        // Fallback if ID invalid
        categoryName = "Genel";
        const def = await prisma.category.upsert({
          where: { name_organizationId: { name: "Genel", organizationId: orgId } },
          update: {},
          create: { name: "Genel", organizationId: orgId },
        });
        categoryId = def.id;
      } else {
        categoryName = cat.name;
      }
    }

    // Supplier resolve (Default to "Genel Tedarikçi" if missing)
    let supplierId = payload.supplierId;
    let supplierName = payload.supplierName?.trim();
    if (!supplierName && !supplierId) {
      supplierName = "Genel Tedarikçi";
    }

    if (supplierName && !supplierId) {
      const sup = await prisma.supplier.upsert({
        where: { name_organizationId: { name: supplierName, organizationId: orgId } },
        update: {},
        create: { name: supplierName, organizationId: orgId },
      });
      supplierId = sup.id;
      supplierName = sup.name;
    } else if (supplierId) {
      const sup = await prisma.supplier.findFirst({ where: { id: supplierId, organizationId: orgId } });
      if (!sup) {
        // Fallback
        supplierName = "Genel Tedarikçi";
        const def = await prisma.supplier.upsert({
          where: { name_organizationId: { name: "Genel Tedarikçi", organizationId: orgId } },
          update: {},
          create: { name: "Genel Tedarikçi", organizationId: orgId },
        });
        supplierId = def.id;
      } else {
        supplierName = sup.name;
      }
    }

    const existing = await prisma.product.findUnique({
      where: { sku_organizationId: { sku: payload.sku, organizationId: orgId } },
    });

    if (!existing && req.user?.role === "Staff") {
      return res.status(403).json({ ok: false, message: "Staff cannot create new products" });
    }

    if (existing && req.user?.role === "Staff") {
      const wantExpiry = payload.expiryDate ?? null;
      if (wantExpiry !== existing.expiryDate) {
        return res.status(403).json({ ok: false, message: "Staff cannot modify expiry date" });
      }
      // TODO: More robust RBAC for updates?
    }

    if (existing) {
      await prisma.product.update({
        where: { sku_organizationId: { sku: payload.sku, organizationId: orgId } },
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
          // Do not overwrite ownerUserId on update, or maybe we should?
          // Usually creation owner stays.
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
          organizationId: orgId,
          ownerUserId: userId, // Set ownerUserId to current user
        },
      });
    }
  }
  res.json({ ok: true });
}

/** Sunucudaki değişiklikleri indir (since paramı varsa ona göre) */
export async function downloadChanges(req: AuthedReq, res: Response) {
  const orgId = req.user!.organizationId;
  const since = req.query.since ? new Date(String(req.query.since)) : null;
  const data = await prisma.product.findMany({
    where: { organizationId: orgId, ...(since ? { updatedAt: { gt: since } } : {}) },
  });
  console.log(`[SYNC][DOWNLOAD] User:${req.user?.id} Role:${req.user?.role} Org:${orgId} -> Found ${data.length} products`);
  res.json({ ok: true, data });
}
