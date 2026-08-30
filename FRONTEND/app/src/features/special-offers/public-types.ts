import type { SupportedCurrency } from "@/config/commerce";
import type { CommerceImage } from "@/types/commerce";

export interface PublicSpecialOfferViewModel {
  publicId: string;
  categorySlug: string;
  productId: string;
  productSlug: string;
  productName: string;
  image: CommerceImage | null;
  priceOptionId: string;
  currency: SupportedCurrency;
  bundleQuantity: number;
  totalWeightGrams: string;
  originalTotalMinor: number;
  discountBps: number;
  discountMinor: number;
  offerTotalMinor: number;
  startsAt: string;
  endsAt: string;
}

export interface PublicSpecialOfferPage {
  offers: PublicSpecialOfferViewModel[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}
