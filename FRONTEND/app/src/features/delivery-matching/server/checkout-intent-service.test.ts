import { beforeEach, describe, expect, it, vi } from "vitest";

const validateCart = vi.hoisted(() => vi.fn());

const checkoutIntent = vi.hoisted(() => ({
  findFirst: vi.fn(),
  update: vi.fn(),
  updateMany: vi.fn(),
}));

vi.mock("@/features/cart/server/cart-validation-service", () => ({
  CartValidationService: class {
    validate = validateCart;
  },
}));
vi.mock("@/features/cart/server/prisma-cart-repository", () => ({
  PrismaCartRepository: class {},
}));
vi.mock("@/server/db/client", () => ({
  prisma: { checkoutIntent },
}));
vi.mock("@/server/location/verification", () => ({
  verifyLocationCandidate: vi.fn(),
}));

import {
  CheckoutIntentService,
  checkoutIntentView,
} from "@/features/delivery-matching/server/checkout-intent-service";

const candidateSet = [
  {
    candidateId: "candidate_mx_97_secure_01",
    profileId: "courier-mx-97",
    displayName: "Maxime97",
    distanceMeters: 1_250,
    estimatedDurationSeconds: 1_100,
  },
];

describe("checkout intent ownership and courier selection", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns no intent across guest-session boundaries", async () => {
    checkoutIntent.findFirst.mockResolvedValue(null);
    await expect(
      new CheckoutIntentService().getForGuest("guest-a", "a".repeat(32)),
    ).resolves.toBeNull();
    expect(checkoutIntent.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { publicId: "a".repeat(32), guestSessionId: "guest-a" },
      }),
    );
  });

  it("rejects a profile not present in the server candidate set", async () => {
    checkoutIntent.findFirst.mockResolvedValue({
      id: "intent-id",
      status: "MATCHING",
      expiresAt: new Date("2099-01-01T00:00:00Z"),
      candidateSet,
    });
    await expect(
      new CheckoutIntentService().selectCourier("guest-a", {
        intentId: "a".repeat(32),
        courierCandidateId: "candidate_forged_secure_01",
      }),
    ).rejects.toMatchObject({ code: "INVALID_SELECTION", status: 400 });
    expect(checkoutIntent.update).not.toHaveBeenCalled();
  });

  it("rejects selection across guest-session boundaries", async () => {
    checkoutIntent.findFirst.mockResolvedValue(null);
    await expect(
      new CheckoutIntentService().selectCourier("guest-b", {
        intentId: "a".repeat(32),
        courierCandidateId: "candidate_mx_97_secure_01",
      }),
    ).rejects.toMatchObject({ code: "INTENT_NOT_FOUND", status: 404 });
    expect(checkoutIntent.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ guestSessionId: "guest-b" }),
      }),
    );
    expect(checkoutIntent.update).not.toHaveBeenCalled();
  });

  it("rejects an expired candidate set", async () => {
    checkoutIntent.findFirst.mockResolvedValue({
      id: "intent-id",
      status: "MATCHING",
      expiresAt: new Date("2020-01-01T00:00:00Z"),
      candidateSet,
    });
    await expect(
      new CheckoutIntentService().selectCourier("guest-a", {
        intentId: "a".repeat(32),
        courierCandidateId: "candidate_mx_97_secure_01",
      }),
    ).rejects.toMatchObject({ code: "INTENT_EXPIRED", status: 410 });
    expect(checkoutIntent.update).not.toHaveBeenCalled();
  });

  it("rejects candidate reuse after the checkout was submitted", async () => {
    checkoutIntent.findFirst.mockResolvedValue({
      id: "intent-id",
      status: "SUBMITTED",
      expiresAt: new Date("2099-01-01T00:00:00Z"),
      candidateSet,
    });
    await expect(
      new CheckoutIntentService().selectCourier("guest-a", {
        intentId: "a".repeat(32),
        courierCandidateId: "candidate_mx_97_secure_01",
      }),
    ).rejects.toMatchObject({ code: "INTENT_EXPIRED", status: 410 });
    expect(checkoutIntent.update).not.toHaveBeenCalled();
  });

  it("copies only server-owned candidate metrics into the intent", async () => {
    checkoutIntent.findFirst.mockResolvedValue({
      id: "intent-id",
      status: "MATCHING",
      expiresAt: new Date("2099-01-01T00:00:00Z"),
      candidateSet,
    });
    checkoutIntent.update.mockResolvedValue({
      publicId: "a".repeat(32),
      status: "DRIVER_SELECTED",
      fulfillmentType: "DELIVERY",
      paymentMethod: "RECHARGE_FROM_STORE",
      rechargeProvider: null,
      currency: "EUR",
      subtotalMinor: 2_500n,
      deliveryAddress: "Dublin, Ireland",
      deliveryPostalCode: "D02",
      deliveryLocality: "Dublin",
      deliveryCountryCode: "IE",
      candidateSet,
      selectedCourierProfileId: "courier-mx-97",
      selectedCourierName: "Maxime97",
      selectedDistanceMeters: 1_250,
      selectedDurationSeconds: 1_100,
      expiresAt: new Date("2099-01-01T00:00:00Z"),
    });
    const result = await new CheckoutIntentService().selectCourier("guest-a", {
      intentId: "a".repeat(32),
      courierCandidateId: "candidate_mx_97_secure_01",
    });
    expect(checkoutIntent.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          selectedCourierName: "Maxime97",
          selectedDistanceMeters: 1_250,
          selectedDurationSeconds: 1_100,
        }),
      }),
    );
    expect(result.selectedCourier).toEqual({
      candidateId: "candidate_mx_97_secure_01",
      displayName: "Maxime97",
      distanceMeters: 1_250,
      estimatedDurationSeconds: 1_100,
    });
    expect(result.selectedCourier).not.toHaveProperty("profileId");
  });

  it("exposes expired intent state without leaking private fields", () => {
    const result = checkoutIntentView({
      publicId: "a".repeat(32),
      status: "MATCHING",
      fulfillmentType: "DELIVERY",
      paymentMethod: "RECHARGE_ONLINE",
      rechargeProvider: "dundle",
      currency: "EUR",
      subtotalMinor: 2_500n,
      deliveryAddress: "Dublin, Ireland",
      deliveryPostalCode: "D02",
      deliveryLocality: "Dublin",
      deliveryCountryCode: "IE",
      candidateSet,
      selectedCourierProfileId: null,
      selectedCourierName: null,
      selectedDistanceMeters: null,
      selectedDurationSeconds: null,
      expiresAt: new Date("2020-01-01T00:00:00Z"),
    });
    expect(result.status).toBe("EXPIRED");
    expect(result).not.toHaveProperty("customerEmail");
  });

  it("builds confirmation details from the server-owned intent and cart", async () => {
    checkoutIntent.findFirst.mockResolvedValue({
      publicId: "a".repeat(32),
      status: "DRIVER_SELECTED",
      fulfillmentType: "DELIVERY",
      paymentMethod: "RECHARGE_ONLINE",
      rechargeProvider: "dundle",
      currency: "EUR",
      subtotalMinor: 2_500n,
      customerName: "Pericles Ngon",
      customerEmail: "customer@example.com",
      cartLines: [
        {
          productId: "124bf462-6765-451c-8db8-d47976ec9595",
          priceOptionId: "224bf462-6765-451c-8db8-d47976ec9595",
          quantity: 2,
        },
      ],
      deliveryAddress: "Dublin, Ireland",
      deliveryPostalCode: "D02",
      deliveryLocality: "Dublin",
      deliveryCountryCode: "IE",
      candidateSet,
      selectedCourierProfileId: "courier-mx-97",
      selectedCourierName: "Maxime97",
      selectedDistanceMeters: 1_250,
      selectedDurationSeconds: 1_100,
      expiresAt: new Date("2099-01-01T00:00:00Z"),
    });
    validateCart.mockResolvedValue({
      checkoutEligible: true,
      currency: "EUR",
      subtotalMinor: 2_500,
      itemCount: 2,
      lines: [
        {
          key: "product-1:option-1",
          productName: "Real product",
          image: null,
          quantity: 2,
          option: {
            weightValue: 100,
            weightUnit: "G",
            priceMinor: 1_250,
          },
          offer: null,
        },
      ],
    });

    const result = await new CheckoutIntentService().getConfirmationForGuest(
      "guest-a",
      "a".repeat(32),
    );

    expect(result).toMatchObject({
      customer: { name: "Pericles Ngon", email: "customer@example.com" },
      itemCount: 2,
      confirmationEligible: true,
      lines: [
        {
          productName: "Real product",
          quantity: 2,
          lineTotalMinor: 2_500,
        },
      ],
    });
    expect(checkoutIntent.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { publicId: "a".repeat(32), guestSessionId: "guest-a" },
      }),
    );
  });
});
