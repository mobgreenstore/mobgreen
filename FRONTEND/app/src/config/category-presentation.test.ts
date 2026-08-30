import { describe, expect, it } from "vitest";
import {
  CATEGORY_DISPLAY_TONES,
  getCategoryDisplayTone,
} from "@/config/category-presentation";

describe("category presentation configuration", () => {
  it("exposes only the approved neutral display tones", () => {
    expect(CATEGORY_DISPLAY_TONES).toEqual([
      "LIGHT",
      "MIST",
      "STONE",
      "CHARCOAL",
      "INK",
    ]);
  });

  it("falls back to Mist for an unexpected runtime value", () => {
    expect(getCategoryDisplayTone("UNKNOWN" as never).value).toBe("MIST");
  });
});
