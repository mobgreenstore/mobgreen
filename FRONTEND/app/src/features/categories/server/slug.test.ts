import { describe, expect, it, vi } from "vitest";
import {
  generateUniqueCategorySlug,
  slugifyCategoryName,
} from "@/features/categories/server/slug";

describe("category slug generation", () => {
  it("normalizes names into readable slugs", () => {
    expect(slugifyCategoryName("  Légumes & Greens  ")).toBe("legumes-greens");
  });

  it("uses a numeric suffix when the base slug exists", async () => {
    const available = vi.fn(async (slug: string) => slug === "fresh-greens-3");
    await expect(
      generateUniqueCategorySlug("Fresh Greens", available),
    ).resolves.toBe("fresh-greens-3");
  });
});
