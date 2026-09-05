import { beforeEach, describe, expect, it, vi } from "vitest";

const transaction = vi.hoisted(() => ({
  order: { findUnique: vi.fn(), create: vi.fn() },
  productPriceOption: { findMany: vi.fn() },
  guestSession: { upsert: vi.fn() },
}));
const withTransaction = vi.hoisted(() =>
  vi.fn(async (operation: (database: typeof transaction) => unknown) =>
    operation(transaction),
  ),
);

vi.mock("server-only", () => ({}));
vi.mock("@/server/db/transaction", () => ({ withTransaction }));
vi.mock("@/server/db/client", () => ({
  prisma: { order: { findUnique: vi.fn() } },
}));
vi.mock("@/features/checkout/server/code-encryption", () => ({
  encryptVerificationCode: () => "encrypted-code",
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

import { GuestCheckoutService } from "@/features/checkout/server/guest-checkout-service";
import type { GuestCheckoutInput } from "@/features/checkout/schema";

const guest = {
  token: "a".repeat(43),
  tokenHash: "guest-hash",
  expiresAt: new Date("2026-12-01T00:00:00Z"),
  existing: false,
};

const input: GuestCheckoutInput = {
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
      quantity: 2,
    },
  ],
};

describe("guest order transaction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    transaction.order.findUnique.mockResolvedValue(null);
    transaction.guestSession.upsert.mockResolvedValue({
      id: "guest-session-id",
    });
    transaction.productPriceOption.findMany.mockResolvedValue([
      {
        id: input.lines[0]!.priceOptionId,
        productId: input.lines[0]!.productId,
        weightValue: 500,
        weightUnit: "G",
        currency: "EUR",
        priceMinor: 1250n,
        isActive: true,
        archivedAt: null,
        product: {
          name: "Fresh kale",
          status: "ACTIVE",
          archivedAt: null,
          category: { isActive: true, archivedAt: null },
          images: [
            {
              url: "https://res.cloudinary.com/example/cover.jpg",
              altText: "Fresh kale leaves",
              cloudinaryPublicId: "products/kale-cover",
            },
          ],
        },
      },
    ]);
    transaction.order.create.mockResolvedValue({
      reference: "MG-2026-ABC123",
      currency: "EUR",
      totalMinor: 2500n,
      status: "CONFIRMED",
      paymentStatus: "PAID",
    });
  });

  it("loads authoritative prices and creates snapshots and status event atomically", async () => {
    const result = await new GuestCheckoutService().create(input, guest);
    expect(withTransaction).toHaveBeenCalledOnce();
    expect(transaction.order.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        guestSessionId: "guest-session-id",
        customerPhone: null,
        subtotalMinor: 2500n,
        deliveryFeeMinor: 0n,
        totalMinor: 2500n,
        status: "CONFIRMED",
        paymentStatus: "PAID",
        verificationCodeEncrypted: "encrypted-code",
        items: {
          create: [
            expect.objectContaining({
              productNameSnapshot: "Fresh kale",
              productImageUrlSnapshot:
                "https://res.cloudinary.com/example/cover.jpg",
              productImageAltTextSnapshot: "Fresh kale leaves",
              productImagePublicIdSnapshot: "products/kale-cover",
              unitPriceMinor: 1250n,
              lineTotalMinor: 2500n,
              quantity: 2,
            }),
          ],
        },
        statusEvents: {
          create: expect.objectContaining({ toStatus: "CONFIRMED" }),
        },
        paymentStatusEvents: {
          create: expect.objectContaining({ toStatus: "PAID" }),
        },
      }),
      select: {
        reference: true,
        currency: true,
        totalMinor: true,
        status: true,
        paymentStatus: true,
      },
    });
    expect(result).toMatchObject({
      reference: "MG-2026-ABC123",
      totalMinor: 2500,
      status: "CONFIRMED",
      paymentStatus: "PAID",
      duplicate: false,
    });
  });

  it("stores nullable image snapshots when a product has no cover", async () => {
    const option = transaction.productPriceOption.findMany.mock.results;
    void option;
    transaction.productPriceOption.findMany.mockResolvedValue([
      {
        id: input.lines[0]!.priceOptionId,
        productId: input.lines[0]!.productId,
        weightValue: 500,
        weightUnit: "G",
        currency: "EUR",
        priceMinor: 1250n,
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
    await new GuestCheckoutService().create(input, guest);
    expect(transaction.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          items: {
            create: [
              expect.objectContaining({
                productImageUrlSnapshot: null,
                productImageAltTextSnapshot: null,
                productImagePublicIdSnapshot: null,
              }),
            ],
          },
        }),
      }),
    );
  });

  it("returns the same order for a repeated idempotency key", async () => {
    transaction.order.findUnique.mockResolvedValue({
      reference: "MG-2026-EXISTING",
      currency: "EUR",
      totalMinor: 2500n,
      status: "CONFIRMED",
      paymentStatus: "PAID",
      guestSession: { tokenHash: guest.tokenHash },
    });
    const result = await new GuestCheckoutService().create(input, guest);
    expect(transaction.productPriceOption.findMany).not.toHaveBeenCalled();
    expect(transaction.order.create).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      reference: "MG-2026-EXISTING",
      status: "CONFIRMED",
      paymentStatus: "PAID",
      duplicate: true,
    });
  });

  it("does not expose an idempotent order from another guest session", async () => {
    transaction.order.findUnique.mockResolvedValue({
      reference: "MG-2026-PRIVATE",
      currency: "EUR",
      totalMinor: 2500n,
      status: "CONFIRMED",
      paymentStatus: "PAID",
      guestSession: { tokenHash: "another-session" },
    });
    await expect(
      new GuestCheckoutService().create(input, guest),
    ).rejects.toMatchObject({ code: "ORDER_FAILED", status: 409 });
    expect(transaction.productPriceOption.findMany).not.toHaveBeenCalled();
  });

  it("rejects mixed authoritative currencies", async () => {
    const mixed = {
      ...input,
      lines: [
        ...input.lines,
        {
          productId: "15c430ef-304d-4f06-921f-a4788a9f4176",
          priceOptionId: "676626c7-4b27-4b06-8477-822d7b90878c",
          quantity: 1,
        },
      ],
    };
    transaction.productPriceOption.findMany.mockResolvedValue([
      {
        id: input.lines[0]!.priceOptionId,
        productId: input.lines[0]!.productId,
        weightValue: 500,
        weightUnit: "G",
        currency: "EUR",
        priceMinor: 1250n,
        isActive: true,
        archivedAt: null,
        product: {
          name: "Kale",
          status: "ACTIVE",
          archivedAt: null,
          category: { isActive: true, archivedAt: null },
        },
      },
      {
        id: mixed.lines[1]!.priceOptionId,
        productId: mixed.lines[1]!.productId,
        weightValue: 1,
        weightUnit: "KG",
        currency: "GBP",
        priceMinor: 900n,
        isActive: true,
        archivedAt: null,
        product: {
          name: "Beans",
          status: "ACTIVE",
          archivedAt: null,
          category: { isActive: true, archivedAt: null },
        },
      },
    ]);
    await expect(
      new GuestCheckoutService().create(mixed, guest),
    ).rejects.toMatchObject({
      code: "MIXED_CURRENCY",
      status: 409,
    });
  });
});
