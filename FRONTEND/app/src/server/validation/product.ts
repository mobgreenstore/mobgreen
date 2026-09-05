import { z } from "zod";
import {
  currencySchema,
  idSchema,
  moneyMinorSchema,
  optionalTrimmedString,
  slugSchema,
  weightUnitSchema,
} from "@/server/validation/common";

export const productImageWriteSchema = z.object({
  cloudinaryPublicId: z
    .string()
    .trim()
    .min(1)
    .max(255)
    .refine(
      (value) => /^mob-greens\/products\/[a-f0-9-]+$/i.test(value),
      "The product image key is invalid.",
    ),
  url: z
    .url()
    .refine(
      (value) => new URL(value).hostname === "res.cloudinary.com",
      "Product images must use Cloudinary URLs.",
    ),
  altText: z
    .string()
    .trim()
    .min(3, "Describe what is visible in the product image.")
    .max(255),
  width: z.number().int().positive().max(12_000),
  height: z.number().int().positive().max(12_000),
  position: z.number().int().nonnegative(),
  isCover: z.boolean(),
});

export const productVideoWriteSchema = z.object({
  cloudinaryPublicId: z
    .string()
    .trim()
    .min(1)
    .max(255)
    .refine(
      (value) => /^mob-greens\/products\/videos\/[a-f0-9-]+$/i.test(value),
      "The product video key is invalid.",
    ),
  url: z
    .url()
    .refine(
      (value) => new URL(value).hostname === "res.cloudinary.com",
      "Product videos must use Cloudinary URLs.",
    ),
  posterUrl: z
    .url()
    .refine(
      (value) => new URL(value).hostname === "res.cloudinary.com",
      "Product video posters must use Cloudinary URLs.",
    )
    .nullable()
    .optional(),
  altText: z
    .string()
    .trim()
    .min(3, "Describe what is visible in the product video.")
    .max(255),
  width: z.number().int().positive().max(12_000),
  height: z.number().int().positive().max(12_000),
  durationSeconds: z.number().int().positive().max(3_600).nullable().optional(),
});

export const productPriceOptionWriteSchema = z
  .object({
    weightValue: z.coerce.number().positive().max(999_999_999),
    weightUnit: weightUnitSchema,
    currency: currencySchema,
    priceMinor: moneyMinorSchema,
    compareAtPriceMinor: moneyMinorSchema.optional(),
    costMinor: moneyMinorSchema.positive().nullable().optional(),
    position: z.number().int().nonnegative(),
    isActive: z.boolean().default(true),
  })
  .refine(
    (value) =>
      value.costMinor === undefined ||
      value.costMinor === null ||
      value.costMinor < value.priceMinor,
    {
      message: "Cost must be lower than the selling price.",
      path: ["costMinor"],
    },
  )
  .refine(
    (value) =>
      value.compareAtPriceMinor === undefined ||
      value.compareAtPriceMinor >= value.priceMinor,
    {
      message: "Comparison price must be greater than or equal to the price.",
      path: ["compareAtPriceMinor"],
    },
  );

function validateProductPresentation(
  value: {
    status?: "DRAFT" | "ACTIVE" | undefined;
    images?: z.output<typeof productImageWriteSchema>[] | undefined;
    video?: z.output<typeof productVideoWriteSchema> | null | undefined;
    priceOptions?: z.output<typeof productPriceOptionWriteSchema>[] | undefined;
  },
  context: z.RefinementCtx,
) {
  if (value.images) {
    const publicIds = new Set(
      value.images.map((image) => image.cloudinaryPublicId),
    );
    if (publicIds.size !== value.images.length) {
      context.addIssue({
        code: "custom",
        message: "Each product image can only be used once.",
        path: ["images"],
      });
    }
    const positions = new Set(value.images.map((image) => image.position));
    if (positions.size !== value.images.length) {
      context.addIssue({
        code: "custom",
        message: "Each product image needs a unique position.",
        path: ["images"],
      });
    }
    const coverCount = value.images.filter((image) => image.isCover).length;
    if (value.images.length > 0 && coverCount !== 1) {
      context.addIssue({
        code: "custom",
        message: "Choose exactly one cover image.",
        path: ["images"],
      });
    }
  }

  if (value.priceOptions) {
    const optionKeys = new Set(
      value.priceOptions.map(
        (option) =>
          `${option.weightValue}:${option.weightUnit}:${option.currency}`,
      ),
    );
    if (optionKeys.size !== value.priceOptions.length) {
      context.addIssue({
        code: "custom",
        message: "Weight, unit, and currency combinations must be unique.",
        path: ["priceOptions"],
      });
    }
  }

  if (
    value.status === "ACTIVE" &&
    (value.priceOptions?.filter((option) => option.isActive).length ?? 0) === 0
  ) {
    context.addIssue({
      code: "custom",
      message: "An active product needs at least one active price option.",
      path: ["priceOptions"],
    });
  }
}

export const productFormSchema = z
  .object({
    categoryId: idSchema,
    name: z.string().trim().min(2, "Enter at least 2 characters.").max(160),
    shortDescription: z
      .string()
      .trim()
      .min(2, "Enter a short description.")
      .max(280),
    description: optionalTrimmedString(10_000),
    status: z.enum(["DRAFT", "ACTIVE"]).default("DRAFT"),
    images: z.array(productImageWriteSchema).max(8).default([]),
    video: productVideoWriteSchema.nullable().optional().default(null),
    priceOptions: z.array(productPriceOptionWriteSchema).max(50).default([]),
  })
  .superRefine(validateProductPresentation);

export const bulkProductFormSchema = z.object({
  products: z
    .array(productFormSchema)
    .min(1, "Add at least one product.")
    .max(10, "You can create up to 10 products at once."),
});

export const createProductSchema = productFormSchema
  .safeExtend({ slug: slugSchema })
  .superRefine(validateProductPresentation);

export const updateProductSchema = productFormSchema
  .safeExtend({ id: idSchema, slug: slugSchema })
  .superRefine(validateProductPresentation);

export const productIdSchema = z.object({ id: idSchema });
export const activateProductSchema = productIdSchema;
export const draftProductSchema = productIdSchema;
export const archiveProductSchema = productIdSchema;
