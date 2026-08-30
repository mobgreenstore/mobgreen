import type { SupportedCurrency } from "@/config/commerce";
import type { CommerceImage } from "@/types/commerce";

export interface SimulatedCourierCandidate {
  candidateId: string;
  displayName: string;
  distanceMeters: number;
  estimatedDurationSeconds: number;
}

export interface CheckoutIntentLocationView {
  formattedAddress: string;
  postalCode: string | null;
  locality: string | null;
  countryCode: string | null;
}

export interface CheckoutIntentView {
  publicId: string;
  status: "DRAFT" | "MATCHING" | "DRIVER_SELECTED" | "SUBMITTED" | "EXPIRED";
  fulfillmentType: "PICKUP" | "DELIVERY";
  paymentMethod: "RECHARGE_FROM_STORE" | "RECHARGE_ONLINE";
  rechargeProvider: string | null;
  currency: SupportedCurrency;
  subtotalMinor: number;
  location: CheckoutIntentLocationView | null;
  candidates: SimulatedCourierCandidate[];
  selectedCourier: SimulatedCourierCandidate | null;
  expiresAt: string;
}

export interface CheckoutConfirmationLineView {
  key: string;
  productName: string;
  image: CommerceImage | null;
  weightValue: number;
  weightUnit: "G" | "KG";
  quantity: number;
  unitPriceMinor: number;
  lineTotalMinor: number;
  discountBps: number | null;
}

export interface CheckoutConfirmationView extends CheckoutIntentView {
  customer: {
    name: string;
    email: string;
  };
  lines: CheckoutConfirmationLineView[];
  itemCount: number;
  confirmationEligible: boolean;
}
