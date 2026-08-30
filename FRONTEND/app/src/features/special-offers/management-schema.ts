import { z } from "zod";
import { categoryOfferPolicySchema } from "@/features/special-offers/schema";

export const categoryOfferPolicyWriteSchema = z.object({
  categoryId: z.uuid(),
  policy: categoryOfferPolicySchema,
});

export const priceOptionCostWriteSchema = z.object({
  priceOptionId: z.uuid(),
  costMinor: z.coerce.bigint().positive().nullable(),
});

export const campaignRequestSchema = z.object({
  categoryId: z.uuid(),
  generationKey: z.uuid(),
});

export const campaignLifecycleSchema = z.object({
  categoryId: z.uuid(),
  generationKey: z.uuid(),
});
