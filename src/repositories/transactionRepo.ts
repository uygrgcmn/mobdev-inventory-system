import { runExecute, runQuery } from "../db/db";

// Yeni stok hareketi ekle ve ürün miktarını güncelle
export async function addTransaction(
  sku: string,
  change: number,
  reason: string,
  userId: string = "system"
) {
  // Ürün mevcut mu kontrol et
  const [product] = await runQuery<{ quantity: number }>(
    `SELECT quantity FROM products WHERE sku = ? LIMIT 1`,
    [sku]
  );

  if (!product) throw new Error("Ürün bulunamadı.");
  const newQty = product.quantity + change;
  if (newQty < 0) throw new Error("Stok eksiye düşemez!");

  // Transaction kaydı
  await runExecute(
    `INSERT INTO stock_transactions (sku, change, reason, userId) VALUES (?, ?, ?, ?)`,
    [sku, change, reason, userId]
  );

  // Ürün miktarını güncelle
  await runExecute(
    `UPDATE products SET quantity = ?, updatedAt = datetime('now') WHERE sku = ?`,
    [newQty, sku]
  );
}

// Belirli ürünün hareket geçmişi
export async function getTransactions(sku: string) {
  return runQuery<{
    id: number;
    sku: string;
    change: number;
    reason: string;
    userId: string;
    createdAt: string;
  }>(
    `SELECT * FROM stock_transactions WHERE sku = ? ORDER BY createdAt DESC`,
    [sku]
  );
}
