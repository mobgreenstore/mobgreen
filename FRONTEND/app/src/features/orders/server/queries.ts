import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import type { AdminOrderFilters } from "@/features/orders/params";
import type {
  AdminOrderDetail,
  AdminOrderListView,
  AdminOrderSort,
} from "@/features/orders/types";
import { publicTrackingFromRecord } from "@/features/tracking/server/service";
import {
  parseStoredCourierCandidates,
  toPublicCourierCandidate,
} from "@/features/delivery-matching/server/candidate-set";
import { requireAdminPermission } from "@/server/auth/authorization";
import { prisma } from "@/server/db/client";

const PAGE_SIZE = 20;

function dateRange(
  filters: AdminOrderFilters,
): Prisma.DateTimeFilter | undefined {
  if (!filters.dateFrom && !filters.dateTo) return undefined;
  const range: Prisma.DateTimeFilter = {};
  if (filters.dateFrom)
    range.gte = new Date(`${filters.dateFrom}T00:00:00.000Z`);
  if (filters.dateTo) {
    const exclusive = new Date(`${filters.dateTo}T00:00:00.000Z`);
    exclusive.setUTCDate(exclusive.getUTCDate() + 1);
    range.lt = exclusive;
  }
  return range;
}

export function orderWhere(filters: AdminOrderFilters): Prisma.OrderWhereInput {
  const createdAt = dateRange(filters);
  return {
    ...(filters.search
      ? {
          OR: [
            { reference: { contains: filters.search, mode: "insensitive" } },
            { customerName: { contains: filters.search, mode: "insensitive" } },
            {
              customerPhone: { contains: filters.search, mode: "insensitive" },
            },
          ],
        }
      : {}),
    ...(filters.status !== "all" ? { status: filters.status } : {}),
    ...(filters.paymentStatus !== "all"
      ? { paymentStatus: filters.paymentStatus }
      : {}),
    ...(filters.paymentMethod !== "all"
      ? { paymentMethod: filters.paymentMethod }
      : {}),
    ...(filters.fulfillment !== "all"
      ? { fulfillmentType: filters.fulfillment }
      : {}),
    ...(filters.currency !== "all" ? { currency: filters.currency } : {}),
    ...(createdAt ? { createdAt } : {}),
  };
}

export function orderBy(
  sort: AdminOrderSort,
): Prisma.OrderOrderByWithRelationInput[] {
  if (sort === "created-asc") return [{ createdAt: "asc" }, { id: "asc" }];
  if (sort === "total-desc") return [{ totalMinor: "desc" }, { id: "asc" }];
  if (sort === "total-asc") return [{ totalMinor: "asc" }, { id: "asc" }];
  if (sort === "reference-asc") return [{ reference: "asc" }, { id: "asc" }];
  return [{ createdAt: "desc" }, { id: "asc" }];
}

export async function listAdminOrders(
  filters: AdminOrderFilters,
): Promise<AdminOrderListView> {
  await requireAdminPermission("orders.read");
  const where = orderWhere(filters);
  const totalCount = await prisma.order.count({ where });
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const page = Math.min(filters.page, totalPages);
  const orders = await prisma.order.findMany({
    where,
    select: {
      id: true,
      reference: true,
      customerName: true,
      customerEmail: true,
      customerPhone: true,
      fulfillmentType: true,
      paymentMethod: true,
      rechargeProvider: true,
      currency: true,
      totalMinor: true,
      status: true,
      paymentStatus: true,
      createdAt: true,
      _count: { select: { items: true } },
    },
    orderBy: orderBy(filters.sort),
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  });
  return {
    orders: orders.map((order) => ({
      id: order.id,
      reference: order.reference,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      fulfillmentType: order.fulfillmentType,
      paymentMethod: order.paymentMethod,
      rechargeProvider: order.rechargeProvider,
      currency: order.currency,
      totalMinor: Number(order.totalMinor),
      status: order.status,
      paymentStatus: order.paymentStatus,
      itemCount: order._count.items,
      createdAt: order.createdAt.toISOString(),
    })),
    page,
    pageSize: PAGE_SIZE,
    totalCount,
    totalPages,
  };
}

export async function getAdminOrder(
  id: string,
): Promise<AdminOrderDetail | null> {
  await requireAdminPermission("orders.read");
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { orderBy: { createdAt: "asc" } },
      statusEvents: {
        include: { changedByAdmin: { select: { name: true } } },
        orderBy: { createdAt: "asc" },
      },
      paymentStatusEvents: {
        include: { changedByAdmin: { select: { name: true } } },
        orderBy: { createdAt: "asc" },
      },
      deliveryTracking: true,
      checkoutIntent: { select: { candidateSet: true } },
      paymentAttempts: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: {
          rechargeCodes: { orderBy: { position: "asc" } },
          events: { orderBy: { createdAt: "asc" } },
        },
      },
      notifications: {
        where: {
          kind: {
            in: ["ADMIN_ORDER_SUBMITTED", "CUSTOMER_ORDER_SUBMITTED"],
          },
        },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      _count: { select: { items: true } },
    },
  });
  if (!order) return null;
  const settings = await prisma.storeSettings.findUnique({
    where: { id: "default" },
    select: { dispatchLatitude: true, dispatchLongitude: true },
  });

  const timeline = [
    ...order.statusEvents.map((event) => ({
      id: event.id,
      kind: "ORDER" as const,
      fromStatus: event.fromStatus,
      toStatus: event.toStatus,
      note: event.note,
      changedBy: event.changedByAdmin?.name ?? null,
      occurredAt: event.createdAt.toISOString(),
    })),
    ...order.paymentStatusEvents.map((event) => ({
      id: event.id,
      kind: "PAYMENT" as const,
      fromStatus: event.fromStatus,
      toStatus: event.toStatus,
      note: event.note,
      changedBy: event.changedByAdmin?.name ?? null,
      occurredAt: event.createdAt.toISOString(),
    })),
  ].sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));
  const storedCourierCandidates = parseStoredCourierCandidates(
    order.checkoutIntent?.candidateSet ?? null,
  );
  const currentCourierCandidate = order.courierProfileIdSnapshot
    ? storedCourierCandidates.find(
        (candidate) => candidate.profileId === order.courierProfileIdSnapshot,
      )
    : null;

  const paymentAttempt = order.paymentAttempts[0] ?? null;
  const adminNotification = order.notifications.find(
    (notification) => notification.kind === "ADMIN_ORDER_SUBMITTED",
  );
  const customerNotification = order.notifications.find(
    (notification) => notification.kind === "CUSTOMER_ORDER_SUBMITTED",
  );

  return {
    id: order.id,
    reference: order.reference,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone,
    fulfillmentType: order.fulfillmentType,
    paymentMethod: order.paymentMethod,
    rechargeProvider: order.rechargeProvider,
    currency: order.currency,
    totalMinor: Number(order.totalMinor),
    status: order.status,
    paymentStatus: order.paymentStatus,
    itemCount: order._count.items,
    createdAt: order.createdAt.toISOString(),
    customerNote: order.customerNote,
    deliveryLocation: order.deliveryAddress
      ? {
          formattedAddress: order.deliveryAddress,
          postalCode: order.deliveryPostalCode,
          locality: order.deliveryLocality,
          countryCode: order.deliveryCountryCode,
        }
      : null,
    destinationCoordinatesPresent:
      order.destinationLatitude !== null && order.destinationLongitude !== null,
    courierCandidateId: currentCourierCandidate?.candidateId ?? null,
    courierCandidates: storedCourierCandidates.map(toPublicCourierCandidate),
    courierAssignmentLocked: [
      "OUT_FOR_DELIVERY",
      "COMPLETED",
      "CANCELLED",
    ].includes(order.status),
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
    dispatchConfigured:
      settings?.dispatchLatitude !== null &&
      settings?.dispatchLatitude !== undefined &&
      settings.dispatchLongitude !== null &&
      settings.dispatchLongitude !== undefined,
    tracking: order.deliveryTracking
      ? {
          ...publicTrackingFromRecord(order.deliveryTracking),
          providerId: order.deliveryTracking.routeProviderId,
          lastProviderError: order.deliveryTracking.lastProviderError,
        }
      : null,
    verificationCodeAvailable:
      Boolean(order.verificationCodeEncrypted) ||
      Boolean(paymentAttempt?.rechargeCodes.length),
    paymentAttempt: paymentAttempt
      ? {
          publicId: paymentAttempt.publicId,
          status: paymentAttempt.status,
          provider: paymentAttempt.provider,
          depositMinor: Number(paymentAttempt.depositMinor),
          cashBalanceDueMinor: Number(paymentAttempt.cashBalanceDueMinor),
          expectedSatoshis:
            paymentAttempt.expectedSatoshis === null
              ? null
              : Number(paymentAttempt.expectedSatoshis),
          receivedSatoshis: Number(paymentAttempt.receivedSatoshis),
          transactionId: paymentAttempt.transactionId,
          confirmationCount: paymentAttempt.confirmationCount,
          cashCollectedAt:
            paymentAttempt.cashCollectedAt?.toISOString() ?? null,
          expiresAt: paymentAttempt.expiresAt?.toISOString() ?? null,
          maskedCodes: paymentAttempt.rechargeCodes.map(
            (code) => code.maskedValue,
          ),
          events: paymentAttempt.events.map((event) => ({
            id: event.id,
            eventType: event.eventType,
            fromStatus: event.fromStatus,
            toStatus: event.toStatus,
            occurredAt: event.createdAt.toISOString(),
          })),
        }
      : null,
    notification: adminNotification
      ? {
          status: adminNotification.status,
          attemptCount: adminNotification.attemptCount,
          sentAt: adminNotification.sentAt?.toISOString() ?? null,
          lastError: adminNotification.lastError,
        }
      : null,
    customerNotification: customerNotification
      ? {
          status: customerNotification.status,
          attemptCount: customerNotification.attemptCount,
          sentAt: customerNotification.sentAt?.toISOString() ?? null,
          lastError: customerNotification.lastError,
        }
      : null,
    items: order.items.map((item) => ({
      id: item.id,
      productName: item.productNameSnapshot,
      weightValue: Number(item.weightValueSnapshot),
      weightUnit: item.weightUnitSnapshot,
      currency: item.currencySnapshot,
      unitPriceMinor: Number(item.unitPriceMinor),
      quantity: item.quantity,
      lineTotalMinor: Number(item.lineTotalMinor),
      offer:
        item.offerOriginalTotalMinorSnapshot !== null &&
        item.offerDiscountBpsSnapshot !== null &&
        item.offerDiscountMinorSnapshot !== null &&
        item.offerTotalMinorSnapshot !== null &&
        item.offerBundleQuantitySnapshot !== null &&
        item.offerEndsAtSnapshot !== null
          ? {
              originalTotalMinor: Number(item.offerOriginalTotalMinorSnapshot),
              discountBps: item.offerDiscountBpsSnapshot,
              discountMinor: Number(item.offerDiscountMinorSnapshot),
              offerTotalMinor: Number(item.offerTotalMinorSnapshot),
              bundleQuantity: item.offerBundleQuantitySnapshot,
              endsAt: item.offerEndsAtSnapshot.toISOString(),
            }
          : null,
    })),
    timeline,
  };
}
