import type {
  CategoryOfferPolicyInput,
  OfferEligiblePriceOption,
} from "@/features/special-offers/types";

export interface OfferGenerationCategoryRecord {
  id: string;
  isActive: boolean;
  archivedAt: Date | null;
  policy: CategoryOfferPolicyInput | null;
  priceOptions: OfferEligiblePriceOption[];
}

export interface SpecialOfferGenerationSource {
  loadCategory(
    categoryId: string,
  ): Promise<OfferGenerationCategoryRecord | null>;
}
