// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/products/server/actions", () => ({
  initialProductActionState: { status: "idle" },
  createProductAction: vi.fn(),
  updateProductAction: vi.fn(),
}));

import { ProductForm } from "@/features/products/components/product-form";
import type { ProductViewModel } from "@/features/products/server/queries";

afterEach(cleanup);

const product: ProductViewModel = {
  id: "224bf462-6765-451c-8db8-d47976ec9595",
  categoryId: "124bf462-6765-451c-8db8-d47976ec9595",
  categoryName: "Leafy greens",
  name: "Spinach",
  slug: "spinach",
  shortDescription: "Fresh spinach",
  description: null,
  status: "DRAFT",
  isArchived: false,
  images: [],
  video: null,
  priceOptions: [
    {
      id: "324bf462-6765-451c-8db8-d47976ec9595",
      weightValue: "500",
      weightUnit: "G",
      currency: "GBP",
      priceMinor: "250",
      compareAtPriceMinor: null,
      costMinor: null,
      position: 0,
      isActive: true,
    },
  ],
  currencies: ["GBP"],
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("product form preview", () => {
  it("uses current unsaved form values without creating stored demo data", () => {
    render(
      <ProductForm
        mode="edit"
        product={product}
        categories={[
          {
            id: product.categoryId,
            name: product.categoryName,
            isActive: true,
          },
        ]}
      />,
    );

    fireEvent.change(screen.getByLabelText(/Product name/), {
      target: { value: "Baby spinach" },
    });
    fireEvent.change(screen.getByLabelText(/Short description/), {
      target: { value: "Tender local spinach leaves" },
    });

    expect(screen.getByRole("heading", { name: "Baby spinach" })).toBeVisible();
    expect(screen.getAllByText("Tender local spinach leaves")[1]).toBeVisible();
    expect(screen.getByText("£2.50")).toBeVisible();
    expect(screen.getByText("500 g")).toBeVisible();
  });
});
