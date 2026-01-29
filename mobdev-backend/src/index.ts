// mobdev-backend/src/index.ts
import express from "express";
import cors from "cors";
import { env } from "./env";
import { register, login, me } from "./auth/auth.controller";
import { authRequired, onlyAdmin, requireRole } from "./auth/auth.middleware";
import { listProducts, createProduct, updateProduct, deleteProduct } from "./modules/products.controller";
import { listSuppliers, createSupplier, deltaSuppliers, bulkUpsertSuppliers } from "./modules/suppliers.controller";
import { listNotifications, deleteNotification } from "./modules/notifications.controller";
import { listStockTransactions, createStockTransaction } from "./modules/stocks.controller";
import { uploadChanges, downloadChanges } from "./modules/sync.controller";
import { listCategories, createCategory } from "./modules/categories.controller";
import { checkAlertsForAllUsers } from "./modules/alerts.service";
import {
  inventoryReport,
  stockMovementReport,
  expirationAlertReport,
  inventoryValuationReport,
  userActivityReport,
} from "./modules/reports.controller";
import usersRoutes from "./users/users.routes";
import bodyParser from "body-parser";

const app = express();

// CORS + JSON
app.use(cors({ origin: true }));
app.use(bodyParser.json());

// Users (Admin korumaları routes içinde)
app.use("/api/users", usersRoutes);

// Health check (API kökü altında)
app.get("/api/health", (_req, res) => res.json({ ok: true }));

/* ----------------- Auth ----------------- */
app.post("/api/auth/register", register);
app.post("/api/auth/login", login);
app.get("/api/auth/me", authRequired, me);

/* --------------- Products --------------- */
app.get("/api/products", authRequired, listProducts);
app.post("/api/products", authRequired, requireRole("Admin", "Manager"), createProduct);
app.put("/api/products/:id", authRequired, requireRole("Admin", "Manager"), updateProduct);
app.delete("/api/products/:id", authRequired, requireRole("Admin"), deleteProduct);

/* --------------- Categories -------------- */
app.get("/api/categories", authRequired, listCategories);
app.post("/api/categories", authRequired, requireRole("Admin", "Manager"), createCategory);

/* --------------- Suppliers --------------- */
app.get("/api/suppliers", authRequired, listSuppliers);
app.post("/api/suppliers", authRequired, requireRole("Admin", "Manager"), createSupplier);
app.get("/api/suppliers/delta", authRequired, deltaSuppliers);
app.post("/api/suppliers/bulkUpsert", authRequired, requireRole("Admin", "Manager"), bulkUpsertSuppliers);

/* ------------- Notifications ------------- */
app.get("/api/notifications", authRequired, listNotifications);
app.delete("/api/notifications/:id", authRequired, deleteNotification);

/* ----------- Stock Transactions ---------- */
app.get("/api/stocks", authRequired, listStockTransactions);
app.post("/api/stocks", authRequired, createStockTransaction);

/* ----------------- Sync ------------------ */
app.post("/api/sync/upload", authRequired, uploadChanges);
app.get("/api/sync/download", authRequired, downloadChanges);
/* ---------------- Reports ---------------- */
app.get("/api/reports/inventory", authRequired, requireRole("Admin", "Manager"), inventoryReport);
app.get("/api/reports/stock-movements", authRequired, requireRole("Admin", "Manager"), stockMovementReport);
app.get("/api/reports/expiration-alerts", authRequired, requireRole("Admin", "Manager"), expirationAlertReport);
app.get("/api/reports/valuation", authRequired, requireRole("Admin", "Manager"), inventoryValuationReport);
app.get("/api/reports/user-activity", authRequired, userActivityReport);

/* --------------- Admin örnek ------------- */
app.get("/api/admin/ping", authRequired, onlyAdmin, (_req, res) =>
  res.json({ ok: true, data: "pong" })
);

/* -------- Global error handler ----------- */
app.use((err: any, _req: any, res: any, _next: any) => {
  console.error("GLOBAL_ERROR:", err);
  const msg = err?.message || "Internal Error";
  res.status(500).json({ ok: false, message: msg });
});

/* -------------- Server bind -------------- */
// ÖNEMLİ: 0.0.0.0’a bind → LAN’dan erişim mümkün
const PORT = Number(env.PORT) || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`API on http://0.0.0.0:${PORT}`);
});

/* -------------- Alert scheduler ----------- */
// 5 dakikada bir stok/expiry uyarılarını kontrol eder
const ALERT_INTERVAL_MS = 5 * 60 * 1000;
checkAlertsForAllUsers().catch((e) => console.error("[ALERT][ERROR]", e));
setInterval(() => {
  checkAlertsForAllUsers().catch((e) => console.error("[ALERT][ERROR]", e));
}, ALERT_INTERVAL_MS);
