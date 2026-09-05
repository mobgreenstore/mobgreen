import { describe, expect, it } from "vitest";
import {
  calculateTrackingProgress,
  coordinateAtProgress,
  splitLineStringAtProgress,
} from "@/features/tracking/domain";

const geometry = {
  type: "LineString" as const,
  coordinates: [
    [0, 0],
    [1, 0],
    [2, 0],
  ] as Array<[number, number]>,
};

describe("temporal delivery tracking", () => {
  it("interpolates deterministically along the saved route", () => {
    expect(coordinateAtProgress(geometry, 0.5)).toEqual([1, 0]);
    expect(coordinateAtProgress(geometry, 0.5)).toEqual([1, 0]);
  });

  it("splits a LineString by travelled distance and inserts the courier coordinate", () => {
    const split = splitLineStringAtProgress(
      {
        type: "LineString",
        coordinates: [
          [0, 0],
          [1, 0],
          [4, 0],
        ],
      },
      0.5,
    );

    expect(split.courier).toEqual([2, 0]);
    expect(split.completed.coordinates).toEqual([
      [0, 0],
      [1, 0],
      [2, 0],
    ]);
    expect(split.remaining.coordinates).toEqual([
      [2, 0],
      [4, 0],
    ]);
  });

  it("clamps split endpoints while preserving valid line geometries", () => {
    const start = splitLineStringAtProgress(geometry, -1);
    const end = splitLineStringAtProgress(geometry, 2);

    expect(start.progress).toBe(0);
    expect(start.courier).toEqual([0, 0]);
    expect(start.completed.coordinates).toEqual([
      [0, 0],
      [0, 0],
    ]);
    expect(start.remaining.coordinates).toEqual(geometry.coordinates);
    expect(end.progress).toBe(1);
    expect(end.courier).toEqual([2, 0]);
    expect(end.completed.coordinates).toEqual(geometry.coordinates);
    expect(end.remaining.coordinates).toEqual([
      [2, 0],
      [2, 0],
    ]);
  });

  it("uses server time for distance and time remaining", () => {
    const result = calculateTrackingProgress({
      geometry,
      routeDistanceMeters: 1_000,
      durationSeconds: 100,
      dispatchedAt: new Date("2026-08-16T00:00:00.000Z"),
      updatedAt: new Date("2026-08-16T00:00:00.000Z"),
      state: "ACTIVE",
      now: new Date("2026-08-16T00:00:25.000Z"),
    });
    expect(result.progress).toBe(0.25);
    expect(result.distanceRemainingMeters).toBe(750);
    expect(result.timeRemainingSeconds).toBe(75);
    expect(result.serverTimestamp).toBe("2026-08-16T00:00:25.000Z");
  });

  it("freezes paused and cancelled tracking at the persisted update time", () => {
    for (const state of ["PAUSED", "CANCELLED"] as const) {
      const result = calculateTrackingProgress({
        geometry,
        routeDistanceMeters: 1_000,
        durationSeconds: 100,
        dispatchedAt: new Date("2026-08-16T00:00:00.000Z"),
        updatedAt: new Date("2026-08-16T00:00:40.000Z"),
        state,
        now: new Date("2026-08-16T00:01:30.000Z"),
      });
      expect(result.progress).toBe(0.4);
      expect(result.distanceRemainingMeters).toBe(600);
    }
  });

  it("places completed tracking at the destination", () => {
    const result = calculateTrackingProgress({
      geometry,
      routeDistanceMeters: 1_000,
      durationSeconds: 100,
      dispatchedAt: new Date("2026-08-16T00:00:00.000Z"),
      updatedAt: new Date("2026-08-16T00:00:10.000Z"),
      state: "COMPLETED",
      now: new Date("2026-08-16T00:00:10.000Z"),
    });
    expect(result.progress).toBe(1);
    expect(result.courier).toEqual([2, 0]);
    expect(result.distanceRemainingMeters).toBe(0);
    expect(result.timeRemainingSeconds).toBe(0);
  });
});
