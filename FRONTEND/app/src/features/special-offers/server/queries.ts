import "server-only";

import { SpecialOfferStatus } from "@/generated/prisma/client";
import { DEFAULT_CATEGORY_OFFER_POLICY } from "@/features/special-offers/contract";
import { prisma } from "@/server/db/client";

export async function getCategoryOfferAdmin(categoryId: string) {
  await prisma.specialOffer.updateMany({
    where: { status: SpecialOfferStatus.ACTIVE, endsAt: { lte: new Date() } },
    data: { status: SpecialOfferStatus.EXPIRED },
  });
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    select: {
      id: true,
      name: true,
      offerPolicy: true,
      products: {
        where: { archivedAt: null },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          status: true,
          priceOptions: {
            where: { archivedAt: null },
            orderBy: { position: "asc" },
            select: {
              id: true,
              weightValue: true,
              weightUnit: true,
              currency: true,
              priceMinor: true,
              costMinor: true,
              isActive: true,
            },
          },
        },
      },
      specialOffers: {
        orderBy: [{ createdAt: "desc" }, { discountBps: "desc" }],
        take: 200,
        select: {
          id: true,
          publicId: true,
          generationKey: true,
          status: true,
          discountBps: true,
          bundleQuantity: true,
          totalWeightGrams: true,
          currency: true,
          originalTotalMinor: true,
          offerTotalMinor: true,
          startsAt: true,
          endsAt: true,
          product: { select: { name: true } },
        },
      },
    },
  });
  if (!category) return null;
  const storedPolicy = category.offerPolicy;
  const policy = storedPolicy
    ? {
        enabled: storedPolicy.enabled,
        minimumWeightGrams: storedPolicy.minimumWeightGrams,
        maximumWeightGrams: storedPolicy.maximumWeightGrams,
        minimumDiscountBps: storedPolicy.minimumDiscountBps,
        maximumDiscountBps: storedPolicy.maximumDiscountBps,
        minimumMarginBps: storedPolicy.minimumMarginBps,
        durationMinutes: storedPolicy.durationMinutes,
        maxOffersPerPriceOption: storedPolicy.maxOffersPerPriceOption,
      }
    : DEFAULT_CATEGORY_OFFER_POLICY;
  const campaigns = new Map<
    string,
    {
      generationKey: string;
      status: SpecialOfferStatus;
      startsAt: string;
      endsAt: string;
      offers: Array<{
        publicId: string;
        productName: string;
        discountBps: number;
        bundleQuantity: number;
        totalWeightGrams: string;
        currency: "GBP" | "EUR" | "USD";
        originalTotalMinor: string;
        offerTotalMinor: string;
      }>;
    }
  >();
  for (const offer of category.specialOffers) {
    const campaign = campaigns.get(offer.generationKey) ?? {
      generationKey: offer.generationKey,
      status: offer.status,
      startsAt: offer.startsAt.toISOString(),
      endsAt: offer.endsAt.toISOString(),
      offers: [],
    };
    campaign.offers.push({
      publicId: offer.publicId,
      productName: offer.product.name,
      discountBps: offer.discountBps,
      bundleQuantity: offer.bundleQuantity,
      totalWeightGrams: offer.totalWeightGrams.toString(),
      currency: offer.currency,
      originalTotalMinor: offer.originalTotalMinor.toString(),
      offerTotalMinor: offer.offerTotalMinor.toString(),
    });
    campaigns.set(offer.generationKey, campaign);
  }
  return {
    id: category.id,
    name: category.name,
    policy,
    products: category.products.map((product) => ({
      ...product,
      priceOptions: product.priceOptions.map((option) => ({
        ...option,
        weightValue: option.weightValue.toString(),
        priceMinor: option.priceMinor.toString(),
        costMinor: option.costMinor?.toString() ?? null,
      })),
    })),
    campaigns: [...campaigns.values()],
  };
}

export async function getStrongestActiveOffers(categoryIds: readonly string[]) {
  if (!categoryIds.length) return new Map();
  const now = new Date();
  await prisma.specialOffer.updateMany({
    where: { status: SpecialOfferStatus.ACTIVE, endsAt: { lte: now } },
    data: { status: SpecialOfferStatus.EXPIRED },
  });
  const offers = await prisma.specialOffer.findMany({
    where: {
      categoryId: { in: [...categoryIds] },
      status: SpecialOfferStatus.ACTIVE,
      startsAt: { lte: now },
      endsAt: { gt: now },
      archivedAt: null,
      product: { status: "ACTIVE", archivedAt: null },
      priceOption: { isActive: true, archivedAt: null },
    },
    orderBy: [{ discountBps: "desc" }, { totalWeightGrams: "asc" }],
    select: {
      categoryId: true,
      publicId: true,
      discountBps: true,
      totalWeightGrams: true,
      endsAt: true,
    },
  });
  const strongest = new Map<
    string,
    {
      publicId: string;
      discountBps: number;
      totalWeightGrams: string;
      endsAt: string;
    }
  >();
  for (const offer of offers) {
    if (!strongest.has(offer.categoryId)) {
      strongest.set(offer.categoryId, {
        publicId: offer.publicId,
        discountBps: offer.discountBps,
        totalWeightGrams: offer.totalWeightGrams.toString(),
        endsAt: offer.endsAt.toISOString(),
      });
    }
  }
  return strongest;
}
