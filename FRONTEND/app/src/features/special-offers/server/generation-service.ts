import "server-only";

import { z } from "zod";
import { generateSpecialOffers } from "@/features/special-offers/server/generator";
import type { SpecialOfferGenerationSource } from "@/features/special-offers/server/generation-source";

const generationRequestSchema = z.object({
  categoryId: z.uuid(),
  generationKey: z.uuid(),
  startsAt: z.date(),
});

export type SpecialOfferGenerationErrorCode =
  | "CATEGORY_NOT_FOUND"
  | "CATEGORY_UNAVAILABLE"
  | "POLICY_NOT_CONFIGURED"
  | "POLICY_DISABLED";

export class SpecialOfferGenerationError extends Error {
  constructor(
    readonly code: SpecialOfferGenerationErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "SpecialOfferGenerationError";
  }
}

export class SpecialOfferGenerationService {
  constructor(private readonly source: SpecialOfferGenerationSource) {}

  async generate(request: {
    categoryId: string;
    generationKey: string;
    startsAt: Date;
  }) {
    const input = generationRequestSchema.parse(request);
    const category = await this.source.loadCategory(input.categoryId);
    if (!category) {
      throw new SpecialOfferGenerationError(
        "CATEGORY_NOT_FOUND",
        "The category was not found.",
      );
    }
    if (!category.isActive || category.archivedAt) {
      throw new SpecialOfferGenerationError(
        "CATEGORY_UNAVAILABLE",
        "Offers can be generated only for an active category.",
      );
    }
    if (!category.policy) {
      throw new SpecialOfferGenerationError(
        "POLICY_NOT_CONFIGURED",
        "Configure the category offer policy first.",
      );
    }
    if (!category.policy.enabled) {
      throw new SpecialOfferGenerationError(
        "POLICY_DISABLED",
        "Special offers are disabled for this category.",
      );
    }
    return generateSpecialOffers({
      categoryId: category.id,
      generationKey: input.generationKey,
      policy: category.policy,
      priceOptions: category.priceOptions,
      startsAt: input.startsAt,
    });
  }
}
