// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/products/server/actions", () => ({
  initialProductActionState: { status: "idle" },
  createProductsAction: vi.fn(async () => ({ status: "idle" })),
}));

vi.mock("@/components/admin", () => ({
  ImageUploader: ({
    onUploadProgressChange,
  }: {
    onUploadProgressChange?: (state: {
      status: "uploading";
      progress: number;
    }) => void;
  }) => (
    <button
      type="button"
      onClick={() =>
        onUploadProgressChange?.({ status: "uploading", progress: 42 })
      }
    >
      Simulate real upload progress
    </button>
  ),
  WeightPriceEditor: () => <div>Weight price editor</div>,
}));

import { BulkProductForm } from "@/features/products/components/bulk-product-form";

const categories = [
  {
    id: "124bf462-6765-451c-8db8-d47976ec9595",
    name: "Leafy greens",
    isActive: true,
  },
];

afterEach(cleanup);

describe("bulk product editor", () => {
  it("adds no more than ten real product drafts", () => {
    render(<BulkProductForm categories={categories} />);
    const addButton = screen.getByRole("button", {
      name: "Add another product",
    });

    for (let index = 1; index < 10; index += 1) {
      fireEvent.click(addButton);
    }

    expect(screen.getByText("10/10 products")).toBeVisible();
    expect(screen.getByText("10 of 10 product slots used")).toBeVisible();
    expect(addButton).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Create 10 products" }),
    ).toBeVisible();
  });

  it("shows true upload progress on the corresponding product panel", () => {
    render(<BulkProductForm categories={categories} />);

    fireEvent.click(
      screen.getByRole("button", { name: "Simulate real upload progress" }),
    );

    expect(screen.getByText("Uploading 42%")).toBeVisible();
    expect(
      screen.getByRole("progressbar", {
        name: "Product 1 upload progress",
      }),
    ).toHaveAttribute("aria-valuenow", "42");
    expect(
      screen.getByRole("button", { name: "Create 1 product" }),
    ).toBeDisabled();
  });

  it("opens the first incomplete product and prevents invalid submission", () => {
    render(<BulkProductForm categories={categories} />);

    fireEvent.click(screen.getByRole("button", { name: "Create 1 product" }));

    expect(screen.getByText("Review the product batch")).toBeVisible();
    expect(screen.getByText("Product 1: Enter a product name.")).toBeVisible();
  });
});
