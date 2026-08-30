import "server-only";

import { prisma } from "@/server/db/client";
import type { DatabaseClient } from "@/server/db/transaction";
import type {
  CartPriceRecord,
  CartRepository,
} from "@/features/cart/server/cart-repository";

export class PrismaCartRepository implements CartRepository {
  constructor(private readonly database: DatabaseClient = prisma) {}
  async findPriceOptions(ids: readonly string[]): Promise<CartPriceRecord[]> {
    if (ids.length === 0) return [];
    const options = await this.database.productPriceOption.findMany({
      where: { id: { in: [...ids] } },
      select: {
        id: true,
        productId: true,
        weightValue: true,
        weightUnit: true,
        currency: true,
        priceMinor: true,
        costMinor: true,
        isActive: true,
        archivedAt: true,
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
            archivedAt: true,
            category: {
              select: {
                isActive: true,
                archivedAt: true,
                offerPolicy: {
                  select: { enabled: true, minimumMarginBps: true },
                },
              },
            },
            images: {
              select: {
                id: true,
                url: true,
                altText: true,
                width: true,
                height: true,
                isCover: true,
              },
              orderBy: { position: "asc" },
            },
          },
        },
      },
    });

    return options.map((option) => {
      const images = option.product.images ?? [];
      const image = images.find((item) => item.isCover) ?? images[0] ?? null;
      return {
        id: option.id,
        productId: option.productId,
        weightValue: Number(option.weightValue),
        weightUnit: option.weightUnit,
        currency: option.currency,
        priceMinor: option.priceMinor,
        costMinor: option.costMinor,
        isActive: option.isActive,
        archivedAt: option.archivedAt,
        product: {
          id: option.product.id,
          name: option.product.name,
          slug: option.product.slug,
          status: option.product.status,
          archivedAt: option.product.archivedAt,
          categoryActive: option.product.category.isActive,
          categoryArchivedAt: option.product.category.archivedAt,
          offerPolicy: option.product.category.offerPolicy,
          image: image
            ? {
                id: image.id,
                url: image.url,
                altText: image.altText,
                width: image.width,
                height: image.height,
              }
            : null,
        },
      };
    });
  }

  async findOffers(publicIds: readonly string[]) {
    if (publicIds.length === 0) return [];
    const offers = await this.database.specialOffer.findMany({
      where: { publicId: { in: [...publicIds] } },
      select: {
        id: true,
        publicId: true,
        productId: true,
        priceOptionId: true,
        currency: true,
        bundleQuantity: true,
        totalWeightGrams: true,
        originalTotalMinor: true,
        discountBps: true,
        discountMinor: true,
        offerTotalMinor: true,
        status: true,
        startsAt: true,
        endsAt: true,
        archivedAt: true,
      },
    });
    const options = await this.findPriceOptions(
      offers.map((offer) => offer.priceOptionId),
    );
    const byId = new Map(options.map((option) => [option.id, option]));
    return offers.flatMap((offer) => {
      const priceOption = byId.get(offer.priceOptionId);
      return priceOption
        ? [
            {
              ...offer,
              totalWeightGrams: Number(offer.totalWeightGrams),
              priceOption,
            },
          ]
        : [];
    });
  }
}
