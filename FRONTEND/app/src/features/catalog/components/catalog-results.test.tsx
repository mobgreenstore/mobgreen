// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

const replace = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

import { ProductCard } from "@/components/commerce/product-card";
import { ProductGrid } from "@/components/commerce/product-grid";
import { CatalogResultsHeader } from "@/features/catalog/components/catalog-results-header";
import { CatalogToolbar } from "@/features/catalog/components/catalog-toolbar";

afterEach(() => {
  cleanup();
  replace.mockReset();
});

describe("dense real catalog results", () => {
  it("anchors the custom sort menu and preserves category and search in the result URL", async () => {
    const user = userEvent.setup();
    render(
      <CatalogResultsHeader
        categoryName="Leafy greens"
        resultCount={4}
        toolbar={
          <CatalogToolbar
            categorySlug="leafy-greens"
            search="fresh"
            sort="name-desc"
          />
        }
      />,
    );

    expect(screen.getByRole("heading", { name: "Leafy greens" })).toBeVisible();
    expect(screen.getByText("4 products")).toBeVisible();

    const trigger = screen.getByRole("button", {
      name: "Sort products, currently Name Z-A",
    });
    await user.click(trigger);

    expect(screen.getByRole("menu")).toBeVisible();
    await user.click(screen.getByRole("menuitem", { name: "Name A-Z" }));

    expect(replace).toHaveBeenCalledWith(
      "/?category=leafy-greens&q=fresh&sort=name-asc#catalog-results",
    );
  });

  it("keeps the real product link, currency, price, and weight", () => {
    render(
      <ProductCard
        product={{
          id: "product-1",
          slug: "fresh-kale",
          name: "Fresh kale",
          categoryName: "Leafy greens",
          coverImage: null,
          primaryPrice: {
            id: "price-1",
            weightValue: 500,
            weightUnit: "G",
            currency: "EUR",
            priceMinor: 1250,
            available: true,
          },
        }}
      />,
    );
    expect(
      screen.getByRole("link", { name: "View Fresh kale" }),
    ).toHaveAttribute("href", "/products/fresh-kale");
    expect(
      screen.getByText(String.fromCodePoint(0x20ac) + "12.50"),
    ).toBeVisible();
    expect(screen.getByText("500 g")).toBeVisible();
  });

  it("keeps the reusable grid at two, three, and four responsive columns", () => {
    const { container } = render(<ProductGrid />);
    expect(container.firstChild).toHaveClass(
      "grid-cols-2",
      "md:grid-cols-3",
      "xl:grid-cols-4",
    );
  });
});
