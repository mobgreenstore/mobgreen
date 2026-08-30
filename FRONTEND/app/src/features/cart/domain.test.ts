import { describe, expect, it } from "vitest";
import {
  CART_STORAGE_KEY,
  addCartLine,
  cartLineKey,
  clearCart,
  readStoredCart,
  removeCartLine,
  updateCartLineQuantity,
  writeStoredCart,
} from "@/features/cart/domain";

const first = {
  productId: "a06af44a-68ca-4aef-95db-321fe6fd9e11",
  priceOptionId: "a70d9361-91cd-4d47-873f-7e5780fa23cc",
  quantity: 1,
};

describe("cart domain", () => {
  it("identifies a line by product and price option", () => {
    expect(cartLineKey(first)).toBe(
      "a06af44a-68ca-4aef-95db-321fe6fd9e11:a70d9361-91cd-4d47-873f-7e5780fa23cc:standard",
    );
  });

  it("keeps standard and special-offer selections as distinct lines", () => {
    const offer = { ...first, specialOfferId: "a".repeat(32) };
    expect(cartLineKey(offer)).toBe(
      first.productId + ":" + first.priceOptionId + ":" + "a".repeat(32),
    );
    expect(addCartLine([first], offer)).toEqual([first, offer]);
  });

  it("adds or increments the exact product-option line", () => {
    expect(addCartLine([], first)).toEqual([first]);
    expect(addCartLine([first], first)).toEqual([{ ...first, quantity: 2 }]);
    expect(
      addCartLine([first], {
        productId: first.productId,
        priceOptionId: "ec22096c-f944-4c1f-b310-397f7221af31",
      }),
    ).toHaveLength(2);
  });

  it("updates, removes, and clears lines without changing identity", () => {
    const key = cartLineKey(first);
    expect(updateCartLineQuantity([first], key, 8)[0]?.quantity).toBe(8);
    expect(removeCartLine([first], key)).toEqual([]);
    expect(clearCart()).toEqual([]);
  });

  it("persists only identifiers and quantities", () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    };
    writeStoredCart(storage, [first]);
    expect(JSON.parse(values.get(CART_STORAGE_KEY) ?? "null")).toEqual([first]);
    expect(readStoredCart(storage)).toEqual([first]);
  });

  it("recovers safely from malformed or price-bearing storage", () => {
    const storage = {
      getItem: () =>
        JSON.stringify([{ ...first, priceMinor: 1, currency: "USD" }]),
    };
    expect(readStoredCart(storage)).toEqual([]);
  });
});
