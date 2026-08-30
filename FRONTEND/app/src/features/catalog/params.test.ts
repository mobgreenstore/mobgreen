import { describe, expect, it } from "vitest";

import {
  catalogHref,
  normalizeCatalogSearch,
  parseCatalogPage,
  parseCatalogSort,
  parseCatalogView,
} from "@/features/catalog/params";

describe("catalog parameters", () => {
  it("normalizes search input and limits its length", () => {
    expect(normalizeCatalogSearch("  fresh   green beans  ")).toBe(
      "fresh green beans",
    );
    expect(normalizeCatalogSearch("ｋａｌｅ")).toBe("kale");
    expect(normalizeCatalogSearch("x".repeat(140))).toHaveLength(120);
  });

  it("accepts only supported sorting and positive pages", () => {
    expect(parseCatalogSort("name-asc")).toBe("name-asc");
    expect(parseCatalogSort("price-low")).toBe("newest");
    expect(parseCatalogPage("3")).toBe(3);
    expect(parseCatalogPage("-2")).toBe(1);
    expect(parseCatalogPage("invalid")).toBe(1);
    expect(parseCatalogView("offers")).toBe("offers");
    expect(parseCatalogView("forged")).toBe("products");
  });

  it("creates canonical catalog links without default parameters", () => {
    expect(catalogHref({})).toBe("/");
    expect(
      catalogHref({
        category: "leafy-greens",
        search: "kale",
        sort: "name-desc",
        page: 2,
      }),
    ).toBe("/?category=leafy-greens&q=kale&sort=name-desc&page=2");
    expect(
      catalogHref({
        category: "leafy-greens",
        search: "kale",
        sort: "name-desc",
        page: 2,
        view: "offers",
      }),
    ).toBe("/?category=leafy-greens&q=kale&sort=name-desc&page=2&view=offers");
  });
});
