import "server-only";

import { Prisma, SpecialOfferStatus } from "@/generated/prisma/client";
import {
  campaignLifecycleSchema,
  campaignRequestSchema,
  categoryOfferPolicyWriteSchema,
  priceOptionCostWriteSchema,
} from "@/features/special-offers/management-schema";
import { SpecialOfferGenerationService } from "@/features/special-offers/server/generation-service";
import { PrismaSpecialOfferGenerationSource } from "@/features/special-offers/server/prisma-generation-source";
import type { OfferGenerationResult } from "@/features/special-offers/types";
import { logger } from "@/server/core/logger";
import { prisma } from "@/server/db/client";

export class SpecialOfferCampaignError extends Error {
  constructor(
    readonly code:
      | "CATEGORY_NOT_FOUND"
      | "PRICE_OPTION_NOT_FOUND"
      | "EMPTY_CAMPAIGN"
      | "CAMPAIGN_NOT_FOUND"
      | "CAMPAIGN_OVERLAP",
    message: string,
  ) {
    super(message);
    this.name = "SpecialOfferCampaignError";
  }
}

function offerRows(result: OfferGenerationResult, status: SpecialOfferStatus) {
  return result.offers.map((offer) => ({
    publicId: offer.publicId,
    generationKey: offer.generationKey,
    categoryId: offer.categoryId,
    productId: offer.productId,
    priceOptionId: offer.priceOptionId,
    currency: offer.currency,
    bundleQuantity: offer.bundleQuantity,
    totalWeightGrams: offer.totalWeightGrams,
    originalTotalMinor: offer.originalTotalMinor,
    discountBps: offer.discountBps,
    discountMinor: offer.discountMinor,
    offerTotalMinor: offer.offerTotalMinor,
    status,
    startsAt: offer.startsAt,
    endsAt: offer.endsAt,
  }));
}

async function assertNoOverlap(
  transaction: Prisma.TransactionClient,
  offers: readonly {
    priceOptionId: string;
    startsAt: Date;
    endsAt: Date;
  }[],
  ignoredGenerationKey?: string,
) {
  if (!offers.length) return;
  const startsAt = offers[0]!.startsAt;
  const endsAt = offers[0]!.endsAt;
  const conflict = await transaction.specialOffer.findFirst({
    where: {
      priceOptionId: { in: offers.map((offer) => offer.priceOptionId) },
      status: SpecialOfferStatus.ACTIVE,
      startsAt: { lt: endsAt },
      endsAt: { gt: startsAt },
      ...(ignoredGenerationKey
        ? { generationKey: { not: ignoredGenerationKey } }
        : {}),
    },
    select: { id: true },
  });
  if (conflict) {
    throw new SpecialOfferCampaignError(
      "CAMPAIGN_OVERLAP",
      "An active campaign already covers one of these product options.",
    );
  }
}

export class SpecialOfferCampaignService {
  constructor(
    private readonly generator = new SpecialOfferGenerationService(
      new PrismaSpecialOfferGenerationSource(),
    ),
  ) {}

  async savePolicy(input: unknown) {
    const { categoryId, policy } = categoryOfferPolicyWriteSchema.parse(input);
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true },
    });
    if (!category) {
      throw new SpecialOfferCampaignError(
        "CATEGORY_NOT_FOUND",
        "The category was not found.",
      );
    }
    const saved = await prisma.categoryOfferPolicy.upsert({
      where: { categoryId },
      create: { categoryId, ...policy },
      update: policy,
    });
    logger.info("special_offer.policy_saved", {
      categoryId,
      enabled: saved.enabled,
    });
    return saved;
  }

  async updateCost(input: unknown) {
    const { priceOptionId, costMinor } =
      priceOptionCostWriteSchema.parse(input);
    const option = await prisma.productPriceOption.findUnique({
      where: { id: priceOptionId },
      select: { id: true, priceMinor: true },
    });
    if (!option) {
      throw new SpecialOfferCampaignError(
        "PRICE_OPTION_NOT_FOUND",
        "The price option was not found.",
      );
    }
    if (costMinor !== null && costMinor >= option.priceMinor) {
      throw new Error("Cost must remain below the normal selling price.");
    }
    const saved = await prisma.productPriceOption.update({
      where: { id: priceOptionId },
      data: { costMinor },
    });
    logger.info("special_offer.cost_saved", {
      priceOptionId,
      configured: costMinor !== null,
    });
    return saved;
  }

  preview(input: unknown) {
    const request = campaignRequestSchema.parse(input);
    return this.generator.generate({ ...request, startsAt: new Date() });
  }

  async persistDraft(input: unknown) {
    const request = campaignRequestSchema.parse(input);
    const result = await this.generator.generate({
      ...request,
      startsAt: new Date(),
    });
    if (!result.offers.length) {
      throw new SpecialOfferCampaignError(
        "EMPTY_CAMPAIGN",
        "No profitable offers could be generated from the current products.",
      );
    }
    await prisma.$transaction(
      async (transaction) => {
        await transaction.specialOffer.deleteMany({
          where: {
            generationKey: request.generationKey,
            status: SpecialOfferStatus.DRAFT,
          },
        });
        await transaction.specialOffer.createMany({
          data: offerRows(result, SpecialOfferStatus.DRAFT),
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    logger.info("special_offer.campaign_drafted", {
      categoryId: request.categoryId,
      generationKey: request.generationKey,
      offerCount: result.offers.length,
    });
    return result;
  }

  async activate(input: unknown) {
    const request = campaignLifecycleSchema.parse(input);
    return prisma.$transaction(
      async (transaction) => {
        const drafts = await transaction.specialOffer.findMany({
          where: {
            categoryId: request.categoryId,
            generationKey: request.generationKey,
            status: SpecialOfferStatus.DRAFT,
          },
        });
        if (!drafts.length) {
          throw new SpecialOfferCampaignError(
            "CAMPAIGN_NOT_FOUND",
            "The draft campaign was not found.",
          );
        }
        const now = new Date();
        await transaction.specialOffer.updateMany({
          where: {
            status: SpecialOfferStatus.ACTIVE,
            endsAt: { lte: now },
          },
          data: { status: SpecialOfferStatus.EXPIRED },
        });
        await assertNoOverlap(transaction, drafts);
        const result = await transaction.specialOffer.updateMany({
          where: {
            categoryId: request.categoryId,
            generationKey: request.generationKey,
            status: SpecialOfferStatus.DRAFT,
            endsAt: { gt: now },
          },
          data: { status: SpecialOfferStatus.ACTIVE },
        });
        logger.info("special_offer.campaign_activated", {
          categoryId: request.categoryId,
          generationKey: request.generationKey,
          offerCount: result.count,
        });
        return result.count;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async cancel(input: unknown) {
    const request = campaignLifecycleSchema.parse(input);
    const result = await prisma.specialOffer.updateMany({
      where: {
        categoryId: request.categoryId,
        generationKey: request.generationKey,
        status: { in: [SpecialOfferStatus.DRAFT, SpecialOfferStatus.ACTIVE] },
      },
      data: {
        status: SpecialOfferStatus.CANCELLED,
        archivedAt: new Date(),
      },
    });
    if (!result.count) {
      throw new SpecialOfferCampaignError(
        "CAMPAIGN_NOT_FOUND",
        "No cancellable campaign was found.",
      );
    }
    logger.info("special_offer.campaign_cancelled", {
      categoryId: request.categoryId,
      generationKey: request.generationKey,
      offerCount: result.count,
    });
    return result.count;
  }

  async expire(now = new Date()) {
    const result = await prisma.specialOffer.updateMany({
      where: {
        status: SpecialOfferStatus.ACTIVE,
        endsAt: { lte: now },
      },
      data: { status: SpecialOfferStatus.EXPIRED },
    });
    return result.count;
  }

  async regenerate(input: unknown) {
    const request = campaignLifecycleSchema.parse(input);
    const generationKey = crypto.randomUUID();
    const result = await this.generator.generate({
      categoryId: request.categoryId,
      generationKey,
      startsAt: new Date(),
    });
    if (!result.offers.length) {
      throw new SpecialOfferCampaignError(
        "EMPTY_CAMPAIGN",
        "No profitable offers could be generated from the current products.",
      );
    }
    await prisma.$transaction(
      async (transaction) => {
        await transaction.specialOffer.updateMany({
          where: {
            categoryId: request.categoryId,
            generationKey: request.generationKey,
            status: {
              in: [SpecialOfferStatus.DRAFT, SpecialOfferStatus.ACTIVE],
            },
          },
          data: {
            status: SpecialOfferStatus.CANCELLED,
            archivedAt: new Date(),
          },
        });
        await transaction.specialOffer.createMany({
          data: offerRows(result, SpecialOfferStatus.DRAFT),
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    logger.info("special_offer.campaign_regenerated", {
      categoryId: request.categoryId,
      previousGenerationKey: request.generationKey,
      generationKey,
      offerCount: result.offers.length,
    });
    return result;
  }
}
