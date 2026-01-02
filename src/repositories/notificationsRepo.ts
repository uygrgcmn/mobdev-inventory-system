import { runExecute, runQuery } from "../db/db";

export type NotificationRow = {
  id: number;
  sku: string | null;
  type: "LOW_STOCK" | "EXPIRY";
  message: string;
  resolved: number; // 0|1
  createdAt: string;
  ownerUserId: number;
};

export async function addNotification(
  sku: string | null,
  type: "LOW_STOCK" | "EXPIRY",
  message: string,
  ownerUserId: number
) {
  try {
    await runExecute(
      `INSERT INTO notifications (sku, type, message, ownerUserId) VALUES (?, ?, ?, ?)`,
      [sku, type, message, ownerUserId]
    );
  } catch {}
}

export async function getActiveNotifications(ownerUserId: number): Promise<NotificationRow[]> {
  return runQuery<NotificationRow>(
    `SELECT * FROM notifications WHERE ownerUserId = ? AND resolved = 0 ORDER BY createdAt DESC`,
    [ownerUserId]
  );
}

export async function resolveNotification(id: number, ownerUserId: number) {
  await runExecute(`UPDATE notifications SET resolved = 1 WHERE id = ? AND ownerUserId = ?`, [id, ownerUserId]);
}
