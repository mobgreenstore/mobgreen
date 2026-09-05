import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getOrderEmailAccess = vi.hoisted(() => vi.fn());
const setOrderEmailAccessCookie = vi.hoisted(() => vi.fn());

vi.mock("@/features/customer-orders/server/order-email-access", () => ({
  getOrderEmailAccess,
  setOrderEmailAccessCookie,
}));

const route = await import("@/app/(store)/order-access/[reference]/route");

describe("order email access route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("stores validated access in an HttpOnly path-safe cookie before redirecting to tracking", async () => {
    const access = {
      token: "signed-token",
      tokenHash: "hash",
      expiresAt: new Date("2026-12-01T00:00:00.000Z"),
    };
    getOrderEmailAccess.mockReturnValue(access);
    const response = await route.GET(
      new NextRequest(
        "https://mobgreen.store/order-access/MG-1?token=signed-token&next=tracking",
      ),
      { params: Promise.resolve({ reference: "MG-1" }) },
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "https://mobgreen.store/orders/MG-1/tracking",
    );
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
    expect(setOrderEmailAccessCookie).toHaveBeenCalledWith(
      response,
      "MG-1",
      access,
    );
  });

  it("does not disclose whether an order exists for an invalid token", async () => {
    getOrderEmailAccess.mockReturnValue(null);
    const response = await route.GET(
      new NextRequest("https://mobgreen.store/order-access/MG-1?token=nope"),
      { params: Promise.resolve({ reference: "MG-1" }) },
    );

    expect(response.status).toBe(404);
    expect(setOrderEmailAccessCookie).not.toHaveBeenCalled();
  });
});
