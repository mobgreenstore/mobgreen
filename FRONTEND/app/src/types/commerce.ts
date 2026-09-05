import type { SupportedCurrency, WeightUnit } from "@/config/commerce";

export interface CommerceImage {
  id: string;
  url: string;
  altText: string;
  width: number;
  height: number;
}

export interface CommerceVideo {
  id: string;
  url: string;
  posterUrl: string | null;
  altText: string;
  width: number;
  height: number;
  durationSeconds: number | null;
}

export interface WeightPriceOption {
  id: string;
  weightValue: number;
  weightUnit: WeightUnit;
  currency: SupportedCurrency;
  priceMinor: number;
  compareAtPriceMinor?: number;
  available: boolean;
}

export interface ProductCardViewModel {
  id: string;
  slug: string;
  name: string;
  categoryName: string;
  coverImage: CommerceImage | null;
  primaryPrice: WeightPriceOption;
}

export interface CartItemViewModel {
  id: string;
  productName: string;
  image: CommerceImage | null;
  option: WeightPriceOption;
  quantity: number;
}
