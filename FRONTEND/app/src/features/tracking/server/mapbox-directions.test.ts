import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/server/location/environment", () => ({
  getMapboxServerToken: () => "test-mapbox-token",
}));
vi.mock("@/server/core/logger", () => ({
  logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn() },
}));

import { generateDeliveryRoute } from "@/features/tracking/server/mapbox-directions";

const input = {
  origin: [11.5, 3.8] as [number, number],
  destination: [11.6, 3.9] as [number, number],
  dispatchedAt: new Date("2026-08-16T00:00:00.000Z"),
};

describe("Mapbox delivery directions", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("validates and returns a real GeoJSON driving route", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            code: "Ok",
            uuid: "route-123",
            routes: [
              {
                geometry: {
                  type: "LineString",
                  coordinates: [input.origin, input.destination],
                },
                distance: 20_000.4,
                duration: 2_000.2,
              },
            ],
          }),
          { status: 200 },
        ),
      ),
    );
    const route = await generateDeliveryRoute(input);
    expect(route.routeKind).toBe("DRIVING");
    expect(route.distanceMeters).toBe(20_000);
    expect(route.durationSeconds).toBe(2_000);
    expect(route.providerError).toBeNull();
  });

  it("uses a clearly identified direct fallback for NoRoute", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ code: "NoRoute", routes: [] }), {
          status: 200,
        }),
      ),
    );
    const route = await generateDeliveryRoute(input);
    expect(route.routeKind).toBe("DIRECT_FALLBACK");
    expect(route.providerId).toBe("mob-greens-direct-v1");
    expect(route.providerError).toBe("NO_DRIVING_ROUTE");
    expect(route.geometry.coordinates).toEqual([
      input.origin,
      input.destination,
    ]);
  });

  it("falls back safely when provider data is invalid", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ code: "Ok", routes: [{ distance: -1 }] }),
          {
            status: 200,
          },
        ),
      ),
    );
    const route = await generateDeliveryRoute(input);
    expect(route.routeKind).toBe("DIRECT_FALLBACK");
    expect(route.providerError).toBe("INVALID_RESPONSE");
  });

  it("retries transient failures with a bounded attempt count", async () => {
    const provider = vi
      .fn()
      .mockResolvedValue(
        new Response("temporarily unavailable", { status: 503 }),
      );
    vi.stubGlobal("fetch", provider);
    const route = await generateDeliveryRoute(input);
    expect(provider).toHaveBeenCalledTimes(3);
    expect(route.routeKind).toBe("DIRECT_FALLBACK");
    expect(route.providerError).toBe("HTTP_503");
  });
});
