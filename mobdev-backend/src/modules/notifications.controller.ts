import { Response } from "express";
import { AuthedReq } from "../auth/auth.middleware";
import { prisma } from "../db";

export async function listNotifications(req: AuthedReq, res: Response) {
  const orgId = req.user!.organizationId;
  const data = await prisma.notification.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: "desc" },
  });
  res.json({ ok: true, data });
}

export async function deleteNotification(req: AuthedReq, res: Response) {
  const orgId = req.user!.organizationId;
  const id = Number(req.params.id);

  if (!Number.isFinite(id)) {
    return res.status(400).json({ ok: false, message: "Invalid id" });
  }

  const notification = await prisma.notification.findFirst({
    where: { id, organizationId: orgId },
  });

  if (!notification) {
    return res.status(404).json({ ok: false, message: "Notification not found" });
  }

  await prisma.notification.delete({ where: { id } });
  res.json({ ok: true });
}
