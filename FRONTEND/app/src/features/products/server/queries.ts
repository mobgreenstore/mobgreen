import "server-only";

import type {
  ProductListFilters,
  ProductWithRelations,
} from "@/server/repositories/contracts";
import { PrismaProductRepository } from "@/server/repositories/prisma";
import type { ManagedImage, ManagedVideo } from "@/types/media";

export interface ProductPriceViewModel {
  id: string;
  weightValue: string;
  weightUnit: "G" | "KG";
  currency: "GBP" | "EUR" | "USD";
  priceMinor: string;
  compareAtPriceMinor: string | null;
  costMinor: string | null;
  position: number;
  isActive: boolean;
}

export interface ProductViewModel {
  id: string;
  categoryId: string;
  categoryName: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string | null;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  isArchived: boolean;
  images: ManagedImage[];
  video: ManagedVideo | null;
  priceOptions: ProductPriceViewModel[];
  currencies: ("GBP" | "EUR" | "USD")[];
  updatedAt: string;
}

function toViewModel(product: ProductWithRelations): ProductViewModel {
  return {
    id: product.id,
    categoryId: product.categoryId,
    categoryName: product.category.name,
    name: product.name,
    slug: product.slug,
    shortDescription: product.shortDescription,
    description: product.description,
    status: product.status,
    isArchived: product.archivedAt !== null,
    images: product.images.map((image) => ({
      id: image.id,
      publicId: image.cloudinaryPublicId,
      url: image.url,
      altText: image.altText,
      width: image.width,
      height: image.height,
      position: image.position,
      isCover: image.isCover,
      persisted: true,
    })),
    video: product.video
      ? {
          id: product.video.id,
          publicId: product.video.cloudinaryPublicId,
          url: product.video.url,
          posterUrl: product.video.posterUrl,
          altText: product.video.altText,
          width: product.video.width,
          height: product.video.height,
          durationSeconds: product.video.durationSeconds,
          persisted: true,
        }
      : null,
    priceOptions: product.priceOptions.map((option) => ({
      id: option.id,
      weightValue: option.weightValue.toString(),
      weightUnit: option.weightUnit,
      currency: option.currency,
      priceMinor: option.priceMinor.toString(),
      compareAtPriceMinor: option.compareAtPriceMinor?.toString() ?? null,
      costMinor: option.costMinor?.toString() ?? null,
      position: option.position,
      isActive: option.isActive,
    })),
    currencies: Array.from(
      new Set(product.priceOptions.map((option) => option.currency)),
    ),
    updatedAt: product.updatedAt.toISOString(),
  };
}

export class ProductQueryService {
  constructor(private readonly repository = new PrismaProductRepository()) {}

  async list(filters: ProductListFilters): Promise<ProductViewModel[]> {
    return (await this.repository.list(filters)).map(toViewModel);
  }

  async get(id: string): Promise<ProductViewModel | null> {
    const product = await this.repository.findById(id);
    return product ? toViewModel(product) : null;
  }
}
