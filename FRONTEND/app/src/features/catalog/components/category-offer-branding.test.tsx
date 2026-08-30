// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CategoryShowcaseCard } from "@/features/catalog/components/category-showcase-card";
import type { CatalogCategoryViewModel } from "@/features/catalog/types";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const category: CatalogCategoryViewModel = {
  id: "category-1",
  name: "Leafy greens",
  slug: "leafy-greens",
  description: "Fresh greens",
  displayTone: "STONE",
  image: null,
  productCount: 3,
  strongestOffer: {
    publicId: "safe-offer",
    discountBps: 1500,
    totalWeightGrams: "800",
    endsAt: "2099-08-24T12:00:00.000Z",
  },
};

describe("category special-offer branding", () => {
  it("shows the strongest live offer and routes to category offers", () => {
    render(
      <CategoryShowcaseCard category={category} search="fresh" sort="newest" />,
    );
    expect(screen.getByText("15%")).toBeVisible();
    expect(screen.getByText("From 800g")).toBeVisible();
    expect(
      screen.getByRole("link", { name: "View Leafy greens special offers" }),
    ).toHaveAttribute(
      "href",
      "/?category=leafy-greens&q=fresh&view=offers#catalog-results",
    );
  });

  it("removes expired offer messaging from the card", () => {
    render(
      <CategoryShowcaseCard
        category={{
          ...category,
          strongestOffer: {
            ...category.strongestOffer!,
            endsAt: "2020-01-01T00:00:00.000Z",
          },
        }}
        search=""
        sort="newest"
      />,
    );
    expect(screen.queryByText("15%")).not.toBeInTheDocument();
  });
});
