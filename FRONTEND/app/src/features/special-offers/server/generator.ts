import "server-only";

import { createHash } from "node:crypto";
import {
  MAXIMUM_OFFER_DISCOUNT_BPS,
  MAXIMUM_OFFER_DURATION_MINUTES,
  MINIMUM_OFFER_WEIGHT_GRAMS,
  OFFER_BASIS_POINTS,
} from "@/features/special-offers/contract";
import { categoryOfferPolicySchema } from "@/features/special-offers/schema";
import type {
  CategoryOfferPolicyInput,
  GeneratedSpecialOffer,
  OfferEligiblePriceOption,
  OfferGenerationExclusion,
  OfferGenerationResult,
} from "@/features/special-offers/types";

const MILLIGRAMS_PER_GRAM = 1_000n;
const MILLIGRAMS_PER_KILOGRAM = 1_000_000n;
const BPS = BigInt(OFFER_BASIS_POINTS);

export interface GenerateSpecialOffersInput {
  categoryId: string;
  generationKey: string;
  policy: CategoryOfferPolicyInput;
  priceOptions: OfferEligiblePriceOption[];
  startsAt: Date;
}

function decimalThousandths(value: string | number) {
  const normalized = String(value).trim();
  const match = /^(\d+)(?:\.(\d{1,3}))?$/.exec(normalized);
  if (!match) return null;
  const whole = BigInt(match[1]!);
  const fraction = BigInt((match[2] ?? "").padEnd(3, "0"));
  return whole * 1_000n + fraction;
}

export function weightToMilligrams(value: string | number, unit: "G" | "KG") {
  const thousandths = decimalThousandths(value);
  if (thousandths === null || thousandths <= 0n) return null;
  return unit === "G"
    ? thousandths
    : thousandths * (MILLIGRAMS_PER_KILOGRAM / MILLIGRAMS_PER_GRAM);
}

function ceilDivide(value: bigint, divisor: bigint) {
  return (value + divisor - 1n) / divisor;
}

function gramsString(weightMilligrams: bigint) {
  const whole = weightMilligrams / MILLIGRAMS_PER_GRAM;
  const fraction = weightMilligrams % MILLIGRAMS_PER_GRAM;
  return fraction === 0n
    ? whole.toString()
    : `${whole}.${fraction.toString().padStart(3, "0").replace(/0+$/, "")}`;
}

function publicOfferId(
  generationKey: string,
  priceOptionId: string,
  bundleQuantity: number,
) {
  return createHash("sha256")
    .update(generationKey)
    .update(":")
    .update(priceOptionId)
    .update(":")
    .update(String(bundleQuantity))
    .digest("base64url")
    .slice(0, 32);
}

function tierQuantities(minimum: bigint, maximum: bigint, limit: number) {
  const available = maximum - minimum + 1n;
  const count = Number(available < BigInt(limit) ? available : BigInt(limit));
  if (count <= 1) return [minimum];
  const range = maximum - minimum;
  const denominator = BigInt(count - 1);
  const quantities = new Set<bigint>();
  for (let index = 0; index < count; index += 1) {
    const numerator = range * BigInt(index);
    quantities.add(minimum + (numerator + denominator / 2n) / denominator);
  }
  return [...quantities].sort((left, right) => (left < right ? -1 : 1));
}

function discountForWeight(
  totalWeightMilligrams: bigint,
  minimumWeightMilligrams: bigint,
  maximumWeightMilligrams: bigint,
  minimumDiscountBps: number,
  maximumDiscountBps: number,
) {
  const range = maximumWeightMilligrams - minimumWeightMilligrams;
  if (range <= 0n) return maximumDiscountBps;
  const progress = totalWeightMilligrams - minimumWeightMilligrams;
  const discountRange = BigInt(maximumDiscountBps - minimumDiscountBps);
  return minimumDiscountBps + Number((discountRange * progress) / range);
}

function safeRevenueFloor(costTotal: bigint, minimumMarginBps: number) {
  return ceilDivide(
    costTotal * BigInt(OFFER_BASIS_POINTS + minimumMarginBps),
    BPS,
  );
}

export function generateSpecialOffers(
  input: GenerateSpecialOffersInput,
): OfferGenerationResult {
  const policy = categoryOfferPolicySchema.parse(input.policy);
  const durationMinutes = Math.min(
    policy.durationMinutes,
    MAXIMUM_OFFER_DURATION_MINUTES,
  );
  const startsAt = new Date(input.startsAt);
  const endsAt = new Date(startsAt.getTime() + durationMinutes * 60_000);
  const minimumWeight =
    BigInt(Math.max(policy.minimumWeightGrams, MINIMUM_OFFER_WEIGHT_GRAMS)) *
    MILLIGRAMS_PER_GRAM;
  const maximumWeight = BigInt(policy.maximumWeightGrams) * MILLIGRAMS_PER_GRAM;
  const maximumDiscount = Math.min(
    policy.maximumDiscountBps,
    MAXIMUM_OFFER_DISCOUNT_BPS,
  );
  const offers: GeneratedSpecialOffer[] = [];
  const exclusions: OfferGenerationExclusion[] = [];

  if (!policy.enabled) return { offers, exclusions };

  for (const option of input.priceOptions) {
    if (option.costMinor === null) {
      exclusions.push({
        priceOptionId: option.priceOptionId,
        bundleQuantity: null,
        code: "COST_REQUIRED",
      });
      continue;
    }
    if (
      option.priceMinor <= 0n ||
      option.costMinor <= 0n ||
      option.costMinor >= option.priceMinor
    ) {
      exclusions.push({
        priceOptionId: option.priceOptionId,
        bundleQuantity: null,
        code: "INVALID_PRICE",
      });
      continue;
    }
    const baseWeight = weightToMilligrams(
      option.weightValue,
      option.weightUnit,
    );
    if (baseWeight === null) {
      exclusions.push({
        priceOptionId: option.priceOptionId,
        bundleQuantity: null,
        code: "INVALID_WEIGHT",
      });
      continue;
    }
    const minimumQuantity = ceilDivide(minimumWeight, baseWeight);
    const maximumQuantity = maximumWeight / baseWeight;
    if (minimumQuantity > maximumQuantity || maximumQuantity < 1n) {
      exclusions.push({
        priceOptionId: option.priceOptionId,
        bundleQuantity: null,
        code: "NO_QUALIFYING_WEIGHT",
      });
      continue;
    }

    for (const quantityValue of tierQuantities(
      minimumQuantity,
      maximumQuantity,
      policy.maxOffersPerPriceOption,
    )) {
      const quantity = Number(quantityValue);
      const totalWeight = baseWeight * quantityValue;
      const originalTotal = option.priceMinor * quantityValue;
      const proposedDiscountBps = discountForWeight(
        totalWeight,
        minimumWeight,
        maximumWeight,
        policy.minimumDiscountBps,
        maximumDiscount,
      );
      const proposedDiscount =
        (originalTotal * BigInt(proposedDiscountBps)) / BPS;
      const safeFloor = safeRevenueFloor(
        option.costMinor * quantityValue,
        policy.minimumMarginBps,
      );
      const availableDiscount = originalTotal - safeFloor;
      if (availableDiscount <= 0n) {
        exclusions.push({
          priceOptionId: option.priceOptionId,
          bundleQuantity: quantity,
          code: "MARGIN_PROTECTED",
        });
        continue;
      }
      const discount =
        proposedDiscount < availableDiscount
          ? proposedDiscount
          : availableDiscount;
      const actualDiscountBps = Number((discount * BPS) / originalTotal);
      if (discount <= 0n || actualDiscountBps < policy.minimumDiscountBps) {
        exclusions.push({
          priceOptionId: option.priceOptionId,
          bundleQuantity: quantity,
          code: "DISCOUNT_TOO_SMALL",
        });
        continue;
      }
      offers.push({
        publicId: publicOfferId(
          input.generationKey,
          option.priceOptionId,
          quantity,
        ),
        generationKey: input.generationKey,
        categoryId: input.categoryId,
        productId: option.productId,
        priceOptionId: option.priceOptionId,
        currency: option.currency,
        bundleQuantity: quantity,
        totalWeightGrams: gramsString(totalWeight),
        originalTotalMinor: originalTotal,
        discountBps: actualDiscountBps,
        discountMinor: discount,
        offerTotalMinor: originalTotal - discount,
        startsAt,
        endsAt,
      });
    }
  }

  return {
    offers: offers.sort(
      (left, right) =>
        left.productId.localeCompare(right.productId) ||
        left.priceOptionId.localeCompare(right.priceOptionId) ||
        left.bundleQuantity - right.bundleQuantity,
    ),
    exclusions,
  };
}
