export const OFFER_BASIS_POINTS = 10_000;
export const MINIMUM_OFFER_WEIGHT_GRAMS = 80;
export const MAXIMUM_OFFER_WEIGHT_GRAMS = 100_000;
export const MAXIMUM_OFFER_DISCOUNT_BPS = 1_500;
export const MINIMUM_OFFER_DURATION_MINUTES = 60;
export const MAXIMUM_OFFER_DURATION_MINUTES = 24 * 60;
export const MAXIMUM_OFFERS_PER_PRICE_OPTION = 4;

export const DEFAULT_CATEGORY_OFFER_POLICY = {
  enabled: false,
  minimumWeightGrams: 80,
  maximumWeightGrams: 1_000,
  minimumDiscountBps: 300,
  maximumDiscountBps: 1_500,
  minimumMarginBps: 1_500,
  durationMinutes: 24 * 60,
  maxOffersPerPriceOption: 4,
} as const;
