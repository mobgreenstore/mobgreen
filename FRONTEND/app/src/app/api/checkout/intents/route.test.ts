import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const create = vi.hoisted(() => vi.fn());
const consume = vi.hoisted(() => vi.fn());
const setCookie = vi.hoisted(() => vi.fn());

vi.mock("@/features/delivery-matching/server/checkout-intent-service", () => ({
  CheckoutIntentService: class {
    create = create;
  },
  CheckoutIntentError: class CheckoutIntentError extends Error {
    constructor(
      readonly code: string,
      message: string,
      readonly status: number,
    ) {
      super(message);
    }
  },
}));
vi.mock("@/features/checkout/server/rate-limit", () => ({
  checkoutThrottleKey: () => "hashed-key",
  consumeCheckoutAttempt: consume,
}));
vi.mock("@/server/guest-session", () => ({
  prepareGuestSession: () => ({
    token: "a".repeat(43),
    tokenHash: "guest-hash",
    expiresAt: new Date("2026-12-01T00:00:00Z"),
    existing: false,
  }),
  setGuestSessionCookie: setCookie,
}));

const route = await import("@/app/api/checkout/intents/route");

const input = {
  idempotencyKey: "a06af44a-68ca-4aef-95db-321fe6fd9e11",
  customerName: "Customer Name",
  customerEmail: "customer@example.com",
  fulfillmentType: "DELIVERY",
  paymentMethod: "RECHARGE_FROM_STORE",
  rechargeProvider: null,
  deliveryLocation: null,
  lines: [
    {
      productId: "a70d9361-91cd-4d47-873f-7e5780fa23cc",
      priceOptionId: "ec22096c-f944-4c1f-b310-397f7221af31",
      quantity: 1,
    },
  ],
};

describe("checkout intent route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    consume.mockResolvedValue(true);
  });

  it("creates a guest-owned delivery intent without starting matching", async () => {
    create.mockResolvedValue({
      publicId: "a".repeat(32),
      fulfillmentType: "DELIVERY",
      status: "DRAFT",
      location: null,
    });
    const response = await route.POST(
      new NextRequest("http://localhost/api/checkout/intents", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      }),
    );
    expect(response.status).toBe(201);
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ fulfillmentType: "DELIVERY" }),
      expect.objectContaining({ tokenHash: "guest-hash" }),
    );
    expect(setCookie).toHaveBeenCalledOnce();
  });

  it("rate limits before creating an intent", async () => {
    consume.mockResolvedValue(false);
    const response = await route.POST(
      new NextRequest("http://localhost/api/checkout/intents", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    );
    expect(response.status).toBe(429);
    expect(create).not.toHaveBeenCalled();
  });

  it("rejects browser-controlled fields at the write boundary", async () => {
    const response = await route.POST(
      new NextRequest("http://localhost/api/checkout/intents", {
        method: "POST",
        body: JSON.stringify({ ...input, courierDistanceMeters: 1 }),
      }),
    );
    expect(response.status).toBe(400);
    expect(create).not.toHaveBeenCalled();
  });
});
