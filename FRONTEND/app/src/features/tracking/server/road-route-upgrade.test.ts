import { beforeEach, describe, expect, it, vi } from "vitest";

const database = vi.hoisted(() => ({
  order: { findUnique: vi.fn() },
  deliveryTracking: { updateMany: vi.fn() },
}));
const generateDeliveryRoute = vi.hoisted(() => vi.fn());

vi.mock("@/server/db/client", () => ({ prisma: database }));
vi.mock("@/features/tracking/server/mapbox-directions", () => ({
  generateDeliveryRoute,
}));
vi.mock("@/server/core/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { ensureRoadFollowingRouteForOrder } from "@/features/tracking/server/service";

describe("estimated delivery road route upgrade", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    database.order.findUnique.mockResolvedValue({
      reference: "MG-ROUTE-1",
      courierProfileIdSnapshot: "courier-1",
      deliveryTracking: {
        originLongitude: 11.5,
        originLatitude: 3.8,
        destinationLongitude: 11.6,
        destinationLatitude: 3.9,
        dispatchedAt: new Date("2026-09-06T10:00:00.000Z"),
        routeKind: "DIRECT_FALLBACK",
        routeProviderId: "mob-greens-courier-simulation-v1",
        lastProviderError: null,
        updatedAt: new Date("2026-09-06T10:00:00.000Z"),
      },
    });
    database.deliveryTracking.updateMany.mockResolvedValue({ count: 1 });
  });

  it("persists Mapbox road geometry without replacing the courier's saved metrics", async () => {
    generateDeliveryRoute.mockResolvedValue({
      origin: [11.5, 3.8],
      destination: [11.6, 3.9],
      geometry: {
        type: "LineString",
        coordinates: [
          [11.5, 3.8],
          [11.53, 3.85],
          [11.6, 3.9],
        ],
      },
      distanceMeters: 18_000,
      durationSeconds: 2_000,
      dispatchedAt: new Date("2026-09-06T10:00:00.000Z"),
      estimatedArrivalAt: new Date("2026-09-06T10:33:20.000Z"),
      providerId: "mapbox-directions-v5:route-1",
      routeKind: "DRIVING",
      providerError: null,
    });

    await expect(ensureRoadFollowingRouteForOrder("order-1")).resolves.toBe(
      true,
    );
    expect(database.deliveryTracking.updateMany).toHaveBeenCalledWith({
      where: { orderId: "order-1", routeKind: "DIRECT_FALLBACK" },
      data: expect.objectContaining({
        routeKind: "DRIVING",
        routeProviderId: expect.stringContaining("mapbox-directions-v5"),
        routeGeometry: expect.objectContaining({ type: "LineString" }),
      }),
    });
    expect(
      database.deliveryTracking.updateMany.mock.calls[0]?.[0].data,
    ).not.toHaveProperty("routeDistanceMeters");
  });
});
