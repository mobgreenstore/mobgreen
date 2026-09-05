import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const requireGuestSession = vi.hoisted(() => vi.fn());
const getGuestTracking = vi.hoisted(() => vi.fn());
const getEmailAccessibleTracking = vi.hoisted(() => vi.fn());
const getRequestOrderEmailAccess = vi.hoisted(() => vi.fn());
const consumePublicRequest = vi.hoisted(() => vi.fn());

vi.mock("@/server/guest-session", () => ({ requireGuestSession }));
vi.mock("@/features/customer-orders/server/queries", () => ({
  getGuestTracking,
  getEmailAccessibleTracking,
}));
vi.mock("@/features/customer-orders/server/order-email-access", () => ({
  getRequestOrderEmailAccess,
}));
vi.mock("@/server/public-rate-limit", () => ({
  consumePublicRequest,
  publicThrottleKey: () => "safe-hash",
}));
vi.mock("@/server/core/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

const route =
  await import("@/app/api/customer/orders/[reference]/tracking/route");

describe("private customer tracking endpoint", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    consumePublicRequest.mockResolvedValue(true);
    getRequestOrderEmailAccess.mockReturnValue(null);
  });

  it("returns the same not-found response without a valid guest session", async () => {
    requireGuestSession.mockResolvedValue(null);
    const response = await route.GET(
      new NextRequest("http://localhost/api/customer/orders/MG-1/tracking"),
      { params: Promise.resolve({ reference: "MG-1" }) },
    );
    expect(response.status).toBe(404);
    expect(getGuestTracking).not.toHaveBeenCalled();
  });

  it("scopes tracking reads to the authenticated guest session and disables caching", async () => {
    requireGuestSession.mockResolvedValue({
      id: "guest-session-a",
      tokenHash: "hash-a",
    });
    getGuestTracking.mockResolvedValue({
      reference: "MG-1",
      status: "OUT_FOR_DELIVERY",
      fulfillmentType: "DELIVERY",
      deliveryAddress: {
        formattedAddress: "Confirmed destination",
        postalCode: "1000",
        locality: "City",
      },
      tracking: {
        state: "ACTIVE",
        routeKind: "DRIVING",
        routeDisclosure: "Simulated courier progress.",
        geometry: {
          type: "LineString",
          coordinates: [
            [1, 2],
            [3, 4],
          ],
        },
        origin: [1, 2],
        destination: [3, 4],
        courier: [2, 3],
        routeDistanceMeters: 1000,
        distanceRemainingMeters: 500,
        estimatedDurationSeconds: 100,
        timeRemainingSeconds: 50,
        dispatchedAt: "2026-08-16T00:00:00.000Z",
        estimatedArrivalAt: "2026-08-16T00:01:40.000Z",
        serverTimestamp: "2026-08-16T00:00:50.000Z",
        progress: 0.5,
      },
      events: [],
    });

    const response = await route.GET(
      new NextRequest("http://localhost/api/customer/orders/MG-1/tracking"),
      { params: Promise.resolve({ reference: "MG-1" }) },
    );
    expect(response.status).toBe(200);
    expect(getGuestTracking).toHaveBeenCalledWith("guest-session-a", "MG-1");
    expect(response.headers.get("cache-control")).toContain("no-store");
    const body = JSON.stringify(await response.json());
    expect(body).not.toContain("verificationCode");
    expect(body).not.toContain("customerEmail");
    expect(body).not.toContain("lastProviderError");
  });

  it("rate limits guest tracking reads before querying order data", async () => {
    requireGuestSession.mockResolvedValue({
      id: "guest-session-a",
      tokenHash: "hash-a",
    });
    consumePublicRequest.mockResolvedValue(false);
    const response = await route.GET(
      new NextRequest("http://localhost/api/customer/orders/MG-1/tracking"),
      { params: Promise.resolve({ reference: "MG-1" }) },
    );
    expect(response.status).toBe(429);
    expect(getGuestTracking).not.toHaveBeenCalled();
  });

  it("allows a verified email-link cookie to read only its matching order", async () => {
    requireGuestSession.mockResolvedValue(null);
    getRequestOrderEmailAccess.mockReturnValue({ tokenHash: "email-hash" });
    getEmailAccessibleTracking.mockResolvedValue({ reference: "MG-1" });

    const response = await route.GET(
      new NextRequest("http://localhost/api/customer/orders/MG-1/tracking"),
      { params: Promise.resolve({ reference: "MG-1" }) },
    );

    expect(response.status).toBe(200);
    expect(getEmailAccessibleTracking).toHaveBeenCalledWith("MG-1");
    expect(getGuestTracking).not.toHaveBeenCalled();
  });
});
