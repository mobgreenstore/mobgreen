import type { CategoryDisplayTone } from "@/config/category-presentation";
import type { SupportedCurrency, WeightUnit } from "@/config/commerce";
import type {
  CommerceImage,
  CommerceVideo,
  WeightPriceOption,
} from "@/types/commerce";

export const CATALOG_SORTS = ["newest", "name-asc", "name-desc"] as const;
export type CatalogSort = (typeof CATALOG_SORTS)[number];
export const CATALOG_VIEWS = ["products", "offers"] as const;
export type CatalogView = (typeof CATALOG_VIEWS)[number];

export interface CatalogCategoryViewModel {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  displayTone: CategoryDisplayTone;
  image: CommerceImage | null;
  productCount: number;
  strongestOffer?: {
    publicId: string;
    discountBps: number;
    totalWeightGrams: string;
    endsAt: string;
  } | null;
}

export interface CatalogProductCardViewModel {
  id: string;
  slug: string;
  name: string;
  categoryName: string;
  coverImage: CommerceImage | null;
  primaryPrice: WeightPriceOption;
}

export interface CatalogPageViewModel {
  categories: CatalogCategoryViewModel[];
  products: CatalogProductCardViewModel[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface CatalogProductDetailViewModel {
  id: string;
  slug: string;
  name: string;
  categoryName: string;
  categorySlug: string;
  shortDescription: string;
  description: string | null;
  images: CommerceImage[];
  video: CommerceVideo | null;
  priceOptions: Array<{
    id: string;
    weightValue: number;
    weightUnit: WeightUnit;
    currency: SupportedCurrency;
    priceMinor: number;
    available: true;
  }>;
}
