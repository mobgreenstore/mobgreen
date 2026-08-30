import { z } from "zod";
import {
  MAXIMUM_OFFERS_PER_PRICE_OPTION,
  MAXIMUM_OFFER_DISCOUNT_BPS,
  MAXIMUM_OFFER_DURATION_MINUTES,
  MAXIMUM_OFFER_WEIGHT_GRAMS,
  MINIMUM_OFFER_DURATION_MINUTES,
  MINIMUM_OFFER_WEIGHT_GRAMS,
} from "@/features/special-offers/contract";

export const categoryOfferPolicySchema = z
  .object({
    enabled: z.boolean(),
    minimumWeightGrams: z
      .number()
      .int()
      .min(MINIMUM_OFFER_WEIGHT_GRAMS)
      .max(MAXIMUM_OFFER_WEIGHT_GRAMS),
    maximumWeightGrams: z
      .number()
      .int()
      .min(MINIMUM_OFFER_WEIGHT_GRAMS)
      .max(MAXIMUM_OFFER_WEIGHT_GRAMS),
    minimumDiscountBps: z.number().int().min(1).max(MAXIMUM_OFFER_DISCOUNT_BPS),
    maximumDiscountBps: z.number().int().min(1).max(MAXIMUM_OFFER_DISCOUNT_BPS),
    minimumMarginBps: z.number().int().min(0).max(10_000),
    durationMinutes: z
      .number()
      .int()
      .min(MINIMUM_OFFER_DURATION_MINUTES)
      .max(MAXIMUM_OFFER_DURATION_MINUTES),
    maxOffersPerPriceOption: z
      .number()
      .int()
      .min(1)
      .max(MAXIMUM_OFFERS_PER_PRICE_OPTION),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.maximumWeightGrams <= value.minimumWeightGrams) {
      context.addIssue({
        code: "custom",
        path: ["maximumWeightGrams"],
        message: "Maximum offer weight must exceed the minimum weight.",
      });
    }
    if (value.maximumDiscountBps < value.minimumDiscountBps) {
      context.addIssue({
        code: "custom",
        path: ["maximumDiscountBps"],
        message: "Maximum discount cannot be below the minimum discount.",
      });
    }
  });

export const priceOptionOfferCostSchema = z
  .object({
    priceOptionId: z.uuid(),
    costMinor: z.coerce.bigint().positive(),
  })
  .strict();
