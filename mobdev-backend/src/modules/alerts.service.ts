import { prisma } from "../db";

async function addNotificationOnce(params: {
  sku?: string | null;
  type: string;
  message: string;
  organizationId: number;
}) {
  const { sku, type, message, organizationId } = params;
  await prisma.notification.upsert({
    where: {
      sku_type_message_resolved_organizationId: {
        sku: sku ?? "",
        type,
        message,
        resolved: false,
        organizationId,
      },
    },
    update: {},
    create: { sku: sku ?? null, type, message, organizationId },
  });
}

// Kept this function alias for compatibility with products.controller for now, 
// using 'uid' arg but treating it as 'orgId'.
// In a clean refactor, we should rename the export and usages.
export async function checkAlertsForUser(organizationId: number) {
  return checkAlertsForOrganization(organizationId);
}

export async function checkAlertsForOrganization(organizationId: number) {
  // Low stock
  const lowStock = await prisma.product.findMany({
    where: {
      organizationId,
      quantity: { lte: prisma.product.fields.minStock },
    },
    select: { sku: true, name: true, quantity: true, minStock: true },
  });

  for (const item of lowStock) {
    await addNotificationOnce({
      sku: item.sku,
      type: "LOW_STOCK",
      message: `${item.name} (${item.sku}) stok yetersiz (${item.quantity}/${item.minStock})`,
      organizationId,
    });
  }

  // Expiry within 30 days or already expired
  const expiring = await prisma.product.findMany({
    where: { organizationId, expiryDate: { not: null } },
    select: { sku: true, name: true, expiryDate: true },
  });

  const now = Date.now();
  for (const item of expiring) {
    if (!item.expiryDate) continue;
    const expiry = new Date(item.expiryDate).getTime();
    const diffDays = Math.floor((expiry - now) / (1000 * 3600 * 24));

    // Check if expired (diffDays < 0)
    if (diffDays < 0) {
      await addNotificationOnce({
        sku: item.sku,
        type: "EXPIRED",
        message: `${item.name} (${item.sku}) son kullanma tarihi geçmiş: ${item.expiryDate}`,
        organizationId,
      });
    }
    // Check if expiring within 30 days
    else if (diffDays <= 30) {
      await addNotificationOnce({
        sku: item.sku,
        type: "EXPIRY",
        message: `${item.name} (${item.sku}) son kullanma tarihi ${item.expiryDate} (${diffDays} gün kaldı)`,
        organizationId,
      });
    }
  }
}

export async function checkAlertsForAllUsers() {
  // Renamed logic to check for organizations
  const orgs = await prisma.organization.findMany({ select: { id: true } });
  for (const o of orgs) {
    await checkAlertsForOrganization(o.id);
  }
}
