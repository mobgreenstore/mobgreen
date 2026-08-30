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

export function coordinateAtProgress(
  geometry: TrackingGeometry,
  requestedProgress: number,
): TrackingCoordinate {
  const progress = Math.max(0, Math.min(1, requestedProgress));
  const coordinates = geometry.coordinates;
  if (progress === 0) return coordinates[0]!;
  if (progress === 1) return coordinates[coordinates.length - 1]!;

  const segments = coordinates.slice(1).map((coordinate, index) => ({
    from: coordinates[index]!,
    to: coordinate,
    distance: distanceMeters(coordinates[index]!, coordinate),
  }));
  const total = segments.reduce((sum, segment) => sum + segment.distance, 0);
  if (total <= 0) return coordinates[0]!;

  const target = total * progress;
  let traversed = 0;
  for (const segment of segments) {
    if (traversed + segment.distance >= target) {
      const local =
        segment.distance === 0 ? 0 : (target - traversed) / segment.distance;
      return [
        segment.from[0] + (segment.to[0] - segment.from[0]) * local,
        segment.from[1] + (segment.to[1] - segment.from[1]) * local,
      ];
    }
    traversed += segment.distance;
  }
  return coordinates[coordinates.length - 1]!;
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
