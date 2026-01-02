import { runQuery } from "../db/db";
import { addNotification } from "../repositories/notificationsRepo";

export async function checkAndInsertNotifications(ownerUserId: number) {
  // 1) Low stock
  const lowStock = await runQuery<{ sku: string; name: string; quantity: number; minStock: number }>(
    `SELECT sku, name, quantity, minStock
     FROM products
     WHERE ownerUserId = ? AND quantity <= minStock`,
    [ownerUserId]
  );
  for (const p of lowStock) {
    const msg = `${p.name} (${p.sku}) stok yetersiz (${p.quantity}/${p.minStock})`;
    await addNotification(p.sku, "LOW_STOCK", msg, ownerUserId);
  }

  // 2) Expiry ≤ 30 gün
  const expiryRows = await runQuery<{ sku: string; name: string; expiryDate: string | null }>(
    `SELECT sku, name, expiryDate
     FROM products
     WHERE ownerUserId = ? AND expiryDate IS NOT NULL`,
    [ownerUserId]
  );
  const now = new Date();
  for (const p of expiryRows) {
    if (!p.expiryDate) continue;
    const diffDays = Math.floor((+new Date(p.expiryDate) - +now) / (1000 * 60 * 60 * 24));
    if (diffDays >= 0 && diffDays <= 30) {
      const msg = `${p.name} (${p.sku}) SKT ${p.expiryDate} (${diffDays} gün kaldı)`;
      await addNotification(p.sku, "EXPIRY", msg, ownerUserId);
    }
  }
}
