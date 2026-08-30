import { describe, expect, it, vi } from "vitest";
import {
  generateUniqueProductSlug,
  slugifyProductName,
} from "@/features/products/server/slug";

describe("product slugs", () => {
  it("normalizes product names", () => {
    expect(slugifyProductName("  Café Spinach 500 g  ")).toBe(
      "cafe-spinach-500-g",
    );
  });

  it("adds a deterministic suffix when a slug exists", async () => {
    const available = vi.fn(async (slug: string) => slug === "spinach-3");
    await expect(generateUniqueProductSlug("Spinach", available)).resolves.toBe(
      "spinach-3",
    );
  });
});
