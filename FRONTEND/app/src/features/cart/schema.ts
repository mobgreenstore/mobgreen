import { z } from "zod";

export const CART_MAX_LINES = 50;
export const CART_MAX_QUANTITY = 99;

export const storedCartLineSchema = z
  .object({
    productId: z.uuid(),
    priceOptionId: z.uuid(),
    specialOfferId: z
      .string()
      .regex(/^[A-Za-z0-9_-]{32}$/i, "Invalid special offer reference.")
      .optional(),
    quantity: z.number().int().min(1).max(CART_MAX_QUANTITY),
  })
  .strict();

export const storedCartLinesSchema = z
  .array(storedCartLineSchema)
  .max(CART_MAX_LINES)
  .superRefine((lines, context) => {
    const identities = new Set<string>();
    lines.forEach((line, index) => {
      const identity = `${line.productId}:${line.priceOptionId}:${line.specialOfferId ?? "standard"}`;
      if (identities.has(identity)) {
        context.addIssue({
          code: "custom",
          message: "Duplicate card items are not allowed.",
          path: [index],
        });
      }
      identities.add(identity);
    });
  });

export const validateCartRequestSchema = z
  .object({ lines: storedCartLinesSchema })
  .strict();
