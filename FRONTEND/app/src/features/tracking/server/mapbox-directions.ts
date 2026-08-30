import "server-only";

import { z } from "zod";
import {
  distanceMeters,
  trackingCoordinateSchema,
  trackingGeometrySchema,
} from "@/features/tracking/domain";
import type {
  TrackingCoordinate,
  TrackingRoutePlan,
} from "@/features/tracking/types";
import { logger } from "@/server/core/logger";
import { getMapboxServerToken } from "@/server/location/environment";

const directionsResponseSchema = z.object({
  code: z.string(),
  uuid: z.string().optional(),
  routes: z
    .array(
      z.object({
        geometry: trackingGeometrySchema,
        distance: z.number().finite().positive(),
        duration: z.number().finite().positive(),
      }),
    )
    .max(10)
    .optional(),
});

const MAX_PROVIDER_ATTEMPTS = 3;
const REQUEST_TIMEOUT_MS = 8_000;

function validateCoordinate(
  coordinate: TrackingCoordinate,
): TrackingCoordinate {
  return trackingCoordinateSchema.parse(coordinate);
}

function fallbackPlan(
  origin: TrackingCoordinate,
  destination: TrackingCoordinate,
  dispatchedAt: Date,
  providerError: string,
): TrackingRoutePlan {
  const distance = Math.max(1, Math.round(distanceMeters(origin, destination)));
  const duration = Math.max(300, Math.round(distance / 8.33));
  return {
    origin,
    destination,
    geometry: { type: "LineString", coordinates: [origin, destination] },
    distanceMeters: distance,
    durationSeconds: duration,
    dispatchedAt,
    estimatedArrivalAt: new Date(dispatchedAt.getTime() + duration * 1000),
    providerId: "mob-greens-direct-v1",
    routeKind: "DIRECT_FALLBACK",
    providerError,
  };
}

async function requestDirections(
  origin: TrackingCoordinate,
  destination: TrackingCoordinate,
) {
  const coordinates = [origin, destination];
  if (coordinates.length !== 2) {
    throw new Error("INVALID_COORDINATE_COUNT");
  }
  const endpoint = coordinates
    .map(([longitude, latitude]) => `${longitude},${latitude}`)
    .join(";");
  const parameters = new URLSearchParams({
    access_token: getMapboxServerToken(),
    geometries: "geojson",
    overview: "full",
    steps: "false",
  });

  for (let attempt = 1; attempt <= MAX_PROVIDER_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${endpoint}?${parameters.toString()}`,
        {
          cache: "no-store",
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        },
      );
      const transient =
        response.status === 408 ||
        response.status === 429 ||
        response.status >= 500;
      if (!response.ok) {
        if (transient && attempt < MAX_PROVIDER_ATTEMPTS) continue;
        return { kind: "error" as const, reason: `HTTP_${response.status}` };
      }
      const parsed = directionsResponseSchema.safeParse(await response.json());
      if (!parsed.success) {
        return { kind: "error" as const, reason: "INVALID_RESPONSE" };
      }
      if (parsed.data.code === "NoRoute") {
        return { kind: "no-route" as const };
      }
      const route = parsed.data.routes?.[0];
      if (parsed.data.code !== "Ok" || !route) {
        return { kind: "error" as const, reason: "UNSUPPORTED_ROUTE" };
      }
      return {
        kind: "route" as const,
        route,
        providerId: parsed.data.uuid
          ? `mapbox-directions-v5:${parsed.data.uuid.slice(0, 64)}`
          : "mapbox-directions-v5",
      };
    } catch (error) {
      const transient =
        error instanceof TypeError ||
        (error instanceof DOMException && error.name === "TimeoutError");
      if (transient && attempt < MAX_PROVIDER_ATTEMPTS) continue;
      return {
        kind: "error" as const,
        reason:
          error instanceof DOMException && error.name === "TimeoutError"
            ? "TIMEOUT"
            : "PROVIDER_UNAVAILABLE",
      };
    }
  }
  return { kind: "error" as const, reason: "PROVIDER_UNAVAILABLE" };
}

export async function generateDeliveryRoute(input: {
  origin: TrackingCoordinate;
  destination: TrackingCoordinate;
  dispatchedAt?: Date;
}): Promise<TrackingRoutePlan> {
  const origin = validateCoordinate(input.origin);
  const destination = validateCoordinate(input.destination);
  const dispatchedAt = input.dispatchedAt ?? new Date();
  let response: Awaited<ReturnType<typeof requestDirections>>;
  try {
    response = await requestDirections(origin, destination);
  } catch {
    response = { kind: "error", reason: "PROVIDER_UNAVAILABLE" };
  }

  if (response.kind !== "route") {
    const reason =
      response.kind === "no-route" ? "NO_DRIVING_ROUTE" : response.reason;
    logger.warn("delivery_tracking.route_fallback", { reason });
    return fallbackPlan(origin, destination, dispatchedAt, reason);
  }

  const duration = Math.max(1, Math.round(response.route.duration));
  return {
    origin,
    destination,
    geometry: response.route.geometry,
    distanceMeters: Math.max(1, Math.round(response.route.distance)),
    durationSeconds: duration,
    dispatchedAt,
    estimatedArrivalAt: new Date(dispatchedAt.getTime() + duration * 1000),
    providerId: response.providerId,
    routeKind: "DRIVING",
    providerError: null,
  };
}
