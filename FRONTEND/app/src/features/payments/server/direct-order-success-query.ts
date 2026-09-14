import "server-only";

import { prisma } from "@/server/db/client";

export async function getGuestDirectOrderSuccess(
  guestSessionId: string,
  reference: string,
) {
  return prisma.order.findFirst({
    where: { guestSessionId, reference, archivedAt: null },
    select: {
      reference: true,
      customerName: true,
      customerEmail: true,
      currency: true,
      totalMinor: true,
      paymentMethod: true,
      paymentStatus: true,
      rechargeProvider: true,
      fulfillmentType: true,
      status: true,
      createdAt: true,
    },
  });
}
