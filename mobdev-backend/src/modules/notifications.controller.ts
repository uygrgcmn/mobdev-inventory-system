import { Response } from "express";
import { AuthedReq } from "../auth/auth.middleware";
import { prisma } from "../db";

export async function listNotifications(req: AuthedReq, res: Response) {
  const uid = req.user!.id;
  const data = await prisma.notification.findMany({
    where: { ownerUserId: uid },
    orderBy: { createdAt: "desc" },
  });
  res.json({ ok: true, data });
}
