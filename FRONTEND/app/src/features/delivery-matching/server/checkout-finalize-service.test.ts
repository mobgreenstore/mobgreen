import { beforeEach, describe, expect, it, vi } from "vitest";

const transaction = vi.hoisted(() => ({
  checkoutIntent: { findFirst: vi.fn(), update: vi.fn() },
  order: { findUnique: vi.fn(), create: vi.fn() },
  paymentAttempt: { create: vi.fn() },
  productPriceOption: { findMany: vi.fn() },
  specialOffer: { findMany: vi.fn() },
}));
const withTransaction = vi.hoisted(() =>
  vi.fn(async (operation: (database: typeof transaction) => unknown) =>
    operation(transaction),
  ),
);

vi.mock("@/server/db/client", () => ({ prisma: {} }));
vi.mock("@/server/db/transaction", () => ({ withTransaction }));
vi.mock("@/features/checkout/server/code-encryption", () => ({
  encryptVerificationCode: () => "encrypted-code",
  fingerprintVerificationCode: () => "fingerprint",
}));
vi.mock("@/features/order-notifications/server/service", () => ({
  createOrderNotificationEnvelope: () => null,
  createCustomerOrderNotificationEnvelope: () => null,
  dispatchOrderSubmittedNotification: async () => ({
    status: "NOT_CONFIGURED",
  }),
  dispatchCustomerOrderSubmittedNotification: async () => ({
    status: "NOT_CONFIGURED",
  }),
}));

import { CheckoutFinalizeService } from "@/features/delivery-matching/server/checkout-finalize-service";

const productId = "a70d9361-91cd-4d47-873f-7e5780fa23cc";
const priceOptionId = "ec22096c-f944-4c1f-b310-397f7221af31";
const intent = {
  id: "intent-id",
  publicId: "a".repeat(32),
  idempotencyKey: "a06af44a-68ca-4aef-95db-321fe6fd9e11",
  status: "DRIVER_SELECTED",
  customerName: "Customer Name",
  customerEmail: "customer@example.com",
  fulfillmentType: "DELIVERY",
  paymentMethod: "RECHARGE_FROM_STORE",
  rechargeProvider: null,
  cartLines: [{ productId, priceOptionId, quantity: 2 }],
  currency: "EUR",
  subtotalMinor: 2_500n,
  deliveryAddress: "1 Test Street, Dublin",
  deliveryPostalCode: "D02",
  deliveryLocality: "Dublin",
  deliveryCountryCode: "IE",
  destinationLatitude: 53.34,
  destinationLongitude: -6.26,
  destinationMapboxPlaceId: "mapbox.place.test",
  selectedCourierProfileId: "courier-mx-97",
  selectedCourierName: "Maxime97",
  selectedDistanceMeters: 1_250,
  selectedDurationSeconds: 1_100,
  expiresAt: new Date("2099-01-01T00:00:00Z"),
  order: null,
};
const guest = { id: "guest-id", tokenHash: "guest-hash" };

describe("checkout intent finalization transaction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    transaction.checkoutIntent.findFirst.mockResolvedValue(intent);
    transaction.order.findUnique.mockResolvedValue(null);
    transaction.specialOffer.findMany.mockResolvedValue([]);
    transaction.productPriceOption.findMany.mockResolvedValue([
      {
        id: priceOptionId,
        productId,
        weightValue: 500,
        weightUnit: "G",
        currency: "EUR",
        priceMinor: 1_250n,
        isActive: true,
        archivedAt: null,
        product: {
          name: "Fresh kale",
          status: "ACTIVE",
          archivedAt: null,
          category: { isActive: true, archivedAt: null },
          images: [],
        },
      },
    ]);
    transaction.order.create.mockResolvedValue({
      id: "order-id",
      reference: "MG-2026-MATCHED",
      currency: "EUR",
      totalMinor: 2_500n,
      status: "CONFIRMED",
      paymentStatus: "PAID",
    });
  });

  it("revalidates prices, snapshots the courier, and submits atomically", async () => {
    const result = await new CheckoutFinalizeService().createFromIntent(
      {
        intentId: "a".repeat(32),
        verificationCodes: ["1234567890"],
        customerNote: "",
      },
      guest,
    );
    expect(transaction.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          checkoutIntentId: "intent-id",
          courierProfileIdSnapshot: "courier-mx-97",
          courierNameSnapshot: "Maxime97",
          courierDistanceMeters: 1_250,
          courierDurationSeconds: 1_100,
          subtotalMinor: 2_500n,
          verificationCodeEncrypted: "encrypted-code",
          status: "CONFIRMED",
          paymentStatus: "PAID",
          statusEvents: {
            create: expect.objectContaining({
              toStatus: "CONFIRMED",
              note: "Order confirmed automatically after recharge code submission.",
            }),
          },
          paymentStatusEvents: {
            create: expect.objectContaining({
              toStatus: "PAID",
              note: "Recharge code submitted at checkout; payment was automatically confirmed.",
            }),
          },
        }),
      }),
    );
    expect(transaction.paymentAttempt.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        status: "APPROVED",
        confirmedAt: expect.any(Date),
        events: {
          create: expect.objectContaining({
            eventType: "RECHARGE_AUTO_CONFIRMED",
            toStatus: "APPROVED",
            metadata: expect.objectContaining({
              codeCount: 1,
              confirmation: "automatic_submission",
            }),
          }),
        },
      }),
    });
    expect(transaction.checkoutIntent.update).toHaveBeenCalledWith({
      where: { id: "intent-id" },
      data: { status: "SUBMITTED", submittedAt: expect.any(Date) },
    });
    expect(result).toMatchObject({
      reference: "MG-2026-MATCHED",
      status: "CONFIRMED",
      paymentStatus: "PAID",
      duplicate: false,
    });
  });

  it("returns the persisted automatic statuses for an already-created intent order", async () => {
    transaction.checkoutIntent.findFirst.mockResolvedValue({
      ...intent,
      order: {
        id: "order-id",
        reference: "MG-2026-EXISTING",
        currency: "EUR",
        totalMinor: 2_500n,
        status: "CONFIRMED",
        paymentStatus: "PAID",
      },
    });

    const result = await new CheckoutFinalizeService().createFromIntent(
      {
        intentId: "a".repeat(32),
        verificationCodes: ["1234567890"],
        customerNote: "",
      },
      guest,
    );

    expect(result).toEqual({
      reference: "MG-2026-EXISTING",
      status: "CONFIRMED",
      paymentStatus: "PAID",
      currency: "EUR",
      totalMinor: 2_500,
      duplicate: true,
    });
    expect(transaction.order.create).not.toHaveBeenCalled();
    expect(transaction.paymentAttempt.create).not.toHaveBeenCalled();
  });

  it("revalidates and snapshots a real special offer atomically", async () => {
    transaction.checkoutIntent.findFirst.mockResolvedValue({
      ...intent,
      cartLines: [
        {
          productId,
          priceOptionId,
          specialOfferId: "a".repeat(32),
          quantity: 1,
        },
      ],
      subtotalMinor: 2_250n,
    });
    transaction.productPriceOption.findMany.mockResolvedValue([
      {
        id: priceOptionId,
        productId,
        weightValue: 500,
        weightUnit: "G",
        currency: "EUR",
        priceMinor: 1_250n,
        costMinor: 900n,
        isActive: true,
        archivedAt: null,
        product: {
          id: productId,
          name: "Fresh kale",
          slug: "fresh-kale",
          status: "ACTIVE",
          archivedAt: null,
          category: {
            isActive: true,
            archivedAt: null,
            offerPolicy: { enabled: true, minimumMarginBps: 1500 },
          },
          images: [],
        },
      },
    ]);
    const offerEndsAt = new Date("2099-01-01T00:00:00Z");
    transaction.specialOffer.findMany.mockResolvedValue([
      {
        id: "offer-db-id",
        publicId: "a".repeat(32),
        productId,
        priceOptionId,
        currency: "EUR",
        bundleQuantity: 2,
        totalWeightGrams: 1000n,
        originalTotalMinor: 2_500n,
        discountBps: 1000,
        discountMinor: 250n,
        offerTotalMinor: 2_250n,
        status: "ACTIVE",
        startsAt: new Date("2026-01-01T00:00:00Z"),
        endsAt: offerEndsAt,
        archivedAt: null,
      },
    ]);
    transaction.order.create.mockResolvedValue({
      id: "order-id",
      reference: "MG-2026-OFFER",
      currency: "EUR",
      totalMinor: 2_250n,
      status: "CONFIRMED",
      paymentStatus: "PAID",
    });

    await new CheckoutFinalizeService().createFromIntent(
      {
        intentId: "a".repeat(32),
        verificationCodes: ["1234567890"],
        customerNote: "",
      },
      guest,
    );

    expect(transaction.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          subtotalMinor: 2_250n,
          items: {
            create: [
              expect.objectContaining({
                specialOfferId: "offer-db-id",
                weightValueSnapshot: 1000n,
                weightUnitSnapshot: "G",
                unitPriceMinor: 2_250n,
                lineTotalMinor: 2_250n,
                offerOriginalTotalMinorSnapshot: 2_500n,
                offerDiscountBpsSnapshot: 1000,
                offerDiscountMinorSnapshot: 250n,
                offerTotalMinorSnapshot: 2_250n,
                offerBundleQuantitySnapshot: 2,
                offerEndsAtSnapshot: offerEndsAt,
              }),
            ],
          },
        }),
      }),
    );
  });

  it("rejects delivery payment submission before courier selection", async () => {
    transaction.checkoutIntent.findFirst.mockResolvedValue({
      ...intent,
      status: "MATCHING",
      selectedCourierProfileId: null,
      selectedCourierName: null,
      selectedDistanceMeters: null,
      selectedDurationSeconds: null,
    });
    await expect(
      new CheckoutFinalizeService().createFromIntent(
        {
          intentId: "a".repeat(32),
          verificationCodes: ["1234567890"],
          customerNote: "",
        },
        guest,
      ),
    ).rejects.toMatchObject({ code: "INVALID_SELECTION", status: 400 });
    expect(transaction.order.create).not.toHaveBeenCalled();
  });

  it("rejects a changed authoritative price", async () => {
    transaction.productPriceOption.findMany.mockResolvedValue([
      {
        id: priceOptionId,
        productId,
        weightValue: 500,
        weightUnit: "G",
        currency: "EUR",
        priceMinor: 1_500n,
        isActive: true,
        archivedAt: null,
        product: {
          name: "Fresh kale",
          status: "ACTIVE",
          archivedAt: null,
          category: { isActive: true, archivedAt: null },
          images: [],
        },
      },
    ]);
    await expect(
      new CheckoutFinalizeService().createFromIntent(
        {
          intentId: "a".repeat(32),
          verificationCodes: ["1234567890"],
          customerNote: "",
        },
        guest,
      ),
    ).rejects.toMatchObject({ code: "CART_CHANGED", status: 409 });
  });
});
