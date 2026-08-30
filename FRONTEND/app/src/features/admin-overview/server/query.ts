import "server-only";

import { OrderStatus, SpecialOfferStatus } from "@/generated/prisma/client";
import { requireAdminPermission } from "@/server/auth/authorization";
import { prisma } from "@/server/db/client";

export async function getAdminOverview() {
  await requireAdminPermission("workspace.read");
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const [
    pendingVerification,
    ordersToday,
    activeProducts,
    activeCategories,
    activeOffers,
    openDeliveries,
    recentOrders,
  ] = await Promise.all([
    prisma.order.count({
      where: { status: "PENDING", paymentStatus: "PENDING" },
    }),
    prisma.order.count({ where: { createdAt: { gte: startOfDay } } }),
    prisma.product.count({ where: { status: "ACTIVE", archivedAt: null } }),
    prisma.category.count({ where: { isActive: true, archivedAt: null } }),
    prisma.specialOffer.count({
      where: {
        status: SpecialOfferStatus.ACTIVE,
        startsAt: { lte: now },
        endsAt: { gt: now },
        archivedAt: null,
      },
    }),
    prisma.order.count({
      where: {
        fulfillmentType: "DELIVERY",
        status: {
          in: [
            OrderStatus.CONFIRMED,
            OrderStatus.PROCESSING,
            OrderStatus.READY,
            OrderStatus.OUT_FOR_DELIVERY,
          ],
        },
      },
    }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        reference: true,
        customerName: true,
        currency: true,
        totalMinor: true,
        status: true,
        paymentStatus: true,
        createdAt: true,
      },
    }),
  ]);

  return {
    metrics: {
      pendingVerification,
      ordersToday,
      activeProducts,
      activeCategories,
      activeOffers,
      openDeliveries,
    },
    recentOrders: recentOrders.map((order) => ({
      ...order,
      totalMinor: Number(order.totalMinor),
      createdAt: order.createdAt.toISOString(),
    })),
  };
}
