import { beforeEach, describe, expect, it, vi } from "vitest";

const transaction = vi.hoisted(() => ({
  paymentEvent: { findUnique: vi.fn(), create: vi.fn() },
  paymentAttempt: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
  order: { create: vi.fn(), update: vi.fn() },
  deliveryTracking: { upsert: vi.fn() },
  checkoutIntent: { findFirst: vi.fn(), update: vi.fn() },
  specialOffer: { findMany: vi.fn() },
}));
const withTransaction = vi.hoisted(() =>
  vi.fn(async (operation: (tx: typeof transaction) => unknown) =>
    operation(transaction),
  ),
);
const validateCart = vi.hoisted(() => vi.fn());

vi.mock("@/server/db/transaction", () => ({ withTransaction }));
vi.mock("@/server/db/client", () => ({ prisma: {} }));
vi.mock("@/features/cart/server/cart-validation-service", () => ({
  CartValidationService: class {
    validate = validateCart;
  },
}));

const {
  applyNowPaymentsEvent,
  nextBitcoinAttemptStatus,
  prepareBitcoinAttempt,
} = await import("@/features/bitcoin/server/bitcoin-order-service");

function attempt(status = "CONFIRMING") {
  return {
    id: "attempt-1",
    status,
    expectedSatoshis: 10_000n,
    receivedSatoshis: 0n,
    orderId: "order-1",
    order: {
      reference: "MG-2026-BTC",
      status: "PENDING",
      paymentStatus: "PENDING",
      fulfillmentType: "DELIVERY",
      destinationLatitude: 3.8667,
      destinationLongitude: 11.5167,
      courierProfileIdSnapshot: "courier-1",
      courierDistanceMeters: 1_200,
      courierDurationSeconds: 900,
    },
    checkoutIntentId: "intent-1",
  };
}

const event = {
  providerInvoiceId: "invoice-1",
  providerEventId: "event-1",
  providerStatus: "finished" as const,
  receivedSatoshis: 10_000n,
  transactionId: "tx-1",
  confirmationCount: 2,
  payloadHash: "hash",
};

describe("NOWPayments settlement policy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    transaction.paymentEvent.findUnique.mockResolvedValue(null);
    transaction.paymentEvent.create.mockResolvedValue({ id: "event" });
    transaction.paymentAttempt.findFirst.mockResolvedValue(attempt());
    transaction.paymentAttempt.update.mockResolvedValue({});
    transaction.order.update.mockResolvedValue({});
    transaction.checkoutIntent.update.mockResolvedValue({});
  });

  it("classifies exact, partial, and excessive finished payments", () => {
    expect(
      nextBitcoinAttemptStatus({
        providerStatus: "finished",
        expectedSatoshis: 10_000n,
        receivedSatoshis: 10_000n,
      }),
    ).toBe("SETTLED");
    expect(
      nextBitcoinAttemptStatus({
        providerStatus: "partially_paid",
        expectedSatoshis: 10_000n,
        receivedSatoshis: 9_999n,
      }),
    ).toBe("UNDERPAID");
    expect(
      nextBitcoinAttemptStatus({
        providerStatus: "finished",
        expectedSatoshis: 10_000n,
        receivedSatoshis: 10_001n,
      }),
    ).toBe("OVERPAID");
  });

  it("confirms the pending order only after an exact finished payment", async () => {
    const result = await applyNowPaymentsEvent(event);

    expect(result.settledReference).toBe("MG-2026-BTC");
    expect(transaction.paymentAttempt.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "SETTLED" }),
      }),
    );
    expect(transaction.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "OUT_FOR_DELIVERY",
          paymentStatus: "PAID",
        }),
      }),
    );
    expect(transaction.deliveryTracking.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { orderId: "order-1" },
        create: expect.objectContaining({
          routeDistanceMeters: 1_200,
          estimatedDurationSeconds: 900,
          routeProviderId: "mob-greens-courier-simulation-v1",
        }),
      }),
    );
    expect(transaction.checkoutIntent.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "SUBMITTED" }),
      }),
    );
  });

  it("does not fulfill underpaid or overpaid attempts", async () => {
    await applyNowPaymentsEvent({ ...event, receivedSatoshis: 9_999n });
    expect(transaction.paymentAttempt.update).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "UNDERPAID" }),
      }),
    );
    expect(transaction.order.update).not.toHaveBeenCalled();

    vi.clearAllMocks();
    transaction.paymentEvent.findUnique.mockResolvedValue(null);
    transaction.paymentAttempt.findFirst.mockResolvedValue(attempt());
    await applyNowPaymentsEvent({
      ...event,
      providerEventId: "event-2",
      receivedSatoshis: 10_001n,
    });
    expect(transaction.paymentAttempt.update).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "OVERPAID" }),
      }),
    );
    expect(transaction.order.update).not.toHaveBeenCalled();
  });

  it("ignores duplicate and post-settlement callbacks", async () => {
    transaction.paymentEvent.findUnique.mockResolvedValueOnce({
      id: "existing",
    });
    await applyNowPaymentsEvent(event);
    expect(transaction.paymentAttempt.update).not.toHaveBeenCalled();

    transaction.paymentEvent.findUnique.mockResolvedValueOnce(null);
    transaction.paymentAttempt.findFirst.mockResolvedValueOnce(
      attempt("SETTLED"),
    );
    await applyNowPaymentsEvent({
      ...event,
      providerEventId: "late-event",
      providerStatus: "waiting",
      receivedSatoshis: null,
    });
    expect(transaction.paymentAttempt.update).not.toHaveBeenCalled();
    expect(transaction.order.update).not.toHaveBeenCalled();
  });

  it("does not regress a confirming attempt on a late waiting event", async () => {
    await applyNowPaymentsEvent({
      ...event,
      providerStatus: "waiting",
      receivedSatoshis: null,
    });
    expect(transaction.paymentAttempt.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "CONFIRMING" }),
      }),
    );
    expect(transaction.paymentEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          eventType: "NOWPAYMENTS_WAITING_IGNORED",
        }),
      }),
    );
  });
});

describe("Bitcoin order preparation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    transaction.checkoutIntent.findFirst.mockResolvedValue({
      id: "intent-db-1",
      publicId: "intent-public-1",
      idempotencyKey: "65a97d3b-4bb2-48ee-a4b5-7287cb420fad",
      status: "DRIVER_SELECTED",
      customerName: "Customer",
      customerEmail: "customer@example.com",
      fulfillmentType: "DELIVERY",
      paymentMethod: "BITCOIN_DEPOSIT",
      cartLines: [
        {
          productId: "a70d9361-91cd-4d47-873f-7e5780fa23cc",
          priceOptionId: "ec22096c-f944-4c1f-b310-397f7221af31",
          quantity: 1,
        },
      ],
      currency: "EUR",
      subtotalMinor: 5_001n,
      deliveryAddress: "Yaounde",
      deliveryPostalCode: null,
      deliveryLocality: "Yaounde",
      deliveryCountryCode: "CM",
      destinationLatitude: 3.86,
      destinationLongitude: 11.52,
      destinationMapboxPlaceId: "place-1",
      selectedCourierProfileId: "courier-1",
      selectedCourierName: "Courier",
      selectedDistanceMeters: 1_000,
      selectedDurationSeconds: 600,
      expiresAt: new Date(Date.now() + 10 * 60_000),
      order: null,
      paymentAttempts: [],
    });
    validateCart.mockResolvedValue({
      checkoutEligible: true,
      currency: "EUR",
      subtotalMinor: 5_001,
      lines: [
        {
          productId: "a70d9361-91cd-4d47-873f-7e5780fa23cc",
          priceOptionId: "ec22096c-f944-4c1f-b310-397f7221af31",
          quantity: 1,
          specialOfferId: undefined,
          available: true,
          productName: "Product",
          image: null,
          option: {
            weightValue: 1,
            weightUnit: "G",
            currency: "EUR",
            priceMinor: 5_001,
          },
          offer: null,
        },
      ],
    });
    transaction.order.create.mockResolvedValue({
      id: "order-1",
      reference: "MG-2026-BTC",
    });
    transaction.paymentAttempt.create.mockResolvedValue({
      id: "attempt-1",
      publicId: "attempt-public-1",
      providerInvoiceId: null,
      paymentAddress: null,
      expectedSatoshis: null,
      depositMinor: 2_501n,
      cashBalanceDueMinor: 2_500n,
      status: "CREATED",
      expiresAt: null,
      order: { reference: "MG-2026-BTC" },
    });
  });

  it("snapshots a pending order before requesting a provider invoice", async () => {
    const result = await prepareBitcoinAttempt("intent-public-1", "guest-1");

    expect(result.created).toBe(true);
    expect(result.invoice.depositMinor).toBe(2_501);
    expect(transaction.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "PENDING",
          paymentStatus: "PENDING",
          paymentMethod: "BITCOIN_DEPOSIT",
        }),
      }),
    );
    expect(transaction.paymentAttempt.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          orderId: "order-1",
          depositMinor: 2_501n,
          cashBalanceDueMinor: 2_500n,
          status: "CREATED",
        }),
      }),
    );
  });
});
