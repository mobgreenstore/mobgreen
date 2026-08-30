import "server-only";

import type { SupportedCurrency, WeightUnit } from "@/config/commerce";
import type { CommerceImage } from "@/types/commerce";

export interface CartPriceRecord {
  id: string;
  productId: string;
  weightValue: number;
  weightUnit: WeightUnit;
  currency: SupportedCurrency;
  priceMinor: bigint;
  costMinor?: bigint | null;
  isActive: boolean;
  archivedAt: Date | null;
  product: {
    id: string;
    name: string;
    slug: string;
    status: "DRAFT" | "ACTIVE" | "ARCHIVED";
    archivedAt: Date | null;
    categoryActive: boolean;
    categoryArchivedAt: Date | null;
    offerPolicy?: { enabled: boolean; minimumMarginBps: number } | null;
    image: CommerceImage | null;
  };
}

export interface CartOfferRecord {
  id: string;
  publicId: string;
  productId: string;
  priceOptionId: string;
  currency: SupportedCurrency;
  bundleQuantity: number;
  totalWeightGrams: number;
  originalTotalMinor: bigint;
  discountBps: number;
  discountMinor: bigint;
  offerTotalMinor: bigint;
  status: "DRAFT" | "ACTIVE" | "EXPIRED" | "CANCELLED";
  startsAt: Date;
  endsAt: Date;
  archivedAt: Date | null;
  priceOption: CartPriceRecord;
}

export interface CartRepository {
  findPriceOptions(ids: readonly string[]): Promise<CartPriceRecord[]>;
  findOffers?(publicIds: readonly string[]): Promise<CartOfferRecord[]>;
}
