// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { CategoryShowcaseCard } from "@/features/catalog/components/category-showcase-card";
import { CategoryShowcaseRail } from "@/features/catalog/components/category-showcase-rail";
import type { CatalogCategoryViewModel } from "@/features/catalog/types";

const scrollIntoView = vi.fn();

beforeAll(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      disconnect() {}
    },
  );
  vi.stubGlobal("CSS", { escape: (value: string) => value });
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn(() => ({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  });
  HTMLElement.prototype.scrollIntoView = scrollIntoView;
});

afterEach(() => {
  cleanup();
  scrollIntoView.mockReset();
});

const categories: CatalogCategoryViewModel[] = [
  {
    id: "category-1",
    name: "Leafy greens with a deliberately long category name",
    slug: "leafy-greens",
    description: "Fresh leaves selected by the store administrator.",
    displayTone: "STONE",
    image: {
      id: "image-1",
      url: "https://res.cloudinary.com/demo/image/upload/leafy.webp",
      altText: "A wide basket filled with leafy vegetables",
      width: 1600,
      height: 700,
    },
    productCount: 4,
  },
  {
    id: "category-2",
    name: "Root vegetables",
    slug: "root-vegetables",
    description: null,
    displayTone: "INK",
    image: null,
    productCount: 1,
  },
];

describe("real category showcase", () => {
  it("renders only the supplied real category fields and URL", () => {
    render(
      <CategoryShowcaseCard
        category={categories[0]!}
        search="fresh"
        sort="name-asc"
      />,
    );
    expect(
      screen.getByRole("heading", {
        name: "Leafy greens with a deliberately long category name",
      }),
    ).toBeVisible();
    expect(
      screen.getByText("Fresh leaves selected by the store administrator."),
    ).toBeVisible();
    expect(screen.getByText("4 active products")).toBeVisible();
    expect(
      screen.getByRole("img", {
        name: "A wide basket filled with leafy vegetables",
      }),
    ).toBeVisible();
    expect(
      screen.getByRole("link", {
        name: "Browse Leafy greens with a deliberately long category name",
      }),
    ).toHaveAttribute(
      "href",
      "/?category=leafy-greens&q=fresh&sort=name-asc#catalog-results",
    );
    expect(
      screen.queryByText(/promotion|sponsored|deal/i),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("MOB GREENS")).not.toBeInTheDocument();
  });

  it("does not invent optional description or image content", () => {
    render(
      <CategoryShowcaseCard
        category={categories[1]!}
        search=""
        sort="newest"
      />,
    );
    expect(screen.getByText("1 active product")).toBeVisible();
    expect(
      screen.queryByText("The category description will appear here."),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText("Image unavailable")).toBeVisible();
  });

  it("provides a real empty state when no active categories exist", () => {
    render(
      <CategoryShowcaseRail
        categories={[]}
        activeCategorySlug=""
        search=""
        sort="newest"
        displayTone="MIST"
        onFocusedCategoryChange={vi.fn()}
        onFocusedCategoryCommit={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("heading", { name: "No categories available yet" }),
    ).toBeVisible();
    expect(
      screen.getByText(
        "The store administrator has not activated any categories.",
      ),
    ).toBeVisible();
  });

  it("uses non-animated positioning for reduced motion", () => {
    render(
      <CategoryShowcaseRail
        categories={categories}
        activeCategorySlug="root-vegetables"
        search=""
        sort="newest"
        displayTone="INK"
        onFocusedCategoryChange={vi.fn()}
        onFocusedCategoryCommit={vi.fn()}
      />,
    );
    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: "auto",
      block: "nearest",
      inline: "center",
    });
  });
});
