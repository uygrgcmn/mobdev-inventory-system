import { runExecute, runQuery } from "../db/db";

const nullIfEmpty = (v?: string | null) =>
  v && v.trim().length > 0 ? v.trim() : null;

const intOr = (v: any, d = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : d;
};

const numOr = (v: any, d = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

/** Yeni ürün ekleme (SKU aynı kullanıcıda benzersiz) */
export async function addProduct(
  input: {
    sku: string;
    name: string;
    category?: string;
    quantity?: number | string;
    unitPrice?: number | string;
    supplierName?: string;
    expiryDate?: string;
    barcode?: string;
    minStock?: number | string;
  },
  ownerUserId: number
) {
  // SKU çakışma kontrolü (aynı kullanıcı)
  const dup = await runQuery<{ id: number }>(
    `SELECT id FROM products WHERE sku = ? AND ownerUserId = ? LIMIT 1`,
    [input.sku.trim(), ownerUserId]
  );
  if (dup.length > 0) {
    throw new Error("Bu SKU zaten mevcut. Lütfen farklı bir SKU girin.");
  }

  await runExecute(
    `INSERT INTO products
      (sku, name, category, quantity, unitPrice, supplierName, expiryDate, barcode, minStock, ownerUserId, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
    [
      input.sku.trim(),
      input.name.trim(),
      nullIfEmpty(input.category),
      intOr(input.quantity, 0),
      numOr(input.unitPrice, 0),
      nullIfEmpty(input.supplierName),
      nullIfEmpty(input.expiryDate),
      nullIfEmpty(input.barcode),
      intOr(input.minStock, 5),
      ownerUserId,
    ]
  );
}

/** Ürün güncelle */
export async function updateProduct(
  id: number,
  patch: {
    name?: string;
    category?: string;
    quantity?: number | string;
    unitPrice?: number | string;
    supplierName?: string;
    expiryDate?: string;
    barcode?: string;
    minStock?: number | string;
  },
  ownerUserId: number
) {
  await runExecute(
    `UPDATE products SET
       name = COALESCE(?, name),
       category = ?,
       quantity = COALESCE(?, quantity),
       unitPrice = COALESCE(?, unitPrice),
       supplierName = ?,
       expiryDate = ?,
       barcode = ?,
       minStock = COALESCE(?, minStock),
       updatedAt = datetime('now')
     WHERE id = ? AND ownerUserId = ?`,
    [
      patch.name?.trim() ?? null,
      nullIfEmpty(patch.category),
      patch.quantity !== undefined ? intOr(patch.quantity, 0) : null,
      patch.unitPrice !== undefined ? numOr(patch.unitPrice, 0) : null,
      nullIfEmpty(patch.supplierName),
      nullIfEmpty(patch.expiryDate),
      nullIfEmpty(patch.barcode),
      patch.minStock !== undefined ? intOr(patch.minStock, 5) : null,
      id,
      ownerUserId,
    ]
  );
}

/** Listele */
export async function listProducts(ownerUserId: number) {
  return runQuery<any>(
    `SELECT * FROM products WHERE ownerUserId = ? ORDER BY createdAt DESC`,
    [ownerUserId]
  );
}

/** Sil */
export async function deleteProduct(id: number, ownerUserId: number) {
  await runExecute(`DELETE FROM products WHERE id = ? AND ownerUserId = ?`, [
    id,
    ownerUserId,
  ]);
}

/** Barkoda göre ürünü bul (aynı kullanıcı) */
export async function findProductByBarcode(barcode: string, ownerUserId: number) {
  const rows = await runQuery<any>(
    `SELECT * FROM products WHERE barcode = ? AND ownerUserId = ? LIMIT 1`,
    [barcode, ownerUserId]
  );
  return rows[0] ?? null;
}

/** Stok değiştir (+/-) ve hareket kaydı oluştur */
export async function changeStockById(
  productId: number,
  delta: number,
  ownerUserId: number,
  reason = "scan-adjust"
) {
  await runExecute(
    `UPDATE products
       SET quantity = quantity + ?, updatedAt = datetime('now')
     WHERE id = ? AND ownerUserId = ?`,
    [delta, productId, ownerUserId]
  );

  await runExecute(
    `INSERT INTO stock_transactions (sku, change, reason, userId, createdAt, ownerUserId)
     SELECT sku, ?, ?, ?, datetime('now'), ?
     FROM products WHERE id = ? AND ownerUserId = ?`,
    [delta, reason, String(ownerUserId), ownerUserId, productId, ownerUserId]
  );
}
