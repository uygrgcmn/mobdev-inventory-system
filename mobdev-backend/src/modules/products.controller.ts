import { Response } from "express";
import { prisma } from "../db";
import { AuthedReq } from "../auth/auth.middleware";
import { z } from "zod";

const createSchema = z
  .object({
    sku: z.string().min(1),
    name: z.string().min(1),
    categoryId: z.number().int().positive().optional(),
    category: z.string().min(1).optional(),
    quantity: z.coerce.number().int().min(0),
    unitPrice: z.coerce.number().min(0),
    supplierId: z.number().int().positive().optional(),
    supplierName: z.string().min(1).optional(),
    expiryDate: z.string().min(1),
    barcode: z.string().optional(),
    minStock: z.coerce.number().int().min(0).optional(),
  })
  .refine((d) => d.categoryId || d.category, { message: "Category required" })
  .refine((d) => d.supplierId || d.supplierName, { message: "Supplier required" });

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  categoryId: z.number().int().positive().optional(),
  category: z.string().min(1).optional(),
  quantity: z.coerce.number().int().min(0).optional(),
  unitPrice: z.coerce.number().min(0).optional(),
  supplierId: z.number().int().positive().optional(),
  supplierName: z.string().min(1).optional(),
  expiryDate: z.string().min(1).optional(),
  barcode: z.string().optional(),
  minStock: z.coerce.number().int().min(0).optional(),
});

export async function listProducts(req: AuthedReq, res: Response) {
  const uid = req.user!.id;
  const data = await prisma.product.findMany({ where: { ownerUserId: uid }, orderBy: { createdAt: "desc" } });
  res.json({ ok:true, data });
}

export async function createProduct(req: AuthedReq, res: Response) {
  const uid = req.user!.id;
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Invalid body";
    return res.status(400).json({ ok: false, message: msg });
  }
  const body = parsed.data;

  // Category resolve (id veya isimden)
  let categoryId = body.categoryId;
  let categoryName = body.category?.trim();
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

  // Supplier resolve (id veya isimden)
  let supplierId = body.supplierId;
  let supplierName = body.supplierName?.trim();
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

  const data = await prisma.product.create({
    data: {
      sku: body.sku,
      name: body.name,
      category: categoryName,
      quantity: body.quantity,
      unitPrice: body.unitPrice,
      supplierName,
      expiryDate: body.expiryDate,
      barcode: body.barcode,
      minStock: body.minStock ?? 0,
      ownerUserId: uid,
      categoryId,
      supplierId,
    },
  });
  res.json({ ok: true, data });
}

export async function updateProduct(req: AuthedReq, res: Response) {
  const uid = req.user!.id;
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ ok: false, message: "Invalid id" });

  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Invalid body";
    return res.status(400).json({ ok: false, message: msg });
  }
  const body = parsed.data;

  const existing = await prisma.product.findFirst({
    where: { id, ownerUserId: uid },
  });
  if (!existing) return res.status(404).json({ ok: false, message: "Product not found" });

  // resolve category if provided
  let categoryId = existing.categoryId;
  let categoryName = existing.category;
  if (body.categoryId || body.category) {
    if (body.categoryId) {
      const cat = await prisma.category.findFirst({ where: { id: body.categoryId, ownerUserId: uid } });
      if (!cat) return res.status(400).json({ ok: false, message: "Category not found" });
      categoryId = cat.id;
      categoryName = cat.name;
    } else if (body.category) {
      const cat = await prisma.category.upsert({
        where: { name_ownerUserId: { name: body.category.trim(), ownerUserId: uid } },
        update: {},
        create: { name: body.category.trim(), ownerUserId: uid },
      });
      categoryId = cat.id;
      categoryName = cat.name;
    }
  }

  // resolve supplier if provided
  let supplierId = existing.supplierId;
  let supplierName = existing.supplierName ?? undefined;
  if (body.supplierId || body.supplierName) {
    if (body.supplierId) {
      const sup = await prisma.supplier.findFirst({ where: { id: body.supplierId, ownerUserId: uid } });
      if (!sup) return res.status(400).json({ ok: false, message: "Supplier not found" });
      supplierId = sup.id;
      supplierName = sup.name;
    } else if (body.supplierName) {
      const sup = await prisma.supplier.upsert({
        where: { name_ownerUserId: { name: body.supplierName.trim(), ownerUserId: uid } },
        update: {},
        create: { name: body.supplierName.trim(), ownerUserId: uid },
      });
      supplierId = sup.id;
      supplierName = sup.name;
    }
  }

  const updateData = {
    name: body.name ?? existing.name,
    category: categoryName,
    categoryId,
    quantity: body.quantity ?? existing.quantity,
    unitPrice: body.unitPrice ?? existing.unitPrice,
    supplierName: supplierName ?? existing.supplierName,
    supplierId,
    expiryDate: body.expiryDate ?? existing.expiryDate,
    barcode: body.barcode ?? existing.barcode,
    minStock: body.minStock ?? existing.minStock,
  };

  const data = await prisma.product.update({
    where: { id },
    data: updateData,
  });
  res.json({ ok: true, data });
}

export async function deleteProduct(req: AuthedReq, res: Response) {
  const uid = req.user!.id;
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ ok: false, message: "Invalid id" });

  const existing = await prisma.product.findFirst({ where: { id, ownerUserId: uid } });
  if (!existing) return res.status(404).json({ ok: false, message: "Product not found" });

  await prisma.product.delete({ where: { id } });
  res.json({ ok: true });
}
