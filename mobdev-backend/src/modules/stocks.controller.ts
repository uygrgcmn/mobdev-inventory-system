import { Response } from "express";
import { AuthedReq } from "../auth/auth.middleware";
import { prisma } from "../db";

export async function listStockTransactions(req: AuthedReq, res: Response) {
  const orgId = req.user!.organizationId;
  const data = await prisma.stockTransaction.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: "desc" },
  });
  res.json({ ok: true, data });
}

export async function createStockTransaction(req: AuthedReq, res: Response) {
  try {
    const uid = req.user!.id; // Who is performing the action
    const orgId = req.user!.organizationId; // Which org owns the data
    const { sku, change, reason } = req.body;

    if (!sku || typeof change !== "number") {
      return res.status(400).json({ ok: false, message: "SKU ve change gerekli" });
    }

    // Ürünün var olduğunu kontrol et
    const product = await prisma.product.findFirst({
      where: { sku, organizationId: orgId },
    });

    if (!product) {
      return res.status(404).json({ ok: false, message: "Ürün bulunamadı" });
    }

    // Yeni miktarı hesapla
    const newQuantity = product.quantity + change;
    if (newQuantity < 0) {
      return res.status(400).json({ ok: false, message: "Stok negatif olamaz" });
    }

    // Stok işlemini kaydet
    const transaction = await prisma.stockTransaction.create({
      data: {
        sku,
        change,
        reason: reason || "ADJUST",
        userId: uid,
        organizationId: orgId,
      },
    });

    // Ürün miktarını güncelle
    await prisma.product.update({
      where: { id: product.id },
      data: { quantity: newQuantity },
    });

    res.json({ ok: true, data: transaction });
  } catch (error: any) {
    console.error("[CREATE_STOCK_TRANSACTION]", error);
    res.status(500).json({ ok: false, message: error?.message || "Stok işlemi kaydedilemedi" });
  }
}