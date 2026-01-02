// src/repositories/stockRepo.ts
import { runExecute } from "../db/db";

/**
 * Stok değişimi: change (+ giriş, - çıkış)
 * - stock_transactions'a yazar
 * - products.quantity ve products.updatedAt'i günceller
 */
export async function applyStockChange(params: {
  sku: string;
  change: number;
  reason: string;
  actorUserId?: string;
  ownerUserId: number;
}) {
  const { sku, change, reason, actorUserId, ownerUserId } = params;

  // hareket kaydı
  await runExecute(
    `INSERT INTO stock_transactions (sku, change, reason, userId, ownerUserId, createdAt)
     VALUES (?, ?, ?, ?, ?, datetime('now'))`,
    [sku, change, reason, actorUserId ?? null, ownerUserId]
  );

  // ürün güncelle
  await runExecute(
    `UPDATE products
     SET quantity = quantity + ?, updatedAt = datetime('now')
     WHERE sku = ? AND ownerUserId = ?`,
    [change, sku, ownerUserId]
  );
}


