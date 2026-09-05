import "server-only";

import { createHash } from "node:crypto";
import type { Prisma } from "@/generated/prisma/client";
import {
  calculateTrackingProgress,
  trackingGeometrySchema,
} from "@/features/tracking/domain";
import type {
  PublicDeliveryTracking,
  TrackingCoordinate,
  TrackingRoutePlan,
} from "@/features/tracking/types";
import { prisma } from "@/server/db/client";

const EARTH_RADIUS_METERS = 6_371_000;
const SIMULATED_COURIER_PROVIDER = "mob-greens-courier-simulation-v1";

export class DeliveryTrackingError extends Error {
  constructor(
    readonly code:
      | "NOT_FOUND"
      | "NOT_DELIVERY"
      | "INVALID_STATUS"
      | "MISSING_COURIER"
      | "MISSING_DESTINATION",
    message: string,
  ) {
    super(message);
    this.name = "DeliveryTrackingError";
  }
}

function simulatedCourierOrigin(input: {
  destination: TrackingCoordinate;
  distanceMeters: number;
  seed: string;
}): TrackingCoordinate {
  const distance = Math.max(1, Math.round(input.distanceMeters));
  const bearing =
    (createHash("sha256").update(input.seed).digest().readUInt16BE(0) /
      65_536) *
    Math.PI *
    2;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const toDegrees = (value: number) => (value * 180) / Math.PI;
  const [destinationLongitude, destinationLatitude] = input.destination;
  const latitude = toRadians(destinationLatitude);
  const longitude = toRadians(destinationLongitude);
  const angularDistance = distance / EARTH_RADIUS_METERS;
  const originLatitude = Math.asin(
    Math.sin(latitude) * Math.cos(angularDistance) +
      Math.cos(latitude) * Math.sin(angularDistance) * Math.cos(bearing),
  );
  const originLongitude =
    longitude +
    Math.atan2(
      Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(latitude),
      Math.cos(angularDistance) - Math.sin(latitude) * Math.sin(originLatitude),
    );
  const normalizedLongitude = ((toDegrees(originLongitude) + 540) % 360) - 180;
  return [
    Number(normalizedLongitude.toFixed(7)),
    Number(toDegrees(originLatitude).toFixed(7)),
  ];
}

/**
 * Creates the intentionally fictional route used by the delivery experiment.
 * The destination remains the customer's verified Mapbox location; distance
 * and time come exactly from the courier profile the customer selected.
 */
export function createSelectedCourierSimulation(input: {
  destination: TrackingCoordinate;
  distanceMeters: number;
  durationSeconds: number;
  seed: string;
  dispatchedAt?: Date;
}): TrackingRoutePlan {
  const destination = input.destination;
  const distanceMeters = Math.max(1, Math.round(input.distanceMeters));
  const durationSeconds = Math.max(60, Math.round(input.durationSeconds));
  const origin = simulatedCourierOrigin({
    destination,
    distanceMeters,
    seed: input.seed,
  });
  const dispatchedAt = input.dispatchedAt ?? new Date();
  return {
    origin,
    destination,
    geometry: { type: "LineString", coordinates: [origin, destination] },
    distanceMeters,
    durationSeconds,
    dispatchedAt,
    estimatedArrivalAt: new Date(
      dispatchedAt.getTime() + durationSeconds * 1000,
    ),
    providerId: SIMULATED_COURIER_PROVIDER,
    routeKind: "DIRECT_FALLBACK",
    providerError: null,
  };
}

export async function prepareDeliveryTracking(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      reference: true,
      status: true,
      fulfillmentType: true,
      destinationLatitude: true,
      destinationLongitude: true,
      courierProfileIdSnapshot: true,
      courierDistanceMeters: true,
      courierDurationSeconds: true,
    },
  });
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
    !order.courierProfileIdSnapshot ||
    order.courierDistanceMeters === null ||
    order.courierDurationSeconds === null
  ) {
    throw new DeliveryTrackingError(
      "MISSING_COURIER",
      "Select a delivery profile before starting simulated tracking.",
    );
  }
  return createSelectedCourierSimulation({
    destination: [
      Number(order.destinationLongitude),
      Number(order.destinationLatitude),
    ],
    distanceMeters: order.courierDistanceMeters,
    durationSeconds: order.courierDurationSeconds,
    seed: `${order.reference}:${order.courierProfileIdSnapshot}`,
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
  routeProviderId: string;
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
    isSimulated: record.routeProviderId === SIMULATED_COURIER_PROVIDER,
    routeDisclosure:
      record.routeProviderId === SIMULATED_COURIER_PROVIDER
        ? "Simulated progress based on the selected delivery profile's distance and estimated time."
        : record.routeKind === "DRIVING"
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
