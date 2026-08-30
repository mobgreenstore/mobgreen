import { beforeEach, describe, expect, it, vi } from "vitest";

const validate = vi.hoisted(() => vi.fn());

vi.mock("@/features/cart/server/prisma-cart-repository", () => ({
  PrismaCartRepository: class {},
}));
vi.mock("@/features/cart/server/cart-validation-service", () => ({
  CartValidationService: class {
    validate = validate;
  },
}));

const route = await import("@/app/api/cart/validate/route");

const line = {
  productId: "a06af44a-68ca-4aef-95db-321fe6fd9e11",
  priceOptionId: "a70d9361-91cd-4d47-873f-7e5780fa23cc",
  quantity: 1,
};

describe("public cart validation route", () => {
  beforeEach(() => {
    validate.mockReset();
  });

  it("passes identifiers and quantities to server validation", async () => {
    validate.mockResolvedValue({
      lines: [],
      itemCount: 0,
      currency: null,
      currencies: [],
      subtotalMinor: 0,
      hasCurrencyConflict: false,
      checkoutEligible: false,
    });
    const response = await route.POST(
      new Request("http://localhost/api/cart/validate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ lines: [line] }),
      }),
    );
    expect(response.status).toBe(200);
    expect(validate).toHaveBeenCalledWith([line]);
  });

  it("rejects browser prices before reaching the service", async () => {
    const response = await route.POST(
      new Request("http://localhost/api/cart/validate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          lines: [{ ...line, priceMinor: 1, currency: "USD" }],
        }),
      }),
    );
    expect(response.status).toBe(400);
    expect(validate).not.toHaveBeenCalled();
  });

  it("rejects oversized requests", async () => {
    const response = await route.POST(
      new Request("http://localhost/api/cart/validate", {
        method: "POST",
        headers: { "content-length": String(17 * 1024) },
      }),
    );
    expect(response.status).toBe(413);
    expect(validate).not.toHaveBeenCalled();
  });

  it("returns a generic server error", async () => {
    validate.mockRejectedValue(new Error("database detail"));
    const response = await route.POST(
      new Request("http://localhost/api/cart/validate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ lines: [line] }),
      }),
    );
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: "The cart could not be refreshed. Try again.",
      code: "CART_REFRESH_FAILED",
    });
  });
});
