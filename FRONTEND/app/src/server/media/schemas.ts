import { z } from "zod";
import { IMAGE_UPLOAD_SCOPES } from "@/config/images";

export const uploadImageFieldsSchema = z.object({
  scope: z.enum(IMAGE_UPLOAD_SCOPES),
  altText: z
    .string()
    .trim()
    .min(3, "Alternative text must contain at least 3 characters.")
    .max(255),
});

export const removeImageSchema = z.object({
  publicId: z
    .string()
    .trim()
    .min(1)
    .max(255)
    .refine(
      (value) => /^mob-greens\/(categories|products)\/[a-f0-9-]+$/i.test(value),
      "The image key is not managed by MOB GREENS.",
    ),
});
