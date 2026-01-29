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
  // SKU çakışma kontrolü (Organizasyon genelinde benzersiz olmalı, ama yerelde sadece SKU'ya bakmak yeterli çünkü yerel DB = Organizasyon DB)
  const dup = await runQuery<{ id: number }>(
    `SELECT id FROM products WHERE sku = ? LIMIT 1`,
    [input.sku.trim()]
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
  // Update herhangi bir kullanıcı tarafından yapılabilir (yetki varsa)
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
     WHERE id = ?`,
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
    ]
  );
}

/** Listele (Organization-wide: show all local products) */
export async function listProducts(ownerUserId: number) {
  // We ignore ownerUserId here because local DB contains only org data (cleared on logout)
  const rows = await runQuery<any>(
    `SELECT * FROM products ORDER BY createdAt DESC`
  );
  console.log(`[REPO] listProducts returned ${rows.length} items`);
  return rows;
}

/** Sil */
/** Sil */
export async function deleteProduct(id: number, ownerUserId: number) {
  // Allow deleting any product present locally (ACL controls access to this function)
  await runExecute(`DELETE FROM products WHERE id = ?`, [id]);
}

/** Barkoda göre ürünü bul (aynı kullanıcı) */
// Barkodla arama: Organizasyondaki HERHANGİ bir ürünü bulmalı (filtre yok)
export async function findProductByBarcode(barcode: string, ownerUserId: number) {
  const rows = await runQuery<any>(
    `SELECT * FROM products WHERE barcode = ? LIMIT 1`,
    [barcode]
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
  // Sadece ürün ID ile güncelle (Owner filtreleme)
  await runExecute(
    `UPDATE products
       SET quantity = quantity + ?, updatedAt = datetime('now')
     WHERE id = ?`,
    [delta, productId]
  );

  // Transaction kaydını oluşturan kişi (ownerUserId) şu anki kullanıcıdır
  await runExecute(
    `INSERT INTO stock_transactions (sku, change, reason, userId, createdAt, ownerUserId)
     SELECT sku, ?, ?, ?, datetime('now'), ?
     FROM products WHERE id = ?`,
    [delta, reason, String(ownerUserId), ownerUserId, productId]
  );
}
