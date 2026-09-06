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
  TrackingGeometry,
  TrackingRoutePlan,
} from "@/features/tracking/types";
import { generateDeliveryRoute } from "@/features/tracking/server/mapbox-directions";
import { logger } from "@/server/core/logger";
import { prisma } from "@/server/db/client";
import { withTransaction } from "@/server/db/transaction";

const EARTH_RADIUS_METERS = 6_371_000;
const SIMULATED_COURIER_PROVIDER = "mob-greens-courier-simulation-v1";
const ROAD_ROUTE_RETRY_MS = 15 * 60 * 1000;
const COURIER_PREPARATION_MS = 45 * 1000;

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

export async function completeElapsedDeliveryTracking(orderId: string) {
  return withTransaction(async (transaction) => {
    const completed = await transaction.order.updateMany({
      where: { id: orderId, status: "OUT_FOR_DELIVERY" },
      data: { status: "COMPLETED" },
    });
    if (completed.count !== 1) return false;
    await transaction.deliveryTracking.updateMany({
      where: { orderId, state: "ACTIVE" },
      data: { state: "COMPLETED" },
    });
    await transaction.orderStatusEvent.create({
      data: {
        orderId,
        fromStatus: "OUT_FOR_DELIVERY",
        toStatus: "COMPLETED",
        note: "Delivery reached its estimated arrival time.",
      },
    });
    return true;
  });
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

function estimatedCurveGeometry(
  origin: TrackingCoordinate,
  destination: TrackingCoordinate,
  seed: string,
): TrackingGeometry {
  const [originLongitude, originLatitude] = origin;
  const longitudeDelta = destination[0] - originLongitude;
  const latitudeDelta = destination[1] - originLatitude;
  const span = Math.hypot(longitudeDelta, latitudeDelta);
  const seedByte = createHash("sha256").update(seed).digest().readUInt8(2);
  const direction = seedByte % 2 === 0 ? 1 : -1;
  const curveStrength = span * (0.1 + (seedByte / 255) * 0.06) * direction;
  const normalLongitude = span ? -latitudeDelta / span : 0;
  const normalLatitude = span ? longitudeDelta / span : 0;
  const coordinates: TrackingCoordinate[] = [];

  for (let index = 0; index <= 20; index += 1) {
    const progress = index / 20;
    const curve = Math.sin(Math.PI * progress) * curveStrength;
    coordinates.push([
      Number(
        (
          originLongitude +
          longitudeDelta * progress +
          normalLongitude * curve
        ).toFixed(7),
      ),
      Number(
        (
          originLatitude +
          latitudeDelta * progress +
          normalLatitude * curve
        ).toFixed(7),
      ),
    ]);
  }

  return { type: "LineString", coordinates };
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
  const dispatchedAt =
    input.dispatchedAt ?? new Date(Date.now() + COURIER_PREPARATION_MS);
  return {
    origin,
    destination,
    geometry: estimatedCurveGeometry(origin, destination, input.seed),
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

/**
 * Replaces the local estimated curve with a route snapped to Mapbox roads.
 * The selected courier's saved distance and ETA remain authoritative for the
 * experiment; Mapbox supplies only the road-following geometry.
 */
export async function ensureRoadFollowingRouteForOrder(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      reference: true,
      courierProfileIdSnapshot: true,
      deliveryTracking: true,
    },
  });
  const tracking = order?.deliveryTracking;
  if (!order || !tracking || tracking.routeKind === "DRIVING") return false;
  if (
    tracking.lastProviderError &&
    Date.now() - tracking.updatedAt.getTime() < ROAD_ROUTE_RETRY_MS
  ) {
    return false;
  }

  const origin: TrackingCoordinate = [
    Number(tracking.originLongitude),
    Number(tracking.originLatitude),
  ];
  const destination: TrackingCoordinate = [
    Number(tracking.destinationLongitude),
    Number(tracking.destinationLatitude),
  ];
  const route = await generateDeliveryRoute({
    origin,
    destination,
    dispatchedAt: tracking.dispatchedAt,
  });

  if (route.routeKind !== "DRIVING") {
    await prisma.deliveryTracking.updateMany({
      where: { orderId, routeKind: "DIRECT_FALLBACK" },
      data: {
        routeGeometry: estimatedCurveGeometry(
          origin,
          destination,
          `${order.reference}:${order.courierProfileIdSnapshot ?? "courier"}`,
        ) as unknown as Prisma.InputJsonValue,
        lastProviderError: route.providerError ?? "NO_DRIVING_ROUTE",
      },
    });
    return false;
  }

  const updated = await prisma.deliveryTracking.updateMany({
    where: { orderId, routeKind: "DIRECT_FALLBACK" },
    data: {
      routeGeometry: route.geometry as unknown as Prisma.InputJsonValue,
      routeProviderId:
        `${SIMULATED_COURIER_PROVIDER}:${route.providerId}`.slice(0, 255),
      routeKind: "DRIVING",
      lastProviderError: null,
    },
  });
  if (updated.count > 0) {
    logger.info("delivery_tracking.road_route_ready", {
      orderReference: order.reference,
      courierProfileId: order.courierProfileIdSnapshot,
    });
  }
  return updated.count > 0;
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
    isSimulated: record.routeProviderId.startsWith(SIMULATED_COURIER_PROVIDER),
    routeDisclosure: record.routeProviderId.startsWith(
      SIMULATED_COURIER_PROVIDER,
    )
      ? "Estimated movement based on the selected delivery profile's route and time."
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
