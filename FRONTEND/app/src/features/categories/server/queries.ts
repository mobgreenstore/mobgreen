import "server-only";

import type { CategoryDisplayTone } from "@/config/category-presentation";
import type { CategoryListFilters } from "@/server/repositories/contracts";
import { PrismaCategoryRepository } from "@/server/repositories/prisma";
import type { ManagedImage } from "@/types/media";

export interface CategoryViewModel {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  displayTone: CategoryDisplayTone;
  image: ManagedImage | null;
  isActive: boolean;
  isArchived: boolean;
  productCount: number;
  position: number;
  updatedAt: string;
}

function categoryImage(category: {
  imagePublicId: string | null;
  imageUrl: string | null;
  imageAltText: string | null;
  imageWidth: number | null;
  imageHeight: number | null;
}): ManagedImage | null {
  if (
    !category.imagePublicId ||
    !category.imageUrl ||
    !category.imageAltText ||
    !category.imageWidth ||
    !category.imageHeight
  ) {
    return null;
  }
  return {
    id: category.imagePublicId,
    publicId: category.imagePublicId,
    url: category.imageUrl,
    altText: category.imageAltText,
    width: category.imageWidth,
    height: category.imageHeight,
    position: 0,
    isCover: true,
    persisted: true,
  };
}

export class CategoryQueryService {
  constructor(private readonly repository = new PrismaCategoryRepository()) {}

  async list(filters: CategoryListFilters): Promise<CategoryViewModel[]> {
    const categories = await this.repository.list(filters);
    return categories.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      displayTone: category.displayTone,
      image: categoryImage(category),
      isActive: category.isActive,
      isArchived: category.archivedAt !== null,
      productCount: category._count.products,
      position: category.position,
      updatedAt: category.updatedAt.toISOString(),
    }));
  }

  async get(id: string): Promise<CategoryViewModel | null> {
    const category = await this.repository.findById(id);
    if (!category) return null;
    const productCount = await this.repository.countProducts(id);
    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      displayTone: category.displayTone,
      image: categoryImage(category),
      isActive: category.isActive,
      isArchived: category.archivedAt !== null,
      productCount,
      position: category.position,
      updatedAt: category.updatedAt.toISOString(),
    };
  }
}
