// src/db/migrations.ts
import { runExecute, runQuery } from "./db";

/* --------------------------------------------------------- */
/* Helpers                                                   */
/* --------------------------------------------------------- */
async function columnExists(table: string, column: string): Promise<boolean> {
  const rows = await runQuery<{ name: string }>(`PRAGMA table_info(${table})`);
  return rows.some((r) => r.name === column);
}

async function addColumnIfMissing(
  table: string,
  definitionSQL: string,
  columnName: string
) {
  if (await columnExists(table, columnName)) return;
  await runExecute(`ALTER TABLE ${table} ADD COLUMN ${definitionSQL}`);
}

async function uniqueIndexExists(table: string, columns: string[]): Promise<boolean> {
  const indexes = await runQuery<{ name: string; unique: number }>(
    `PRAGMA index_list(${table})`
  );

  const uniqueIndexes = indexes.filter((idx) => idx.unique === 1);
  for (const idx of uniqueIndexes) {
    const info = await runQuery<{ name: string; seqno: number }>(
      `PRAGMA index_info(${idx.name})`
    );
    const cols = info.sort((a, b) => a.seqno - b.seqno).map((i) => i.name);
    if (
      cols.length === columns.length &&
      cols.every((c, i) => c === columns[i])
    ) {
      return true;
    }
  }
  return false;
}

/* --------------------------------------------------------- */
/* Suppliers (base table)                                    */
/* --------------------------------------------------------- */
export async function ensureSuppliers() {
  await runExecute(`
    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,   -- eski şemalarda UNIQUE olabilir; aşağıda rebuild ile düzeltiyoruz
      phone TEXT,
      email TEXT,
      address TEXT,
      note TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  await runExecute(
    `CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name);`
  );
}

/* --------------------------------------------------------- */
/* PRODUCTS: tabloyu yoksa oluştur                           */
/* --------------------------------------------------------- */
async function ensureProductsTable() {
  await runExecute(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sku TEXT NOT NULL,
      name TEXT NOT NULL,
      category TEXT,
      quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
      unitPrice REAL NOT NULL DEFAULT 0 CHECK (unitPrice >= 0),
      supplierName TEXT,
      expiryDate TEXT,
      barcode TEXT,
      minStock INTEGER NOT NULL DEFAULT 5,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
      ownerUserId INTEGER
    );
  `);
  await runExecute(`CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);`);
  await runExecute(`CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);`);
  await runExecute(`CREATE INDEX IF NOT EXISTS idx_products_owner ON products(ownerUserId);`);
  await runExecute(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_products_sku_owner
    ON products(sku, ownerUserId);
  `);
}

/* --------------------------------------------------------- */
/* STOCK TRANSACTIONS: tablo yoksa oluştur                    */
/* --------------------------------------------------------- */
async function ensureStockTransactionsTable() {
  await runExecute(`
    CREATE TABLE IF NOT EXISTS stock_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sku TEXT,
      change INTEGER,
      reason TEXT,
      userId TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      ownerUserId INTEGER
    );
  `);
  await runExecute(
    `CREATE INDEX IF NOT EXISTS idx_st_owner ON stock_transactions(ownerUserId);`
  );
}

/* --------------------------------------------------------- */
/* NOTIFICATIONS: tablo yoksa oluştur                        */
/* --------------------------------------------------------- */
async function ensureNotificationsTable() {
  await runExecute(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sku TEXT,
      type TEXT NOT NULL,
      message TEXT NOT NULL,
      resolved INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      ownerUserId INTEGER
    );
  `);
  await runExecute(
    `CREATE INDEX IF NOT EXISTS idx_notifications_owner ON notifications(ownerUserId);`
  );
}

/* --------------------------------------------------------- */
/* PRODUCTS: ownerUserId onarımı (ALTER veya rebuild)        */
/* --------------------------------------------------------- */
async function rebuildProductsTable(hasOwnerUserId: boolean) {
  await runExecute(`BEGIN TRANSACTION`);
  try {
    await runExecute(`ALTER TABLE products RENAME TO _products_old`);

    await runExecute(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sku TEXT NOT NULL,
        name TEXT NOT NULL,
        category TEXT,
        quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
        unitPrice REAL NOT NULL DEFAULT 0 CHECK (unitPrice >= 0),
        supplierName TEXT,
        expiryDate TEXT,
        barcode TEXT,
        minStock INTEGER NOT NULL DEFAULT 5,
        createdAt TEXT NOT NULL DEFAULT (datetime('now')),
        updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
        ownerUserId INTEGER
      );
    `);

    await runExecute(`
      INSERT INTO products
        (id, sku, name, category, quantity, unitPrice, supplierName, expiryDate, barcode, minStock, createdAt, updatedAt, ownerUserId)
      SELECT
        id, sku, name, category, quantity, unitPrice, supplierName, expiryDate, barcode, minStock, createdAt, updatedAt,
        ${hasOwnerUserId ? "ownerUserId" : "NULL"}
      FROM _products_old;
    `);

    await runExecute(`DROP TABLE _products_old`);

    await runExecute(
      `CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);`
    );
    await runExecute(
      `CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);`
    );
    await runExecute(
      `CREATE INDEX IF NOT EXISTS idx_products_owner ON products(ownerUserId);`
    );
    await runExecute(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_products_sku_owner
      ON products(sku, ownerUserId);
    `);
    await runExecute(`COMMIT`);
  } catch (e) {
    await runExecute(`ROLLBACK`);
    throw e;
  }
}

async function ensureProductsOwnerUserId() {
  const hasOwnerCol = await columnExists("products", "ownerUserId");
  if (!hasOwnerCol) {
    try {
      await runExecute(`ALTER TABLE products ADD COLUMN ownerUserId INTEGER`);
    } catch {
      console.warn(
        "[MIGRATION] ALTER TABLE failed; rebuilding 'products' with ownerUserId..."
      );
      await rebuildProductsTable(false);
      return;
    }
  }
}

async function ensureProductsUniquePerOwner() {
  const hasComposite = await uniqueIndexExists("products", ["sku", "ownerUserId"]);
  if (hasComposite) return;
  await rebuildProductsTable(true);
}

/* --------------------------------------------------------- */
/* SUPPLIERS: updatedAt ekleme (ALTER'da DEFAULT yok)        */
/* --------------------------------------------------------- */
async function ensureSuppliersUpdatedAt() {
  const has = await columnExists("suppliers", "updatedAt");
  if (!has) {
    await runExecute(`ALTER TABLE suppliers ADD COLUMN updatedAt TEXT`);
    await runExecute(
      `UPDATE suppliers SET updatedAt = datetime('now') WHERE updatedAt IS NULL`
    );
  }
  await runExecute(
    `CREATE INDEX IF NOT EXISTS idx_suppliers_updated ON suppliers(updatedAt);`
  );
}

/* --------------------------------------------------------- */
/* SUPPLIERS: per-owner UNIQUE'e taşı (rebuild)              */
/*  - Global UNIQUE(name) yerine UNIQUE(name, ownerUserId)   */
/* --------------------------------------------------------- */
async function ensureSuppliersUniquePerOwner() {
  if (await uniqueIndexExists("suppliers", ["name", "ownerUserId"])) return;
  await runExecute(`BEGIN TRANSACTION`);
  try {
    // Eski tabloyu taşı
    await runExecute(`ALTER TABLE suppliers RENAME TO _suppliers_old`);

    // Yeni tablo: name üzerinde GLOBAL UNIQUE YOK!
    await runExecute(`
      CREATE TABLE IF NOT EXISTS suppliers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        address TEXT,
        note TEXT,
        createdAt TEXT NOT NULL DEFAULT (datetime('now')),
        updatedAt TEXT,
        ownerUserId INTEGER
      );
    `);

    // Verileri taşı (updatedAt null ise doldur)
    await runExecute(`
      INSERT INTO suppliers
        (id, name, phone, email, address, note, createdAt, updatedAt, ownerUserId)
      SELECT
        id, name, phone, email, address, note, createdAt,
        COALESCE(updatedAt, datetime('now')) as updatedAt,
        ownerUserId
      FROM _suppliers_old;
    `);

    // Eski tabloyu düşür
    await runExecute(`DROP TABLE _suppliers_old`);

    // İndeksler + per-owner benzersizlik
    await runExecute(
      `CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name);`
    );
    await runExecute(
      `CREATE INDEX IF NOT EXISTS idx_suppliers_owner ON suppliers(ownerUserId);`
    );
    await runExecute(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_suppliers_unique_owner
      ON suppliers(name, ownerUserId);
    `);

    await runExecute(`COMMIT`);
  } catch (e) {
    await runExecute(`ROLLBACK`);
    throw e;
  }
}

/* --------------------------------------------------------- */
/* Multi-tenant & indexler                                   */
/* --------------------------------------------------------- */
export async function ensureMultiTenant() {
  /* PRODUCTS */
  await ensureProductsTable(); // tablo yoksa oluştur
  await ensureProductsOwnerUserId();
  await ensureProductsUniquePerOwner();
  await runExecute(
    `CREATE INDEX IF NOT EXISTS idx_products_owner ON products(ownerUserId);`
  );

  /* Barkod için benzersiz index (aynı kullanıcıda aynı barkod yasak) */
  await runExecute(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_products_barcode_owner
    ON products(barcode, ownerUserId)
  `);

  /* STOCK TRANSACTIONS */
  await ensureStockTransactionsTable(); // tablo yoksa oluştur
  await addColumnIfMissing(
    "stock_transactions",
    "ownerUserId INTEGER",
    "ownerUserId"
  );
  await runExecute(
    `CREATE INDEX IF NOT EXISTS idx_st_owner ON stock_transactions(ownerUserId);`
  );

  /* NOTIFICATIONS */
  await ensureNotificationsTable(); // tablo yoksa oluştur
  await addColumnIfMissing(
    "notifications",
    "ownerUserId INTEGER",
    "ownerUserId"
  );
  await runExecute(
    `CREATE INDEX IF NOT EXISTS idx_notifications_owner ON notifications(ownerUserId);`
  );

  /* SUPPLIERS */
  await ensureSuppliers(); // tablo (eski şemada global UNIQUE olabilir)
  await addColumnIfMissing("suppliers", "ownerUserId INTEGER", "ownerUserId");
  await ensureSuppliersUpdatedAt();
  await ensureSuppliersUniquePerOwner(); // ⬅️ rebuild ile per-owner UNIQUE
  await runExecute(
    `CREATE INDEX IF NOT EXISTS idx_suppliers_owner ON suppliers(ownerUserId);`
  );
  await runExecute(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_suppliers_unique_owner
    ON suppliers(name, ownerUserId);
  `);
}

/* --------------------------------------------------------- */
/* sync_info (lastSync kaydı)                                */
/* --------------------------------------------------------- */
async function ensureSyncInfo() {
  await runExecute(`
    CREATE TABLE IF NOT EXISTS sync_info (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      lastSync TEXT
    );
  `);
  const rows = await runQuery<{ c: number }>(
    `SELECT COUNT(*) as c FROM sync_info WHERE id = 1`
  );
  if (!rows[0] || rows[0].c === 0) {
    await runExecute(`INSERT INTO sync_info (id, lastSync) VALUES (1, NULL)`);
  }
}

/* --------------------------------------------------------- */
/* Entry                                                     */
/* --------------------------------------------------------- */
export async function ensureSchema() {
  await ensureSuppliers();       // idempotent
  await ensureMultiTenant();     // tüm kolon & index garantileri
  await ensureSyncInfo();        // lastSync kaydı
}
