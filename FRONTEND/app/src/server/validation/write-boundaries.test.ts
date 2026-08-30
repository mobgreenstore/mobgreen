import { describe, expect, it } from "vitest";
import {
  createOrderSchema,
  createProductSchema,
  updateStoreSettingsSchema,
} from "@/server/validation";

describe("write-boundary schemas", () => {
  it("rejects an active product without an active price option", () => {
    const result = createProductSchema.safeParse({
      categoryId: "124bf462-6765-451c-8db8-d47976ec9595",
      name: "Fresh spinach",
      slug: "fresh-spinach",
      shortDescription: "Freshly selected spinach.",
      status: "ACTIVE",
      images: [],
      priceOptions: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects inconsistent order totals before persistence", () => {
    const result = createOrderSchema.safeParse({
      reference: "MG-000001",
      customerName: "Anonymous customer",
      customerPhone: "+237600000000",
      fulfillmentType: "PICKUP",
      currency: "EUR",
      subtotalMinor: 500n,
      deliveryFeeMinor: 0n,
      totalMinor: 400n,
      paymentMethod: "RECHARGE_ONLINE",
      items: [
        {
          productNameSnapshot: "Fresh spinach",
          weightValueSnapshot: 500,
          weightUnitSnapshot: "GRAM",
          currencySnapshot: "EUR",
          unitPriceMinor: 500n,
          quantity: 1,
          lineTotalMinor: 500n,
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("normalizes central store settings", () => {
    const result = updateStoreSettingsSchema.parse({
      storeName: " MOB GREENS ",
      supportedCurrencyCodes: ["GBP", "EUR"],
      orderPrefix: "mg",
      deliveryEnabled: true,
    });
    expect(result.storeName).toBe("MOB GREENS");
    expect(result.orderPrefix).toBe("MG");
  });
});
