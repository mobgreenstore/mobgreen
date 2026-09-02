// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { StoreSearchBar } from "@/components/shared/store-search-bar";
import { CategoryTabRail } from "@/features/catalog/components/category-tab-rail";

beforeAll(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      disconnect() {}
    },
  );
  HTMLElement.prototype.scrollIntoView = vi.fn();
});

afterEach(cleanup);

const categories = [
  {
    id: "category-1",
    name: "Leafy greens",
    slug: "leafy-greens",
    description: "Fresh leaves.",
    displayTone: "CHARCOAL" as const,
    image: null,
    productCount: 4,
  },
  {
    id: "category-2",
    name: "Root vegetables",
    slug: "root-vegetables",
    description: null,
    displayTone: "STONE" as const,
    image: null,
    productCount: 2,
  },
];

describe("store discovery controls", () => {
  it("submits search through the real catalog URL contract", () => {
    render(
      <StoreSearchBar
        search="kale"
        categorySlug="leafy-greens"
        sort="name-asc"
      />,
    );
    expect(
      screen.getByRole("searchbox", { name: "Search products" }),
    ).toHaveValue("kale");
    expect(
      screen.getByRole("button", { name: "Search products" }),
    ).toHaveAttribute("type", "submit");
    expect(document.querySelector('input[name="category"]')).toHaveValue(
      "leafy-greens",
    );
    expect(document.querySelector('input[name="sort"]')).toHaveValue(
      "name-asc",
    );
    expect(screen.queryByLabelText(/camera/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/microphone/i)).not.toBeInTheDocument();
  });

  it("shows only real categories and preserves search and sorting in their links", () => {
    render(
      <CategoryTabRail
        categories={categories}
        activeCategorySlug="leafy-greens"
        search="kale"
        sort="name-desc"
        displayTone="CHARCOAL"
      />,
    );
    const links = screen.getAllByRole("link");
    expect(links.map((link) => link.textContent)).toEqual([
      "Leafy greens",
      "Root vegetables",
    ]);
    expect(links[0]).toHaveAttribute(
      "href",
      "/?category=leafy-greens&q=kale&sort=name-desc",
    );
    expect(links[0]).toHaveAttribute("aria-current", "page");
  });

  it("supports arrow-key movement across the category rail", async () => {
    const user = userEvent.setup();
    render(
      <CategoryTabRail
        categories={categories}
        activeCategorySlug=""
        search=""
        sort="newest"
        displayTone="MIST"
      />,
    );
    const links = screen.getAllByRole("link");
    links[0]?.focus();
    await user.keyboard("{ArrowRight}");
    expect(links[1]).toHaveFocus();
    await user.keyboard("{End}");
    expect(links[1]).toHaveFocus();
    await user.keyboard("{Home}");
    expect(links[0]).toHaveFocus();
  });
});
