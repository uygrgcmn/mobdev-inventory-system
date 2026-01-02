import { Response } from "express";
import { prisma } from "../db";
import { AuthedReq } from "../auth/auth.middleware";

type Format = "json" | "csv";

function parseFormat(value: any): Format {
  return value === "csv" ? "csv" : "json";
}

function toCSV(rows: any[]) {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const esc = (v: any) => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(","), ...rows.map((r) => headers.map((h) => esc((r as any)[h])).join(","))].join("\n");
}

export async function inventoryReport(req: AuthedReq, res: Response) {
  const uid = req.user!.id;
  const format = parseFormat(req.query.format);

  const data = await prisma.product.findMany({
    where: { ownerUserId: uid },
    orderBy: { name: "asc" },
    select: {
      sku: true,
      name: true,
      category: true,
      quantity: true,
      unitPrice: true,
      supplierName: true,
      expiryDate: true,
      minStock: true,
      updatedAt: true,
    },
  });

  if (format === "csv") {
    res.setHeader("Content-Type", "text/csv");
    return res.send(toCSV(data));
  }
  res.json({ ok: true, data });
}

export async function stockMovementReport(req: AuthedReq, res: Response) {
  const uid = req.user!.id;
  const format = parseFormat(req.query.format);

  const data = await prisma.stockTransaction.findMany({
    where: { ownerUserId: uid },
    orderBy: { createdAt: "desc" },
    select: {
      sku: true,
      change: true,
      reason: true,
      userId: true,
      createdAt: true,
    },
  });

  if (format === "csv") {
    res.setHeader("Content-Type", "text/csv");
    return res.send(toCSV(data));
  }
  res.json({ ok: true, data });
}

export async function expirationAlertReport(req: AuthedReq, res: Response) {
  const uid = req.user!.id;
  const format = parseFormat(req.query.format);
  const now = new Date();
  const max = new Date(now.getTime() + 30 * 24 * 3600 * 1000);

  const data = await prisma.product.findMany({
    where: {
      ownerUserId: uid,
      expiryDate: { not: null },
    },
    select: { sku: true, name: true, expiryDate: true },
  });

  const filtered = data
    .map((p) => ({
      ...p,
      daysLeft: p.expiryDate ? Math.floor((new Date(p.expiryDate).getTime() - now.getTime()) / (1000 * 3600 * 24)) : null,
    }))
    .filter((p) => p.expiryDate && p.daysLeft !== null && p.daysLeft! >= 0 && p.daysLeft! <= 30);

  if (format === "csv") {
    res.setHeader("Content-Type", "text/csv");
    return res.send(toCSV(filtered));
  }
  res.json({ ok: true, data: filtered });
}

export async function inventoryValuationReport(req: AuthedReq, res: Response) {
  const uid = req.user!.id;
  const format = parseFormat(req.query.format);

  const products = await prisma.product.findMany({
    where: { ownerUserId: uid },
    select: { sku: true, name: true, quantity: true, unitPrice: true },
  });

  const rows = products.map((p) => ({
    sku: p.sku,
    name: p.name,
    quantity: p.quantity,
    unitPrice: p.unitPrice,
    totalValue: p.quantity * p.unitPrice,
  }));
  const total = rows.reduce((acc, r) => acc + r.totalValue, 0);

  if (format === "csv") {
    res.setHeader("Content-Type", "text/csv");
    return res.send(toCSV(rows));
  }
  res.json({ ok: true, data: rows, summary: { totalValue: total } });
}

export async function userActivityReport(req: AuthedReq, res: Response) {
  const uid = req.user!.id;
  const format = parseFormat(req.query.format);

  const logs = await prisma.userActivity.findMany({
    where: { userId: uid },
    orderBy: { createdAt: "desc" },
    select: {
      action: true,
      path: true,
      method: true,
      status: true,
      createdAt: true,
    },
    take: 200,
  });

  if (format === "csv") {
    res.setHeader("Content-Type", "text/csv");
    return res.send(toCSV(logs));
  }
  res.json({ ok: true, data: logs });
}
