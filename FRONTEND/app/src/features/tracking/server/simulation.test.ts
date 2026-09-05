import { describe, expect, it, vi } from "vitest";

vi.mock("@/server/db/client", () => ({ prisma: {} }));

import {
  createSelectedCourierSimulation,
  publicTrackingFromRecord,
} from "@/features/tracking/server/service";

describe("selected courier tracking simulation", () => {
  const destination: [number, number] = [11.5167, 3.8667];
  const dispatchedAt = new Date("2026-09-05T20:00:00.000Z");

  it("uses the selected courier's exact saved distance and ETA", () => {
    const first = createSelectedCourierSimulation({
      destination,
      distanceMeters: 2_400,
      durationSeconds: 1_260,
      seed: "order-1:courier-1",
      dispatchedAt,
    });
    const second = createSelectedCourierSimulation({
      destination,
      distanceMeters: 2_400,
      durationSeconds: 1_260,
      seed: "order-1:courier-1",
      dispatchedAt,
    });

    expect(first).toEqual(second);
    expect(first.distanceMeters).toBe(2_400);
    expect(first.durationSeconds).toBe(1_260);
    expect(first.destination).toEqual(destination);
    expect(first.origin).not.toEqual(destination);
    expect(first.geometry.coordinates).toEqual([first.origin, destination]);
  });

  it("identifies the persisted simulation without exposing it as a driving route", () => {
    const plan = createSelectedCourierSimulation({
      destination,
      distanceMeters: 1_200,
      durationSeconds: 900,
      seed: "order-2:courier-2",
      dispatchedAt,
    });
    const tracking = publicTrackingFromRecord({
      state: "ACTIVE",
      routeKind: plan.routeKind,
      routeGeometry:
        plan.geometry as unknown as import("@/generated/prisma/client").Prisma.JsonValue,
      originLatitude: plan.origin[1],
      originLongitude: plan.origin[0],
      destinationLatitude: plan.destination[1],
      destinationLongitude: plan.destination[0],
      routeDistanceMeters: plan.distanceMeters,
      estimatedDurationSeconds: plan.durationSeconds,
      dispatchedAt,
      estimatedArrivalAt: plan.estimatedArrivalAt,
      updatedAt: dispatchedAt,
      routeProviderId: plan.providerId,
    });

    expect(tracking.isSimulated).toBe(true);
    expect(tracking.routeDisclosure).toContain("selected delivery profile");
  });
});
