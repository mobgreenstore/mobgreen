// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const addItem = vi.hoisted(() => vi.fn());
vi.mock("@/features/cart/cart-provider", () => ({
  useCart: () => ({ addItem }),
}));

import { ProductOptionPanel } from "@/features/catalog/components/product-option-panel";

afterEach(cleanup);

describe("product cart action", () => {
  it("adds the selected real product-option identity", async () => {
    addItem.mockResolvedValue(true);
    render(
      <ProductOptionPanel
        productId="a06af44a-68ca-4aef-95db-321fe6fd9e11"
        options={[
          {
            id: "a70d9361-91cd-4d47-873f-7e5780fa23cc",
            weightValue: 500,
            weightUnit: "G",
            currency: "GBP",
            priceMinor: 1250,
            available: true,
          },
        ]}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Add to cart" }));
    await waitFor(() =>
      expect(addItem).toHaveBeenCalledWith(
        "a06af44a-68ca-4aef-95db-321fe6fd9e11",
        "a70d9361-91cd-4d47-873f-7e5780fa23cc",
      ),
    );
  });
});
