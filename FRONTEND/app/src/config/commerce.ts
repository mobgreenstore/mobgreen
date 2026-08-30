export const STORE_NAME = "MOB GREENS";

export const SUPPORTED_CURRENCIES = [
  { code: "GBP", symbol: "£", label: "British pound" },
  { code: "EUR", symbol: "€", label: "Euro" },
  { code: "USD", symbol: "$", label: "US dollar" },
] as const;

export const WEIGHT_UNITS = [
  { value: "G", shortLabel: "g", label: "Grams" },
  { value: "KG", shortLabel: "kg", label: "Kilograms" },
] as const;

export const FULFILLMENT_OPTIONS = [
  { value: "PICKUP", label: "Pickup" },
  { value: "DELIVERY", label: "Delivery" },
] as const;

export const PAYMENT_METHODS = [
  { value: "RECHARGE_FROM_STORE", label: "Recharge from store" },
  { value: "RECHARGE_ONLINE", label: "Recharge online" },
] as const;

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number]["code"];
export type WeightUnit = (typeof WEIGHT_UNITS)[number]["value"];
export type FulfillmentOption = (typeof FULFILLMENT_OPTIONS)[number]["value"];
export type PaymentMethod = (typeof PAYMENT_METHODS)[number]["value"];
