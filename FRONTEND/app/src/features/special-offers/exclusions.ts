import type { OfferExclusionCode } from "@/features/special-offers/types";

export const OFFER_EXCLUSION_LABELS: Record<OfferExclusionCode, string> = {
  COST_REQUIRED: "Add a cost price before this option can receive offers.",
  INVALID_PRICE: "The cost or selling price is not valid for an offer.",
  INVALID_WEIGHT: "The price option has an invalid weight.",
  NO_QUALIFYING_WEIGHT: "No bundle fits this category's weight range.",
  MARGIN_PROTECTED: "The protected margin leaves no safe discount.",
  DISCOUNT_TOO_SMALL: "The safe discount is below the configured minimum.",
};
