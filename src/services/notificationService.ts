import { runQuery } from "../db/db";
import { addNotification } from "../repositories/notificationsRepo";

// Low stock and expiry checks per user
export async function checkInventoryAlerts(ownerUserId: number) {
  const lowStockItems = await runQuery<{
    sku: string;
    name: string;
    quantity: number;
    minStock: number;
  }>(
    `SELECT sku, name, quantity, minStock FROM products WHERE quantity <= minStock AND ownerUserId = ?`,
    [ownerUserId]
  );

  for (const item of lowStockItems) {
    await addNotification(
      item.sku,
      "LOW_STOCK",
      `${item.name} (${item.sku}) stok yetersiz (${item.quantity}/${item.minStock})`,
      ownerUserId
    );
  }

  const expiryItems = await runQuery<{
    sku: string;
    name: string;
    expiryDate: string;
  }>(
    `SELECT sku, name, expiryDate FROM products WHERE expiryDate IS NOT NULL AND ownerUserId = ?`,
    [ownerUserId]
  );

  const now = new Date();
  for (const item of expiryItems) {
    const expiry = new Date(item.expiryDate);
    const diffDays = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 3600 * 24));
    
    // Check if expired
    if (diffDays < 0) {
      await addNotification(
        item.sku,
        "EXPIRED",
        `${item.name} (${item.sku}) son kullanma tarihi geçmiş: ${item.expiryDate}`,
        ownerUserId
      );
    }
    // Check if expiring within 30 days
    else if (diffDays <= 30) {
      await addNotification(
        item.sku,
        "EXPIRY",
        `${item.name} (${item.sku}) son kullanma tarihi ${item.expiryDate} (${diffDays} gün kaldı)`,
        ownerUserId
      );
    }
  }
}
