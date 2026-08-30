import {
  CART_MAX_LINES,
  CART_MAX_QUANTITY,
  storedCartLinesSchema,
} from "@/features/cart/schema";
import type { StoredCartLine } from "@/features/cart/types";

export const CART_STORAGE_KEY = "mob-greens-cart";

export function cartLineKey(
  line: Pick<StoredCartLine, "productId" | "priceOptionId" | "specialOfferId">,
) {
  return `${line.productId}:${line.priceOptionId}:${line.specialOfferId ?? "standard"}`;
}

export function addCartLine(
  lines: readonly StoredCartLine[],
  selection: Pick<
    StoredCartLine,
    "productId" | "priceOptionId" | "specialOfferId"
  >,
): StoredCartLine[] {
  const identity = cartLineKey(selection);
  const existing = lines.find((line) => cartLineKey(line) === identity);
  if (existing) {
    return lines.map((line) =>
      cartLineKey(line) === identity
        ? {
            ...line,
            quantity: Math.min(line.quantity + 1, CART_MAX_QUANTITY),
          }
        : line,
    );
  }
  if (lines.length >= CART_MAX_LINES) return [...lines];
  return [...lines, { ...selection, quantity: 1 }];
}

export function updateCartLineQuantity(
  lines: readonly StoredCartLine[],
  identity: string,
  quantity: number,
): StoredCartLine[] {
  const safeQuantity = Math.min(
    Math.max(Math.trunc(quantity), 1),
    CART_MAX_QUANTITY,
  );
  return lines.map((line) =>
    cartLineKey(line) === identity ? { ...line, quantity: safeQuantity } : line,
  );
}

export function removeCartLine(
  lines: readonly StoredCartLine[],
  identity: string,
): StoredCartLine[] {
  return lines.filter((line) => cartLineKey(line) !== identity);
}

export function clearCart(): StoredCartLine[] {
  return [];
}

export function readStoredCart(storage: Pick<Storage, "getItem">) {
  try {
    const value = storage.getItem(CART_STORAGE_KEY);
    if (!value) return [];
    const parsed = storedCartLinesSchema.safeParse(JSON.parse(value));
    return parsed.success ? parsed.data : [];
  } catch {
    return [];
  }
}

export function writeStoredCart(
  storage: Pick<Storage, "setItem" | "removeItem">,
  lines: readonly StoredCartLine[],
) {
  if (lines.length === 0) {
    storage.removeItem(CART_STORAGE_KEY);
    return;
  }
  storage.setItem(CART_STORAGE_KEY, JSON.stringify(lines));
}
