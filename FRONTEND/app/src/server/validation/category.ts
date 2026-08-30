import { z } from "zod";
import { CATEGORY_DISPLAY_TONES } from "@/config/category-presentation";
import {
  idSchema,
  optionalTrimmedString,
  slugSchema,
} from "@/server/validation/common";

export const categoryImageSchema = z.object({
  publicId: z
    .string()
    .trim()
    .min(1)
    .max(255)
    .refine(
      (value) => /^mob-greens\/categories\/[a-f0-9-]+$/i.test(value),
      "The category image key is invalid.",
    ),
  url: z
    .url()
    .refine(
      (value) => new URL(value).hostname === "res.cloudinary.com",
      "The category image URL must be a Cloudinary URL.",
    ),
  altText: z
    .string()
    .trim()
    .min(3, "Describe what is visible in the category image.")
    .max(255),
  width: z.number().int().positive().max(12_000),
  height: z.number().int().positive().max(12_000),
});

export const categoryFormSchema = z.object({
  name: z.string().trim().min(2, "Enter at least 2 characters.").max(120),
  description: optionalTrimmedString(500),
  isActive: z.boolean().default(true),
  displayTone: z.enum(CATEGORY_DISPLAY_TONES).default("MIST"),
  image: categoryImageSchema.nullable().optional(),
});

export const createCategorySchema = categoryFormSchema.extend({
  slug: slugSchema,
  position: z.number().int().nonnegative().default(0),
});

export const updateCategorySchema = createCategorySchema
  .partial()
  .extend({ id: idSchema });
export const categoryIdSchema = z.object({ id: idSchema });
export const archiveCategorySchema = categoryIdSchema;
export const activateCategorySchema = categoryIdSchema;
export const reorderCategoriesSchema = z.object({
  categories: z
    .array(z.object({ id: idSchema, position: z.number().int().nonnegative() }))
    .min(1),
});
