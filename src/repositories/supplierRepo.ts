// src/repositories/supplierRepo.ts
import { runExecute, runQuery } from "../db/db";

const trimOrNull = (v?: string | null) =>
  v && v.trim().length > 0 ? v.trim() : null;

/** Tedarikçi ekle (aynı kullanıcıda aynı isim benzersiz) */
export async function addSupplier(
  input: {
    name: string;
    phone?: string;
    email?: string;
    address?: string;
    note?: string;
  },
  ownerUserId: number
) {
  const name = input.name?.trim() ?? "";
  if (!name) throw new Error("Tedarikçi adı zorunludur.");

  // per-owner çakışma kontrolü
  const dup = await runQuery<{ id: number }>(
    `SELECT id FROM suppliers WHERE name = ? AND ownerUserId = ? LIMIT 1`,
    [name, ownerUserId]
  );
  if (dup.length > 0) {
    throw new Error("Bu tedarikçi zaten ekli.");
  }

  await runExecute(
    `INSERT INTO suppliers
      (name, phone, email, address, note, ownerUserId, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
    [
      name,
      trimOrNull(input.phone),
      trimOrNull(input.email),
      trimOrNull(input.address),
      trimOrNull(input.note),
      ownerUserId,
    ]
  );
}

/** Tedarikçi listesi (aktif kullanıcı) */
export async function listSuppliers(ownerUserId: number) {
  return runQuery<any>(
    `SELECT * FROM suppliers WHERE ownerUserId = ? ORDER BY name ASC`,
    [ownerUserId]
  );
}

/** Tedarikçi güncelle */
export async function updateSupplier(
  id: number,
  patch: {
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
    note?: string;
  },
  ownerUserId: number
) {
  // İsim değişiyorsa per-owner benzersizliğini koru
  if (patch.name && patch.name.trim()) {
    const dup = await runQuery<{ id: number }>(
      `SELECT id FROM suppliers WHERE name = ? AND ownerUserId = ? AND id <> ? LIMIT 1`,
      [patch.name.trim(), ownerUserId, id]
    );
    if (dup.length > 0) throw new Error("Bu tedarikçi adı zaten kullanılıyor.");
  }

  await runExecute(
    `UPDATE suppliers SET
       name = COALESCE(?, name),
       phone = ?,
       email = ?,
       address = ?,
       note = ?,
       updatedAt = datetime('now')
     WHERE id = ? AND ownerUserId = ?`,
    [
      patch.name?.trim() ?? null,
      trimOrNull(patch.phone),
      trimOrNull(patch.email),
      trimOrNull(patch.address),
      trimOrNull(patch.note),
      id,
      ownerUserId,
    ]
  );
}

/** Tedarikçi sil */
export async function deleteSupplier(id: number, ownerUserId: number) {
  await runExecute(
    `DELETE FROM suppliers WHERE id = ? AND ownerUserId = ?`,
    [id, ownerUserId]
  );
}
