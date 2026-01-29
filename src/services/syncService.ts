// src/services/syncService.ts
import { apiFetch } from "./api";
import { runExecute, runQuery } from "../db/db";

/* --------------------------- lastSync yardımcıları --------------------------- */

async function getLastSync(): Promise<string | null> {
  const r = await runQuery<{ lastSync: string | null }>(
    `SELECT lastSync FROM sync_info WHERE id = 1`
  );
  return r[0]?.lastSync ?? null;
}

async function setLastSync(iso: string) {
  await runExecute(`UPDATE sync_info SET lastSync = ? WHERE id = 1`, [iso]);
}

/** Yerelde değişen ürünleri sunucuya yükle */
export async function uploadChangesServer(ownerUserId: number) {
  // CLOCK SKEW FIX:
  // Do NOT filter by 'since' (lastSync).
  // LastSync comes from Server time. If Phone time is behind Server time,
  // new records will look "older" than lastSync and be skipped.
  // ALWAYS upload all local records. Since we wipe DB on logout,
  // the volume is small (only session changes + viewed data).

  // const since = await getLastSync(); 

  // Defensive: Only upload items belonging to this user
  const params: any[] = [ownerUserId];
  const where = `WHERE ownerUserId = ?`;
  // if (since) { where += ... } <-- REMOVED

  const changed = await runQuery<any>(`SELECT * FROM products ${where}`, params);
  if (changed.length === 0) return;

  await apiFetch(`/sync/upload`, {
    method: "POST",
    body: JSON.stringify(changed),
  });
}


/** Sunucudaki yeni/değişen ürünleri indir ve yerelde upsert et */
export async function downloadChangesServer() {
  const since = await getLastSync();
  const q = since ? `/sync/download?since=${encodeURIComponent(since)}` : `/sync/download`;
  const res = await apiFetch(q);
  const items: any[] = res.data ?? [];

  for (const it of items) {
    // Conflict Handling:
    // If incoming product has barcode 'B' and id '2', but we have a DIFFERENT local product with barcode 'B' (e.g. id '100'),
    // SQLite will throw UNIQUE constraint error on barcode.
    // Solution: "Server Wins". If we find a barcode/sku collision on a DIFFERENT ID, delete the local one first.

    if (it.barcode) {
      await runExecute(
        `DELETE FROM products WHERE barcode = ? AND ownerUserId = ? AND id != ?`,
        [it.barcode, it.ownerUserId, it.id ?? -1]
      );
    }
    if (it.sku) {
      await runExecute(
        `DELETE FROM products WHERE sku = ? AND ownerUserId = ? AND id != ?`,
        [it.sku, it.ownerUserId, it.id ?? -1]
      );
    }

    console.log(`[SYNC][CLIENT] Inserting product ${it.sku} (ID: ${it.id})...`);
    try {
      await runExecute(
        `INSERT INTO products
          (id, sku, name, category, quantity, unitPrice, supplierName, expiryDate, barcode, minStock, createdAt, updatedAt, ownerUserId)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           name=excluded.name,
           category=excluded.category,
           quantity=excluded.quantity,
           unitPrice=excluded.unitPrice,
           supplierName=excluded.supplierName,
           expiryDate=excluded.expiryDate,
           barcode=excluded.barcode,
           minStock=excluded.minStock,
           createdAt=excluded.createdAt,
           updatedAt=excluded.updatedAt,
           ownerUserId=excluded.ownerUserId,
           sku=excluded.sku 
         WHERE excluded.updatedAt > products.updatedAt`,
        [
          it.id ?? null,
          it.sku,
          it.name,
          it.category ?? null,
          it.quantity ?? 0,
          it.unitPrice ?? 0,
          it.supplierName ?? null,
          it.expiryDate ?? null,
          it.barcode ?? null,
          it.minStock ?? 5,
          it.createdAt ?? new Date().toISOString(),
          it.updatedAt ?? new Date().toISOString(),
          it.ownerUserId,
        ]
      );
      console.log(`[SYNC][CLIENT] Insert success.`);
    } catch (e) {
      console.error(`[SYNC][CLIENT] Insert failed for ${it.sku}:`, e);
    }
  }
}

/* --------------------------- TEDARİKÇİLER (SUPPLIERS) --------------------------- */

/** Yerelde değişen tedarikçileri sunucuya yükle (name+ownerUserId benzersiz) */
/** Yerelde değişen tedarikçileri sunucuya yükle (name+ownerUserId benzersiz) */
export async function uploadSuppliersServer(ownerUserId: number) {
  // CLOCK SKEW FIX: Always upload all suppliers.

  const params: any[] = [ownerUserId];
  const where = `WHERE ownerUserId = ?`;

  const changed = await runQuery<any>(`SELECT * FROM suppliers ${where}`, params);
  if (changed.length === 0) return;

  await apiFetch(`/suppliers/bulkUpsert`, {
    method: "POST",
    body: JSON.stringify(changed),
  });
}

/** Sunucudaki yeni/değişen tedarikçileri indir ve yerelde upsert et */
export async function downloadSuppliersServer() {
  const since = await getLastSync();
  const q = since ? `/suppliers/delta?since=${encodeURIComponent(since)}` : `/suppliers/delta`;
  const res = await apiFetch(q);
  const items: any[] = res.data ?? [];

  // Yerelde name UNIQUE, ownerUserId ile kompozit unique kullanıyorsan ON CONFLICT(name,ownerUserId) yaz
  for (const it of items) {
    await runExecute(
      `INSERT INTO suppliers
        (id, name, phone, email, address, note, ownerUserId, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         name=excluded.name,
         phone=excluded.phone,
         email=excluded.email,
         address=excluded.address,
         note=excluded.note,
         ownerUserId=excluded.ownerUserId,
         createdAt=excluded.createdAt,
         updatedAt=excluded.updatedAt
       WHERE excluded.updatedAt > suppliers.updatedAt`,
      [
        it.id,
        it.name,
        it.phone ?? null,
        it.email ?? null,
        it.address ?? null,
        it.note ?? null,
        it.ownerUserId,
        it.createdAt ?? new Date().toISOString(),
        it.updatedAt ?? new Date().toISOString(),
      ]
    );
  }
}

/* --------------------------- TOPLU (TAM) SENKRON --------------------------- */

/** Tek fonksiyonda ürün + tedarikçi iki yönlü senkron, ardından lastSync güncelle */
export async function syncAllServer(ownerUserId: number) {
  // Ürünler (lokal → sunucu → lokal)
  await uploadChangesServer(ownerUserId);
  await downloadChangesServer();

  // Tedarikçiler (lokal → sunucu → lokal)
  await uploadSuppliersServer(ownerUserId);
  await downloadSuppliersServer();

  // Başarılı indirmelerin sonunda lastSync'i şimdiye çek
  await setLastSync(new Date().toISOString());
}
