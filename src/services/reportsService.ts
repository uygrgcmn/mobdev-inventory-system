import { runQuery } from "../db/db";

export async function getInventoryReport(ownerUserId: number) {
  return runQuery<{
    sku: string; name: string; quantity: number; unitPrice: number; expiryDate: string | null; minStock: number;
  }>(
    `SELECT sku, name, quantity, unitPrice, expiryDate, minStock
     FROM products
     WHERE ownerUserId = ?
     ORDER BY name ASC`,
    [ownerUserId]
  );
}

export async function getMovementHistory(ownerUserId: number) {
  return runQuery<{ sku: string; change: number; reason: string; userId: string; createdAt: string }>(
    `SELECT sku, change, reason, userId, createdAt
     FROM stock_transactions
     WHERE ownerUserId = ?
     ORDER BY createdAt DESC`,
    [ownerUserId]
  );
}

export async function getExpirationAlerts(ownerUserId: number) {
  return runQuery<{ sku: string; name: string; expiryDate: string }>(
    `SELECT sku, name, expiryDate
     FROM products
     WHERE ownerUserId = ? AND expiryDate IS NOT NULL`,
    [ownerUserId]
  );
}

export async function getValuationTotal(ownerUserId: number) {
  const r = await runQuery<{ total: number }>(
    `SELECT SUM(quantity * unitPrice) as total
     FROM products
     WHERE ownerUserId = ?`,
    [ownerUserId]
  );
  return r[0]?.total ?? 0;
}
