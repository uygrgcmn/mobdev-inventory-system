// src/db/db.ts
import * as SQLite from "expo-sqlite";

/** SQL parametreleri */
export type SQLParams = (string | number | null | undefined)[];

/** Tekil DB bağlantısı (Expo SQLite v16+) */
const db: SQLite.SQLiteDatabase = SQLite.openDatabaseSync("mobdev.db");

/** Açılışta çağır: temel PRAGMA vb. */
export async function initDB() {
  try {
    await db.execAsync("PRAGMA journal_mode = WAL;");
  } catch (e: any) {
    console.warn("[DB][init] PRAGMA failed:", e?.message ?? e);
  }
}

/** Geliştirmede SQL’i görmek için true bırak; gerekirse false yap */
const DEBUG_SQL = true;

/** undefined → null (SQLite undefined kabul etmez) */
const sanitize = (params: SQLParams = []) =>
  params.map((v) => (v === undefined ? null : v));

/** SELECT sorguları */
export async function runQuery<T = any>(
  sql: string,
  params: SQLParams = []
): Promise<T[]> {
  const p = sanitize(params);
  try {
    if (DEBUG_SQL) console.log("[SQL][Q]", sql, "\n[PARAMS]", JSON.stringify(p));
    const result = await db.getAllAsync<T>(sql, p);
    return result;
  } catch (err: any) {
    console.error("[SQL][Q][ERROR]", err?.message || err, "\nSQL:", sql, "\nPARAMS:", p);
    throw err;
  }
}

/** INSERT/UPDATE/DELETE sorguları */
export async function runExecute(
  sql: string,
  params: SQLParams = []
): Promise<void> {
  const p = sanitize(params);
  try {
    if (DEBUG_SQL) console.log("[SQL][X]", sql, "\n[PARAMS]", JSON.stringify(p));
    await db.runAsync(sql, p);
  } catch (err: any) {
    console.error("[SQL][X][ERROR]", err?.message || err, "\nSQL:", sql, "\nPARAMS:", p);
    throw err;
  }
}

/** Gerekirse ham db nesnesi */
export function getDB() {
  return db;
}
