import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import type {
  AdminDeliveryFilters,
  AdminDeliveryListView,
} from "@/features/delivery-operations/types";
import { requireAdminPermission } from "@/server/auth/authorization";
import { prisma } from "@/server/db/client";

const PAGE_SIZE = 20;
const OPEN_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "READY",
  "OUT_FOR_DELIVERY",
] as const;

export function deliveryWhere(
  filters: AdminDeliveryFilters,
): Prisma.OrderWhereInput {
  return {
    fulfillmentType: "DELIVERY",
    archivedAt: null,
    ...(filters.search
      ? {
          OR: [
            { reference: { contains: filters.search, mode: "insensitive" } },
            {
              customerName: { contains: filters.search, mode: "insensitive" },
            },
            {
              deliveryLocality: {
                contains: filters.search,
                mode: "insensitive",
              },
            },
          ],
        }
      : {}),
    ...(filters.status !== "all" ? { status: filters.status } : {}),
    ...(filters.courier
      ? {
          courierNameSnapshot: {
            contains: filters.courier,
            mode: "insensitive",
          },
        }
      : {}),
    ...(filters.tracking === "NOT_STARTED"
      ? { deliveryTracking: { is: null } }
      : filters.tracking !== "all"
        ? { deliveryTracking: { is: { state: filters.tracking } } }
        : {}),
  };
}

function orderBy(
  sort: AdminDeliveryFilters["sort"],
): Prisma.OrderOrderByWithRelationInput[] {
  if (sort === "created-asc") return [{ createdAt: "asc" }, { id: "asc" }];
  if (sort === "distance-asc") {
    return [
      { courierDistanceMeters: { sort: "asc", nulls: "last" } },
      { createdAt: "desc" },
    ];
  }
  if (sort === "eta-asc") {
    return [
      {
        deliveryTracking: {
          estimatedArrivalAt: "asc",
        },
      },
      { createdAt: "desc" },
    ];
  }
  return [{ createdAt: "desc" }, { id: "desc" }];
}

export async function listAdminDeliveries(
  filters: AdminDeliveryFilters,
): Promise<AdminDeliveryListView> {
  await requireAdminPermission("orders.read");
  const where = deliveryWhere(filters);
  const [
    totalCount,
    records,
    open,
    outForDelivery,
    activeTracking,
    withoutCourier,
  ] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      orderBy: orderBy(filters.sort),
      skip: (filters.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        reference: true,
        customerName: true,
        deliveryLocality: true,
        status: true,
        paymentStatus: true,
        courierNameSnapshot: true,
        courierDistanceMeters: true,
        courierDurationSeconds: true,
        createdAt: true,
        deliveryTracking: {
          select: { state: true, estimatedArrivalAt: true },
        },
      },
    }),
    prisma.order.count({
      where: {
        fulfillmentType: "DELIVERY",
        archivedAt: null,
        status: { in: [...OPEN_STATUSES] },
      },
    }),
    prisma.order.count({
      where: {
        fulfillmentType: "DELIVERY",
        archivedAt: null,
        status: "OUT_FOR_DELIVERY",
      },
    }),
    prisma.order.count({
      where: {
        fulfillmentType: "DELIVERY",
        archivedAt: null,
        deliveryTracking: { is: { state: "ACTIVE" } },
      },
    }),
    prisma.order.count({
      where: {
        fulfillmentType: "DELIVERY",
        archivedAt: null,
        courierProfileIdSnapshot: null,
        status: { in: [...OPEN_STATUSES] },
      },
    }),
  ]);
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  return {
    deliveries: records.map((record) => ({
      id: record.id,
      reference: record.reference,
      customerName: record.customerName,
      locality: record.deliveryLocality,
      status: record.status,
      paymentStatus: record.paymentStatus,
      courierName: record.courierNameSnapshot,
      courierDistanceMeters: record.courierDistanceMeters,
      courierDurationSeconds: record.courierDurationSeconds,
      trackingState: record.deliveryTracking?.state ?? null,
      estimatedArrivalAt:
        record.deliveryTracking?.estimatedArrivalAt.toISOString() ?? null,
      createdAt: record.createdAt.toISOString(),
    })),
    page: Math.min(filters.page, totalPages),
    pageSize: PAGE_SIZE,
    totalCount,
    totalPages,
    metrics: { open, outForDelivery, activeTracking, withoutCourier },
  };
}
