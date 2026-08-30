import "server-only";

import { prisma } from "@/server/db/client";
import type {
  OfferGenerationCategoryRecord,
  SpecialOfferGenerationSource,
} from "@/features/special-offers/server/generation-source";

export class PrismaSpecialOfferGenerationSource implements SpecialOfferGenerationSource {
  async loadCategory(
    categoryId: string,
  ): Promise<OfferGenerationCategoryRecord | null> {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: {
        id: true,
        isActive: true,
        archivedAt: true,
        offerPolicy: {
          select: {
            enabled: true,
            minimumWeightGrams: true,
            maximumWeightGrams: true,
            minimumDiscountBps: true,
            maximumDiscountBps: true,
            minimumMarginBps: true,
            durationMinutes: true,
            maxOffersPerPriceOption: true,
          },
        },
        products: {
          where: { status: "ACTIVE", archivedAt: null },
          select: {
            id: true,
            priceOptions: {
              where: { isActive: true, archivedAt: null },
              orderBy: { position: "asc" },
              select: {
                id: true,
                weightValue: true,
                weightUnit: true,
                currency: true,
                priceMinor: true,
                costMinor: true,
              },
            },
          },
        },
      },
    });
    if (!category) return null;
    return {
      id: category.id,
      isActive: category.isActive,
      archivedAt: category.archivedAt,
      policy: category.offerPolicy,
      priceOptions: category.products.flatMap((product) =>
        product.priceOptions.map((option) => ({
          productId: product.id,
          priceOptionId: option.id,
          weightValue: option.weightValue.toString(),
          weightUnit: option.weightUnit,
          currency: option.currency,
          priceMinor: option.priceMinor,
          costMinor: option.costMinor,
        })),
      ),
    };
  }
}
