import { describe, expect, it } from "vitest";
import type {
  CartOfferRecord,
  CartPriceRecord,
  CartRepository,
} from "@/features/cart/server/cart-repository";
import { CartValidationService } from "@/features/cart/server/cart-validation-service";

const productId = "a06af44a-68ca-4aef-95db-321fe6fd9e11";
const optionId = "a70d9361-91cd-4d47-873f-7e5780fa23cc";

function record(overrides: Partial<CartPriceRecord> = {}): CartPriceRecord {
  return {
    id: optionId,
    productId,
    weightValue: 500,
    weightUnit: "G",
    currency: "GBP",
    priceMinor: 1250n,
    isActive: true,
    archivedAt: null,
    product: {
      id: productId,
      name: "Fresh kale",
      slug: "fresh-kale",
      status: "ACTIVE",
      archivedAt: null,
      categoryActive: true,
      categoryArchivedAt: null,
      image: null,
    },
    ...overrides,
  };
}

function offer(
  priceOption: CartPriceRecord,
  overrides: Partial<CartOfferRecord> = {},
): CartOfferRecord {
  return {
    id: "offer-db-id",
    publicId: "a".repeat(32),
    productId,
    priceOptionId: optionId,
    currency: "GBP",
    bundleQuantity: 2,
    totalWeightGrams: 1000,
    originalTotalMinor: 2500n,
    discountBps: 1000,
    discountMinor: 250n,
    offerTotalMinor: 2250n,
    status: "ACTIVE",
    startsAt: new Date("2026-01-01T00:00:00Z"),
    endsAt: new Date("2099-01-01T00:00:00Z"),
    archivedAt: null,
    priceOption,
    ...overrides,
  };
}

function service(records: CartPriceRecord[], offers: CartOfferRecord[] = []) {
  const repository: CartRepository = {
    findPriceOptions: async () => records,
    findOffers: async () => offers,
  };
  return new CartValidationService(repository);
}

describe("cart server validation", () => {
  it("uses the current database price to calculate totals", async () => {
    const result = await service([record()]).validate([
      { productId, priceOptionId: optionId, quantity: 2 },
    ]);
    expect(result).toMatchObject({
      subtotalMinor: 2500,
      currency: "GBP",
      itemCount: 2,
      checkoutEligible: true,
    });
    expect(result.lines[0]?.option?.priceMinor).toBe(1250);
  });

  it("marks inactive products and options unavailable", async () => {
    const result = await service([
      record({
        isActive: false,
        product: { ...record().product, status: "ARCHIVED" },
      }),
    ]).validate([{ productId, priceOptionId: optionId, quantity: 1 }]);
    expect(result.checkoutEligible).toBe(false);
    expect(result.lines[0]).toMatchObject({
      available: false,
      issues: expect.arrayContaining([
        expect.objectContaining({ code: "PRODUCT_UNAVAILABLE" }),
        expect.objectContaining({ code: "OPTION_UNAVAILABLE" }),
      ]),
    });
  });

  it("rejects a product-option identity mismatch", async () => {
    const result = await service([
      record({ productId: "dcf02e60-c7ea-4b35-aa40-9fa9d67bfae2" }),
    ]).validate([{ productId, priceOptionId: optionId, quantity: 1 }]);
    expect(result.lines[0]?.issues[0]?.code).toBe("PRODUCT_MISMATCH");
  });

  it("enforces the single-currency cart rule", async () => {
    const secondOption = "ec22096c-f944-4c1f-b310-397f7221af31";
    const result = await service([
      record(),
      record({ id: secondOption, currency: "EUR" }),
    ]).validate([
      { productId, priceOptionId: optionId, quantity: 1 },
      { productId, priceOptionId: secondOption, quantity: 1 },
    ]);
    expect(result).toMatchObject({
      hasCurrencyConflict: true,
      currency: null,
      subtotalMinor: null,
      checkoutEligible: false,
    });
  });
  it("uses the authoritative offer total and bundle weight", async () => {
    const price = record({
      costMinor: 900n,
      product: {
        ...record().product,
        offerPolicy: { enabled: true, minimumMarginBps: 1500 },
      },
    });
    const result = await service([price], [offer(price)]).validate([
      {
        productId,
        priceOptionId: optionId,
        specialOfferId: "a".repeat(32),
        quantity: 2,
      },
    ]);
    expect(result).toMatchObject({
      subtotalMinor: 4500,
      currency: "GBP",
      checkoutEligible: true,
    });
    expect(result.lines[0]).toMatchObject({
      available: true,
      option: { priceMinor: 2250, weightValue: 1000, weightUnit: "G" },
      offer: { discountBps: 1000, bundleQuantity: 2 },
    });
  });

  it("rejects expired, forged, changed, and margin-unsafe offers", async () => {
    const safePrice = record({
      costMinor: 900n,
      product: {
        ...record().product,
        offerPolicy: { enabled: true, minimumMarginBps: 1500 },
      },
    });
    const line = {
      productId,
      priceOptionId: optionId,
      specialOfferId: "a".repeat(32),
      quantity: 1,
    };
    const expired = await service(
      [safePrice],
      [offer(safePrice, { endsAt: new Date("2020-01-01T00:00:00Z") })],
    ).validate([line]);
    expect(expired.lines[0]?.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "OFFER_EXPIRED" }),
      ]),
    );

    const forged = await service(
      [safePrice],
      [offer(safePrice, { productId: "dcf02e60-c7ea-4b35-aa40-9fa9d67bfae2" })],
    ).validate([line]);
    expect(forged.lines[0]?.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "PRODUCT_MISMATCH" }),
      ]),
    );

    const changedPrice = record({
      ...safePrice,
      priceMinor: 1300n,
    });
    const changed = await service(
      [changedPrice],
      [offer(changedPrice)],
    ).validate([line]);
    expect(changed.lines[0]?.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "OFFER_CHANGED" }),
      ]),
    );

    const unsafePrice = record({
      costMinor: 1100n,
      product: {
        ...record().product,
        offerPolicy: { enabled: true, minimumMarginBps: 1500 },
      },
    });
    const unsafe = await service([unsafePrice], [offer(unsafePrice)]).validate([
      line,
    ]);
    expect(unsafe.lines[0]?.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "OFFER_MARGIN_UNSAFE" }),
      ]),
    );
  });
});
