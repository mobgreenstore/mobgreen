import "server-only";

import { unstable_cache } from "next/cache";
import type { Prisma } from "@/generated/prisma/client";
import type { PublicSpecialOfferPage } from "@/features/special-offers/public-types";
import { prisma } from "@/server/db/client";

const OFFER_PAGE_SIZE = 12;
const OFFER_CACHE_SECONDS = 60;

export const getPublicSpecialOffers = unstable_cache(
  async (input: {
    categorySlug: string;
    page: number;
  }): Promise<PublicSpecialOfferPage> => {
    if (!input.categorySlug) {
      return {
        offers: [],
        page: 1,
        pageSize: OFFER_PAGE_SIZE,
        totalCount: 0,
        totalPages: 1,
      };
    }
    const now = new Date();
    const where = {
      status: "ACTIVE",
      startsAt: { lte: now },
      endsAt: { gt: now },
      archivedAt: null,
      category: {
        slug: input.categorySlug,
        isActive: true,
        archivedAt: null,
        offerPolicy: { enabled: true },
      },
      product: { status: "ACTIVE", archivedAt: null },
      priceOption: { isActive: true, archivedAt: null },
    } satisfies Prisma.SpecialOfferWhereInput;
    const totalCount = await prisma.specialOffer.count({ where });
    const totalPages = Math.max(1, Math.ceil(totalCount / OFFER_PAGE_SIZE));
    const page = Math.min(Math.max(1, input.page), totalPages);
    const records = await prisma.specialOffer.findMany({
      where,
      orderBy: [
        { discountBps: "desc" },
        { totalWeightGrams: "asc" },
        { publicId: "asc" },
      ],
      skip: (page - 1) * OFFER_PAGE_SIZE,
      take: OFFER_PAGE_SIZE,
      select: {
        publicId: true,
        category: { select: { slug: true } },
        productId: true,
        product: {
          select: {
            slug: true,
            name: true,
            images: {
              orderBy: [{ isCover: "desc" }, { position: "asc" }],
              take: 1,
              select: {
                id: true,
                url: true,
                altText: true,
                width: true,
                height: true,
              },
            },
          },
        },
        priceOptionId: true,
        currency: true,
        bundleQuantity: true,
        totalWeightGrams: true,
        originalTotalMinor: true,
        discountBps: true,
        discountMinor: true,
        offerTotalMinor: true,
        startsAt: true,
        endsAt: true,
      },
    });
    return {
      offers: records.map((offer) => ({
        publicId: offer.publicId,
        categorySlug: offer.category.slug,
        productId: offer.productId,
        productSlug: offer.product.slug,
        productName: offer.product.name,
        image: offer.product.images[0] ?? null,
        priceOptionId: offer.priceOptionId,
        currency: offer.currency,
        bundleQuantity: offer.bundleQuantity,
        totalWeightGrams: offer.totalWeightGrams.toString(),
        originalTotalMinor: Number(offer.originalTotalMinor),
        discountBps: offer.discountBps,
        discountMinor: Number(offer.discountMinor),
        offerTotalMinor: Number(offer.offerTotalMinor),
        startsAt: offer.startsAt.toISOString(),
        endsAt: offer.endsAt.toISOString(),
      })),
      page,
      pageSize: OFFER_PAGE_SIZE,
      totalCount,
      totalPages,
    };
  },
  ["public-special-offers"],
  { tags: ["catalog", "special-offers"], revalidate: OFFER_CACHE_SECONDS },
);
