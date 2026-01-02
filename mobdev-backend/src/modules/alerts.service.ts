import { prisma } from "../db";

async function addNotificationOnce(params: {
  sku?: string | null;
  type: string;
  message: string;
  ownerUserId: number;
}) {
  const { sku, type, message, ownerUserId } = params;
  await prisma.notification.upsert({
    where: {
      sku_type_message_resolved_ownerUserId: {
        sku: sku ?? "",
        type,
        message,
        resolved: false,
        ownerUserId,
      },
    },
    update: {},
    create: { sku: sku ?? null, type, message, ownerUserId },
  });
}

export async function checkAlertsForUser(ownerUserId: number) {
  // Low stock
  const lowStock = await prisma.product.findMany({
    where: {
      ownerUserId,
      quantity: { lte: prisma.product.fields.minStock },
    },
    select: { sku: true, name: true, quantity: true, minStock: true },
  });

  for (const item of lowStock) {
    await addNotificationOnce({
      sku: item.sku,
      type: "LOW_STOCK",
      message: `${item.name} (${item.sku}) stok yetersiz (${item.quantity}/${item.minStock})`,
      ownerUserId,
    });
  }

  // Expiry within 30 days
  const expiring = await prisma.product.findMany({
    where: { ownerUserId, expiryDate: { not: null } },
    select: { sku: true, name: true, expiryDate: true },
  });

  const now = Date.now();
  for (const item of expiring) {
    if (!item.expiryDate) continue;
    const expiry = new Date(item.expiryDate).getTime();
    const diffDays = Math.floor((expiry - now) / (1000 * 3600 * 24));
    if (diffDays <= 30 && diffDays >= 0) {
      await addNotificationOnce({
        sku: item.sku,
        type: "EXPIRY",
        message: `${item.name} (${item.sku}) son kullanma tarihi ${item.expiryDate} (${diffDays} gün kaldı)`,
        ownerUserId,
      });
    }
  }
}

export async function checkAlertsForAllUsers() {
  const users = await prisma.user.findMany({ select: { id: true } });
  for (const u of users) {
    await checkAlertsForUser(u.id);
  }
}
