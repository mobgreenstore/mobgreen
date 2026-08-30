import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import {
  calculateTrackingProgress,
  trackingGeometrySchema,
} from "@/features/tracking/domain";
import { generateDeliveryRoute } from "@/features/tracking/server/mapbox-directions";
import type {
  PublicDeliveryTracking,
  TrackingRoutePlan,
} from "@/features/tracking/types";
import { prisma } from "@/server/db/client";

export class DeliveryTrackingError extends Error {
  constructor(
    readonly code:
      | "NOT_FOUND"
      | "NOT_DELIVERY"
      | "INVALID_STATUS"
      | "MISSING_ORIGIN"
      | "MISSING_DESTINATION",
    message: string,
  ) {
    super(message);
    this.name = "DeliveryTrackingError";
  }
}

export async function prepareDeliveryTracking(orderId: string) {
  const [order, settings] = await Promise.all([
    prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        status: true,
        fulfillmentType: true,
        destinationLatitude: true,
        destinationLongitude: true,
      },
    }),
    prisma.storeSettings.findUnique({
      where: { id: "default" },
      select: { dispatchLatitude: true, dispatchLongitude: true },
    }),
  ]);
  if (!order) throw new DeliveryTrackingError("NOT_FOUND", "Order not found.");
  if (order.fulfillmentType !== "DELIVERY") {
    throw new DeliveryTrackingError(
      "NOT_DELIVERY",
      "Pickup orders cannot receive delivery tracking.",
    );
  }
  if (order.status !== "PROCESSING" && order.status !== "OUT_FOR_DELIVERY") {
    throw new DeliveryTrackingError(
      "INVALID_STATUS",
      "Tracking can only be generated while dispatching an order.",
    );
  }
  if (
    order.destinationLatitude === null ||
    order.destinationLongitude === null
  ) {
    throw new DeliveryTrackingError(
      "MISSING_DESTINATION",
      "Confirm the customer delivery destination before dispatch.",
    );
  }
  if (
    !settings ||
    settings.dispatchLatitude === null ||
    settings.dispatchLongitude === null
  ) {
    throw new DeliveryTrackingError(
      "MISSING_ORIGIN",
      "Configure the private dispatch origin before dispatch.",
    );
  }
  return generateDeliveryRoute({
    origin: [
      Number(settings.dispatchLongitude),
      Number(settings.dispatchLatitude),
    ],
    destination: [
      Number(order.destinationLongitude),
      Number(order.destinationLatitude),
    ],
  });
}

export function trackingCreateData(
  orderId: string,
  plan: TrackingRoutePlan,
): Prisma.DeliveryTrackingUncheckedCreateInput {
  return {
    orderId,
    originLatitude: plan.origin[1],
    originLongitude: plan.origin[0],
    destinationLatitude: plan.destination[1],
    destinationLongitude: plan.destination[0],
    routeGeometry: plan.geometry as unknown as Prisma.InputJsonValue,
    routeDistanceMeters: plan.distanceMeters,
    estimatedDurationSeconds: plan.durationSeconds,
    dispatchedAt: plan.dispatchedAt,
    estimatedArrivalAt: plan.estimatedArrivalAt,
    routeProviderId: plan.providerId,
    routeKind: plan.routeKind,
    state: "ACTIVE",
    lastProviderError: plan.providerError,
  };
}

export function trackingUpdateData(
  plan: TrackingRoutePlan,
): Prisma.DeliveryTrackingUncheckedUpdateInput {
  const create = trackingCreateData("unused", plan);
  return Object.fromEntries(
    Object.entries(create).filter(([key]) => key !== "orderId"),
  ) as Prisma.DeliveryTrackingUncheckedUpdateInput;
}

export function publicTrackingFromRecord(record: {
  state: "ACTIVE" | "PAUSED" | "COMPLETED" | "CANCELLED";
  routeKind: "DRIVING" | "DIRECT_FALLBACK";
  routeGeometry: Prisma.JsonValue;
  originLatitude: unknown;
  originLongitude: unknown;
  destinationLatitude: unknown;
  destinationLongitude: unknown;
  routeDistanceMeters: number;
  estimatedDurationSeconds: number;
  dispatchedAt: Date;
  estimatedArrivalAt: Date;
  updatedAt: Date;
}): PublicDeliveryTracking {
  const geometry = trackingGeometrySchema.parse(record.routeGeometry);
  const progress = calculateTrackingProgress({
    geometry,
    routeDistanceMeters: record.routeDistanceMeters,
    durationSeconds: record.estimatedDurationSeconds,
    dispatchedAt: record.dispatchedAt,
    state: record.state,
    updatedAt: record.updatedAt,
  });
  return {
    state: record.state,
    routeKind: record.routeKind,
    routeDisclosure:
      record.routeKind === "DRIVING"
        ? "Simulated courier progress along a provider-generated driving route."
        : "Simulated direct trajectory. This is not a road route.",
    geometry,
    origin: [Number(record.originLongitude), Number(record.originLatitude)],
    destination: [
      Number(record.destinationLongitude),
      Number(record.destinationLatitude),
    ],
    courier: progress.courier,
    routeDistanceMeters: record.routeDistanceMeters,
    distanceRemainingMeters: progress.distanceRemainingMeters,
    estimatedDurationSeconds: record.estimatedDurationSeconds,
    timeRemainingSeconds: progress.timeRemainingSeconds,
    dispatchedAt: record.dispatchedAt.toISOString(),
    estimatedArrivalAt: record.estimatedArrivalAt.toISOString(),
    serverTimestamp: progress.serverTimestamp,
    progress: progress.progress,
  };
}
