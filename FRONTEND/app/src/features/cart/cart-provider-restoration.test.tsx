// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CartProvider, useCart } from "@/features/cart/cart-provider";
import { CART_STORAGE_KEY } from "@/features/cart/domain";
import type { CartValidationResult } from "@/features/cart/types";

vi.mock("@/components/ui/toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

const storedLine = {
  productId: "a06af44a-68ca-4aef-95db-321fe6fd9e11",
  priceOptionId: "a70d9361-91cd-4d47-873f-7e5780fa23cc",
  quantity: 1,
};

const confirmedCard: CartValidationResult = {
  lines: [
    {
      ...storedLine,
      key: "product:option",
      productName: "Fresh kale",
      productSlug: "fresh-kale",
      image: null,
      option: {
        id: storedLine.priceOptionId,
        weightValue: 500,
        weightUnit: "G",
        currency: "GBP",
        priceMinor: 1250,
        available: true,
      },
      available: true,
      issues: [],
    },
  ],
  itemCount: 1,
  currency: "GBP",
  currencies: ["GBP"],
  subtotalMinor: 1250,
  hasCurrencyConflict: false,
  checkoutEligible: true,
};

function StatusProbe() {
  const { status, cart } = useCart();
  return <p>{`${status}:${cart.lines.length}`}</p>;
}

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  vi.unstubAllGlobals();
});

describe("card restoration", () => {
  it("remains in loading state until a saved card is server-confirmed", async () => {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify([storedLine]));

    let completeRequest!: (value: unknown) => void;
    const pendingResponse = new Promise((resolve) => {
      completeRequest = resolve;
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(() => pendingResponse),
    );

    render(
      <CartProvider>
        <StatusProbe />
      </CartProvider>,
    );

    await waitFor(() => expect(fetch).toHaveBeenCalledOnce());
    expect(screen.getByText("loading:0")).toBeVisible();

    completeRequest({
      ok: true,
      json: async () => ({ cart: confirmedCard }),
    });

    await waitFor(() => expect(screen.getByText("ready:1")).toBeVisible());
  });
});
