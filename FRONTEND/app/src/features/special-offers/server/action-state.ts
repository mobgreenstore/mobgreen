export interface SpecialOfferActionState {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string[]>;
  preview?: {
    generationKey: string;
    offers: Array<{
      publicId: string;
      productId: string;
      priceOptionId: string;
      currency: "GBP" | "EUR" | "USD";
      bundleQuantity: number;
      totalWeightGrams: string;
      originalTotalMinor: string;
      discountBps: number;
      discountMinor: string;
      offerTotalMinor: string;
      startsAt: string;
      endsAt: string;
    }>;
    exclusions: Array<{
      priceOptionId: string;
      bundleQuantity: number | null;
      code: string;
    }>;
  };
}

export const initialSpecialOfferActionState: SpecialOfferActionState = {
  status: "idle",
};
