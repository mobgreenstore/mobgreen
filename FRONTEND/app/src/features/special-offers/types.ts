import type { SupportedCurrency, WeightUnit } from "@/config/commerce";

export interface CategoryOfferPolicyInput {
  enabled: boolean;
  minimumWeightGrams: number;
  maximumWeightGrams: number;
  minimumDiscountBps: number;
  maximumDiscountBps: number;
  minimumMarginBps: number;
  durationMinutes: number;
  maxOffersPerPriceOption: number;
}

export interface OfferEligiblePriceOption {
  productId: string;
  priceOptionId: string;
  weightValue: string | number;
  weightUnit: WeightUnit;
  currency: SupportedCurrency;
  priceMinor: bigint;
  costMinor: bigint | null;
}

export interface GeneratedSpecialOffer {
  publicId: string;
  generationKey: string;
  categoryId: string;
  productId: string;
  priceOptionId: string;
  currency: SupportedCurrency;
  bundleQuantity: number;
  totalWeightGrams: string;
  originalTotalMinor: bigint;
  discountBps: number;
  discountMinor: bigint;
  offerTotalMinor: bigint;
  startsAt: Date;
  endsAt: Date;
}

export type OfferExclusionCode =
  | "COST_REQUIRED"
  | "INVALID_PRICE"
  | "INVALID_WEIGHT"
  | "NO_QUALIFYING_WEIGHT"
  | "MARGIN_PROTECTED"
  | "DISCOUNT_TOO_SMALL";

export interface OfferGenerationExclusion {
  priceOptionId: string;
  bundleQuantity: number | null;
  code: OfferExclusionCode;
}

export interface OfferGenerationResult {
  offers: GeneratedSpecialOffer[];
  exclusions: OfferGenerationExclusion[];
}
