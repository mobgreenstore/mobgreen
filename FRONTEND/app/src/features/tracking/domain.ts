import { z } from "zod";
import type {
  TrackingCoordinate,
  TrackingGeometry,
  TrackingProgress,
  TrackingState,
} from "@/features/tracking/types";

export const trackingCoordinateSchema = z.tuple([
  z.number().min(-180).max(180),
  z.number().min(-90).max(90),
]);

export const trackingGeometrySchema = z.object({
  type: z.literal("LineString"),
  coordinates: z.array(trackingCoordinateSchema).min(2).max(25_000),
});

const EARTH_RADIUS_METERS = 6_371_000;

function clampProgress(progress: number) {
  return Math.max(0, Math.min(1, progress));
}

function coordinatesEqual(
  first: TrackingCoordinate,
  second: TrackingCoordinate,
) {
  return first[0] === second[0] && first[1] === second[1];
}

function interpolateCoordinate(
  from: TrackingCoordinate,
  to: TrackingCoordinate,
  progress: number,
): TrackingCoordinate {
  return [
    from[0] + (to[0] - from[0]) * progress,
    from[1] + (to[1] - from[1]) * progress,
  ];
}

function lineString(coordinates: TrackingCoordinate[]): TrackingGeometry {
  return { type: "LineString", coordinates };
}

export interface LineStringProgressSplit {
  progress: number;
  courier: TrackingCoordinate;
  completed: TrackingGeometry;
  remaining: TrackingGeometry;
}

export function distanceMeters(
  first: TrackingCoordinate,
  second: TrackingCoordinate,
) {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const latitudeDelta = radians(second[1] - first[1]);
  const longitudeDelta = radians(second[0] - first[0]);
  const firstLatitude = radians(first[1]);
  const secondLatitude = radians(second[1]);
  const value =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(firstLatitude) *
      Math.cos(secondLatitude) *
      Math.sin(longitudeDelta / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1, Math.sqrt(value)));
}

export function geometryDistanceMeters(geometry: TrackingGeometry) {
  const coordinates = geometry.coordinates;
  return coordinates
    .slice(1)
    .reduce(
      (total, coordinate, index) =>
        total + distanceMeters(coordinates[index]!, coordinate),
      0,
    );
}

/**
 * Splits a saved route by its travelled distance, not by its coordinate count.
 * The inserted courier coordinate lets the completed and remaining LineStrings
 * meet precisely even when progress falls inside a route segment.
 */
export function splitLineStringAtProgress(
  geometry: TrackingGeometry,
  requestedProgress: number,
): LineStringProgressSplit {
  const progress = clampProgress(requestedProgress);
  const coordinates = geometry.coordinates;
  const origin = coordinates[0]!;
  const destination = coordinates[coordinates.length - 1]!;

  if (progress === 0) {
    return {
      progress,
      courier: origin,
      completed: lineString([origin, origin]),
      remaining: lineString([...coordinates]),
    };
  }

  if (progress === 1) {
    return {
      progress,
      courier: destination,
      completed: lineString([...coordinates]),
      remaining: lineString([destination, destination]),
    };
  }

  const segments = coordinates.slice(1).map((to, index) => ({
    from: coordinates[index]!,
    to,
    distance: distanceMeters(coordinates[index]!, to),
  }));
  const totalDistance = segments.reduce(
    (total, segment) => total + segment.distance,
    0,
  );

  if (totalDistance <= 0) {
    return {
      progress,
      courier: origin,
      completed: lineString([origin, origin]),
      remaining: lineString([...coordinates]),
    };
  }

  const targetDistance = totalDistance * progress;
  let travelledDistance = 0;

  for (const [index, segment] of segments.entries()) {
    const segmentEnd = travelledDistance + segment.distance;
    if (segmentEnd >= targetDistance) {
      const localProgress =
        segment.distance === 0
          ? 0
          : (targetDistance - travelledDistance) / segment.distance;
      const courier = interpolateCoordinate(
        segment.from,
        segment.to,
        localProgress,
      );
      const completedCoordinates = coordinates.slice(0, index + 1);
      if (!coordinatesEqual(completedCoordinates.at(-1)!, courier)) {
        completedCoordinates.push(courier);
      }
      const remainingCoordinates = [courier];
      const tail = coordinates.slice(index + 1);
      if (tail.length && coordinatesEqual(courier, tail[0]!)) {
        remainingCoordinates.push(...tail.slice(1));
      } else {
        remainingCoordinates.push(...tail);
      }

      return {
        progress,
        courier,
        completed: lineString(completedCoordinates),
        remaining: lineString(
          remainingCoordinates.length > 1
            ? remainingCoordinates
            : [courier, destination],
        ),
      };
    }
    travelledDistance = segmentEnd;
  }

  return {
    progress,
    courier: destination,
    completed: lineString([...coordinates]),
    remaining: lineString([destination, destination]),
  };
}

export function coordinateAtProgress(
  geometry: TrackingGeometry,
  requestedProgress: number,
): TrackingCoordinate {
  return splitLineStringAtProgress(geometry, requestedProgress).courier;
}

export function calculateTrackingProgress(input: {
  geometry: TrackingGeometry;
  routeDistanceMeters: number;
  durationSeconds: number;
  dispatchedAt: Date;
  state: TrackingState;
  updatedAt: Date;
  now?: Date;
}): TrackingProgress {
  const now = input.now ?? new Date();
  const effectiveTime =
    input.state === "PAUSED" || input.state === "CANCELLED"
      ? input.updatedAt
      : now;
  const elapsedSeconds = Math.max(
    0,
    (effectiveTime.getTime() - input.dispatchedAt.getTime()) / 1000,
  );
  const temporalProgress =
    input.durationSeconds <= 0 ? 1 : elapsedSeconds / input.durationSeconds;
  const progress =
    input.state === "COMPLETED"
      ? 1
      : Math.max(0, Math.min(1, temporalProgress));
  return {
    progress,
    courier: coordinateAtProgress(input.geometry, progress),
    distanceRemainingMeters: Math.max(
      0,
      Math.round(input.routeDistanceMeters * (1 - progress)),
    ),
    timeRemainingSeconds: Math.max(
      0,
      Math.round(input.durationSeconds * (1 - progress)),
    ),
    serverTimestamp: now.toISOString(),
  };
}
