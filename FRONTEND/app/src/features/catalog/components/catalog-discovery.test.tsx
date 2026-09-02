// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

const replace = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ replace }),
}));
vi.mock("@/features/cart/cart-provider", () => ({
  useCart: () => ({ itemCount: 2 }),
}));

import { CatalogDiscovery } from "@/features/catalog/components/catalog-discovery";
import type { CatalogCategoryViewModel } from "@/features/catalog/types";

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
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  });
  HTMLElement.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  cleanup();
  replace.mockReset();
  vi.useRealTimers();
});

const categories: CatalogCategoryViewModel[] = [
  {
    id: "category-1",
    name: "Leafy greens",
    slug: "leafy-greens",
    description: null,
    displayTone: "STONE",
    image: null,
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

describe("catalog discovery synchronization", () => {
  it("synchronizes swipe focus with tab, header tone, and URL", () => {
    vi.useFakeTimers();
    render(
      <CatalogDiscovery
        categories={categories}
        activeCategorySlug=""
        search="fresh"
        sort="name-desc"
      />,
    );
    const region = screen.getByRole("region", {
      name: "Category showcase",
    });
    const viewport = region.querySelector<HTMLElement>(".overflow-x-auto")!;
    const items = viewport.querySelectorAll<HTMLElement>(
      "[data-showcase-item]",
    );
    Object.defineProperties(viewport, {
      clientWidth: { configurable: true, value: 300 },
      scrollWidth: { configurable: true, value: 600 },
      scrollLeft: { configurable: true, writable: true, value: 300 },
    });
    Object.defineProperties(items[0], {
      offsetLeft: { configurable: true, value: 0 },
      offsetWidth: { configurable: true, value: 300 },
    });
    Object.defineProperties(items[1], {
      offsetLeft: { configurable: true, value: 300 },
      offsetWidth: { configurable: true, value: 300 },
    });

    fireEvent.pointerDown(viewport);
    fireEvent.scroll(viewport);

    expect(
      screen.getByRole("link", { name: "Root vegetables" }),
    ).toHaveAttribute("aria-current", "page");
    expect(document.querySelector("header")).toHaveClass("bg-[#121212]");
    expect(region).toHaveClass("bg-[#121212]");
    expect(screen.getByRole("link", { name: "Root vegetables" })).toHaveClass(
      "bg-[var(--category-tab-active-surface)]",
    );

    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(replace).toHaveBeenCalledWith(
      "/?category=root-vegetables&q=fresh&sort=name-desc",
      { scroll: false },
    );
  });
});
