// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { CartValidationResult } from "@/features/cart/types";

const useCart = vi.hoisted(() => vi.fn());
vi.mock("@/features/cart/cart-provider", () => ({ useCart }));

import { CartPage } from "@/features/cart/components/cart-page";

afterEach(cleanup);

const cart: CartValidationResult = {
  lines: [
    {
      key: "product:option",
      productId: "a06af44a-68ca-4aef-95db-321fe6fd9e11",
      priceOptionId: "a70d9361-91cd-4d47-873f-7e5780fa23cc",
      quantity: 2,
      productName: "Fresh kale",
      productSlug: "fresh-kale",
      image: null,
      option: {
        id: "a70d9361-91cd-4d47-873f-7e5780fa23cc",
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
  itemCount: 2,
  currency: "GBP",
  currencies: ["GBP"],
  subtotalMinor: 2500,
  hasCurrencyConflict: false,
  checkoutEligible: true,
};

function context(overrides = {}) {
  return {
    storedLines: [],
    cart,
    status: "ready",
    error: null,
    itemCount: 2,
    addItem: vi.fn(),
    updateQuantity: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    refresh: vi.fn(),
    ...overrides,
  };
}

describe("cart page", () => {
  it("renders only current server-confirmed prices", () => {
    useCart.mockReturnValue(context());
    render(<CartPage />);
    expect(screen.getAllByText("£25.00")).toHaveLength(3);
    expect(screen.getByText(/prices confirmed by the store/i)).toBeVisible();
  });

  it("requires confirmation before removing a line", () => {
    const removeItem = vi.fn();
    useCart.mockReturnValue(context({ removeItem }));
    render(<CartPage />);
    fireEvent.click(screen.getByRole("button", { name: "Remove Fresh kale" }));
    expect(
      screen.getByRole("heading", { name: "Remove this item?" }),
    ).toBeVisible();
    expect(removeItem).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Remove item" }));
    expect(removeItem).toHaveBeenCalledWith("product:option");
  });

  it("offers recovery when validation fails", () => {
    const refresh = vi.fn();
    useCart.mockReturnValue(
      context({
        cart: { ...cart, lines: [] },
        status: "error",
        error: "Current prices could not be confirmed.",
        refresh,
      }),
    );
    render(<CartPage />);
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(refresh).toHaveBeenCalled();
  });
});
