import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import type {
  CustomerOrderTab,
  PublicOrderDetail,
  PublicOrderListItem,
  PublicOrderListView,
  PublicTrackingView,
} from "@/features/customer-orders/types";
import { publicTrackingFromRecord } from "@/features/tracking/server/service";
import { prisma } from "@/server/db/client";

const PAGE_SIZE = 8;

export function customerOrderWhere(
  guestSessionId: string,
  tab: CustomerOrderTab,
): Prisma.OrderWhereInput {
  const base: Prisma.OrderWhereInput = { guestSessionId, archivedAt: null };
  if (tab === "active") {
    return {
      ...base,
      paymentStatus: "PAID",
      status: { in: ["CONFIRMED", "PROCESSING", "READY", "OUT_FOR_DELIVERY"] },
    };
  }
  if (tab === "completed") return { ...base, status: "COMPLETED" };
  if (tab === "cancelled") return { ...base, status: "CANCELLED" };
  return { ...base, paymentStatus: { not: "PAID" }, status: "PENDING" };
}

function listItem(order: {
  reference: string;
  status: PublicOrderListItem["status"];
  paymentStatus: PublicOrderListItem["paymentStatus"];
  fulfillmentType: PublicOrderListItem["fulfillmentType"];
  currency: PublicOrderListItem["currency"];
  totalMinor: bigint;
  createdAt: Date;
  items: Array<{
    productImageUrlSnapshot: string | null;
    productImageAltTextSnapshot: string | null;
  }>;
  _count: { items: number };
  deliveryTracking: { estimatedArrivalAt: Date } | null;
}): PublicOrderListItem {
  const image = order.items[0]?.productImageUrlSnapshot
    ? {
        url: order.items[0].productImageUrlSnapshot,
        altText:
          order.items[0].productImageAltTextSnapshot ?? "Order item image",
      }
    : null;
  return {
    reference: order.reference,
    status: order.status,
    paymentStatus: order.paymentStatus,
    fulfillmentType: order.fulfillmentType,
    currency: order.currency,
    totalMinor: Number(order.totalMinor),
    createdAt: order.createdAt.toISOString(),
    estimatedDelivery:
      order.deliveryTracking?.estimatedArrivalAt.toISOString() ?? null,
    firstImage: image,
    itemCount: order._count.items,
    trackingAvailable:
      order.fulfillmentType === "DELIVERY" &&
      order.status === "OUT_FOR_DELIVERY",
  };
}

const listSelect = {
  reference: true,
  status: true,
  paymentStatus: true,
  fulfillmentType: true,
  currency: true,
  totalMinor: true,
  createdAt: true,
  items: {
    orderBy: { createdAt: "asc" as const },
    take: 1,
    select: {
      productImageUrlSnapshot: true,
      productImageAltTextSnapshot: true,
    },
  },
  deliveryTracking: { select: { estimatedArrivalAt: true } },
  _count: { select: { items: true } },
} satisfies Prisma.OrderSelect;

export async function listGuestOrders(
  guestSessionId: string,
  requestedPage: number,
  tab: CustomerOrderTab = "active",
): Promise<PublicOrderListView> {
  const page = Math.max(1, Math.min(1000, requestedPage));
  const where = customerOrderWhere(guestSessionId, tab);
  const [total, orders] = await prisma.$transaction([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { reference: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: listSelect,
    }),
  ]);
  return {
    orders: orders.map(listItem),
    page,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    total,
    tab,
  };
}

const orderDetailSelect = {
  ...listSelect,
  customerName: true,
  deliveryAddress: true,
  deliveryPostalCode: true,
  deliveryCountryCode: true,
  courierNameSnapshot: true,
  courierDistanceMeters: true,
  courierDurationSeconds: true,
  checkoutIntent: { select: { publicId: true } },
  items: {
    orderBy: { createdAt: "asc" as const },
    select: {
      productNameSnapshot: true,
      productImageUrlSnapshot: true,
      productImageAltTextSnapshot: true,
      weightValueSnapshot: true,
      weightUnitSnapshot: true,
      unitPriceMinor: true,
      quantity: true,
      lineTotalMinor: true,
    },
  },
  statusEvents: {
    orderBy: { createdAt: "asc" as const },
    select: { toStatus: true, createdAt: true },
  },
} satisfies Prisma.OrderSelect;

async function getOrderDetail(
  where: Prisma.OrderWhereInput,
): Promise<PublicOrderDetail | null> {
  const order = await prisma.order.findFirst({
    where,
    select: orderDetailSelect,
  });
  if (!order) return null;
  const summary = listItem({
    ...order,
    items: order.items,
    _count: order._count,
    deliveryTracking: order.deliveryTracking,
  });
  return {
    ...summary,
    deliveryMatchingIntentId:
      order.fulfillmentType === "DELIVERY" &&
      order.paymentStatus === "PAID" &&
      !order.courierNameSnapshot
        ? (order.checkoutIntent?.publicId ?? null)
        : null,
    customerName: order.customerName,
    deliveryLocation: order.deliveryAddress
      ? {
          formattedAddress: order.deliveryAddress,
          postalCode: order.deliveryPostalCode,
          countryCode: order.deliveryCountryCode,
        }
      : null,
    courier:
      order.courierNameSnapshot &&
      order.courierDistanceMeters !== null &&
      order.courierDurationSeconds !== null
        ? {
            displayName: order.courierNameSnapshot,
            distanceMeters: order.courierDistanceMeters,
            estimatedDurationSeconds: order.courierDurationSeconds,
            simulated: true,
          }
        : null,
    items: order.items.map((item) => ({
      name: item.productNameSnapshot,
      weightValue: item.weightValueSnapshot.toString(),
      weightUnit: item.weightUnitSnapshot,
      unitPriceMinor: Number(item.unitPriceMinor),
      quantity: item.quantity,
      lineTotalMinor: Number(item.lineTotalMinor),
      image: item.productImageUrlSnapshot
        ? {
            url: item.productImageUrlSnapshot,
            altText:
              item.productImageAltTextSnapshot ?? item.productNameSnapshot,
          }
        : null,
    })),
    timeline: order.statusEvents.map((event) => ({
      status: event.toStatus,
      createdAt: event.createdAt.toISOString(),
    })),
  };
}

export function getGuestOrder(
  guestSessionId: string,
  reference: string,
): Promise<PublicOrderDetail | null> {
  return getOrderDetail({ guestSessionId, reference, archivedAt: null });
}

/** Call only after the signed order-email access token has been verified. */
export function getEmailAccessibleOrder(
  reference: string,
): Promise<PublicOrderDetail | null> {
  return getOrderDetail({ reference, archivedAt: null });
}

const trackingSelect = {
  reference: true,
  status: true,
  fulfillmentType: true,
  deliveryAddress: true,
  deliveryPostalCode: true,
  deliveryLocality: true,
  deliveryTracking: true,
  statusEvents: {
    orderBy: { createdAt: "asc" as const },
    select: { toStatus: true, createdAt: true },
  },
} satisfies Prisma.OrderSelect;

async function getTracking(
  where: Prisma.OrderWhereInput,
): Promise<PublicTrackingView | null> {
  const order = await prisma.order.findFirst({
    where: {
      ...where,
      fulfillmentType: "DELIVERY",
    },
    select: trackingSelect,
  });
  if (
    !order ||
    order.fulfillmentType !== "DELIVERY" ||
    !order.deliveryAddress ||
    !order.deliveryTracking
  ) {
    return null;
  }
  return {
    reference: order.reference,
    status: order.status,
    fulfillmentType: "DELIVERY",
    deliveryAddress: {
      formattedAddress: order.deliveryAddress,
      postalCode: order.deliveryPostalCode,
      locality: order.deliveryLocality,
    },
    tracking: publicTrackingFromRecord(order.deliveryTracking),
    events: order.statusEvents.map((event) => ({
      status: event.toStatus,
      createdAt: event.createdAt.toISOString(),
    })),
  };
}

export function getGuestTracking(
  guestSessionId: string,
  reference: string,
): Promise<PublicTrackingView | null> {
  return getTracking({ guestSessionId, reference, archivedAt: null });
}

/** Call only after the signed order-email access token has been verified. */
export function getEmailAccessibleTracking(
  reference: string,
): Promise<PublicTrackingView | null> {
  return getTracking({ reference, archivedAt: null });
}
