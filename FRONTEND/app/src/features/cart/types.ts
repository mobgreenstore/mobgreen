import type { SupportedCurrency } from "@/config/commerce";
import type { CommerceImage, WeightPriceOption } from "@/types/commerce";

export interface StoredCartLine {
  productId: string;
  priceOptionId: string;
  specialOfferId?: string | undefined;
  quantity: number;
}

export type CartLineIssueCode =
  | "PRODUCT_MISMATCH"
  | "PRODUCT_UNAVAILABLE"
  | "OPTION_UNAVAILABLE"
  | "PRICE_UNAVAILABLE"
  | "PRICE_CHANGED"
  | "PRODUCT_CHANGED"
  | "OFFER_UNAVAILABLE"
  | "OFFER_EXPIRED"
  | "OFFER_CHANGED"
  | "OFFER_MARGIN_UNSAFE";

export interface CartLineIssue {
  code: CartLineIssueCode;
  message: string;
}

export interface ValidatedCartLine extends StoredCartLine {
  key: string;
  productName: string;
  productSlug: string | null;
  image: CommerceImage | null;
  option: WeightPriceOption | null;
  offer?: {
    publicId: string;
    discountBps: number;
    originalTotalMinor: number;
    discountMinor: number;
    bundleQuantity: number;
    endsAt: string;
  } | null;
  available: boolean;
  issues: CartLineIssue[];
}

export interface CartValidationResult {
  lines: ValidatedCartLine[];
  itemCount: number;
  currency: SupportedCurrency | null;
  currencies: SupportedCurrency[];
  subtotalMinor: number | null;
  hasCurrencyConflict: boolean;
  checkoutEligible: boolean;
}

export type CartLoadStatus = "loading" | "refreshing" | "ready" | "error";
