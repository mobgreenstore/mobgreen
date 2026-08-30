import { describe, expect, it } from "vitest";
import { categoryFormSchema } from "@/server/validation/category";

describe("category presentation write boundary", () => {
  it("defaults real categories to the approved Mist surface", () => {
    const result = categoryFormSchema.parse({ name: "Fresh vegetables" });
    expect(result.displayTone).toBe("MIST");
  });

  it("accepts only approved neutral storefront tones", () => {
    expect(
      categoryFormSchema.safeParse({
        name: "Fresh vegetables",
        displayTone: "CHARCOAL",
      }).success,
    ).toBe(true);
    expect(
      categoryFormSchema.safeParse({
        name: "Fresh vegetables",
        displayTone: "BLUE",
      }).success,
    ).toBe(false);
  });

  it("requires useful alternative text whenever an image is supplied", () => {
    const result = categoryFormSchema.safeParse({
      name: "Fresh vegetables",
      image: {
        publicId: "mob-greens/categories/124bf462-6765-451c-8db8-d47976ec9595",
        url: "https://res.cloudinary.com/demo/image/upload/category.webp",
        altText: "",
        width: 1200,
        height: 1500,
      },
    });
    expect(result.success).toBe(false);
  });
});
