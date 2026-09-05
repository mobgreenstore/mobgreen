import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const create = vi.hoisted(() => vi.fn());
const consume = vi.hoisted(() => vi.fn());

vi.mock("@/features/checkout/server/guest-checkout-service", () => ({
  GuestCheckoutService: class {
    create = create;
  },
  CheckoutError: class CheckoutError extends Error {
    constructor(
      readonly code: string,
      message: string,
      readonly status: number,
    ) {
      super(message);
    }
  },
}));
vi.mock("@/server/guest-session", () => ({
  prepareGuestSession: () => ({
    token: "a".repeat(43),
    tokenHash: "hash",
    expiresAt: new Date("2026-12-01T00:00:00Z"),
    existing: false,
  }),
  setGuestSessionCookie: vi.fn(),
}));
vi.mock("@/features/checkout/server/rate-limit", () => ({
  checkoutThrottleKey: () => "hashed-key",
  consumeCheckoutAttempt: consume,
}));

const route = await import("@/app/api/orders/route");

const input = {
  idempotencyKey: "a06af44a-68ca-4aef-95db-321fe6fd9e11",
  customerName: "Customer Name",
  customerEmail: "customer@example.com",
  fulfillmentType: "PICKUP",
  paymentMethod: "RECHARGE_FROM_STORE",
  rechargeProvider: null,
  verificationCode: "1234567890123456",
  customerNote: "",
  lines: [
    {
      productId: "a70d9361-91cd-4d47-873f-7e5780fa23cc",
      priceOptionId: "ec22096c-f944-4c1f-b310-397f7221af31",
      quantity: 1,
    },
  ],
};

describe("guest order route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    consume.mockResolvedValue(true);
  });

  it("creates a real anonymous order and returns its reference", async () => {
    create.mockResolvedValue({
      reference: "MG-2026-ABC",
      status: "CONFIRMED",
      paymentStatus: "PAID",
      currency: "EUR",
      totalMinor: 1000,
      duplicate: false,
    });
    const response = await route.POST(
      new NextRequest("http://localhost/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      }),
    );
    expect(response.status).toBe(201);
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        customerEmail: "customer@example.com",
        lines: input.lines,
      }),
      expect.objectContaining({ tokenHash: "hash" }),
    );
    expect(await response.json()).toMatchObject({
      order: {
        reference: "MG-2026-ABC",
        status: "CONFIRMED",
        paymentStatus: "PAID",
      },
    });
  });

  it("rate limits before order creation", async () => {
    consume.mockResolvedValue(false);
    const response = await route.POST(
      new NextRequest("http://localhost/api/orders", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    );
    expect(response.status).toBe(429);
    expect(create).not.toHaveBeenCalled();
  });

  it("returns field errors for invalid guest details", async () => {
    const response = await route.POST(
      new NextRequest("http://localhost/api/orders", {
        method: "POST",
        body: JSON.stringify({ ...input, customerEmail: "not-email" }),
      }),
    );
    expect(response.status).toBe(400);
    expect((await response.json()).fieldErrors.customerEmail).toBeDefined();
  });

  it("returns the existing order for an idempotent retry", async () => {
    create.mockResolvedValue({
      reference: "MG-2026-EXISTING",
      status: "CONFIRMED",
      paymentStatus: "PAID",
      currency: "EUR",
      totalMinor: 1000,
      duplicate: true,
    });
    const response = await route.POST(
      new NextRequest("http://localhost/api/orders", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    );
    expect(response.status).toBe(200);
  });
});
