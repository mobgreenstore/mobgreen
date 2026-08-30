import {
  CATALOG_SORTS,
  CATALOG_VIEWS,
  type CatalogSort,
  type CatalogView,
} from "@/features/catalog/types";

const MAX_SEARCH_LENGTH = 120;

export function normalizeCatalogSearch(value: string | undefined) {
  return (value ?? "")
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, MAX_SEARCH_LENGTH);
}

export function parseCatalogSort(value: string | undefined): CatalogSort {
  return CATALOG_SORTS.includes(value as CatalogSort)
    ? (value as CatalogSort)
    : "newest";
}

export function parseCatalogView(value: string | undefined): CatalogView {
  return CATALOG_VIEWS.includes(value as CatalogView)
    ? (value as CatalogView)
    : "products";
}

export function parseCatalogPage(value: string | undefined) {
  const parsed = Number.parseInt(value ?? "1", 10);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 1;
}

export function catalogHref(input: {
  category?: string;
  search?: string;
  sort?: CatalogSort;
  page?: number;
  view?: "products" | "offers";
}) {
  const params = new URLSearchParams();
  if (input.category) params.set("category", input.category);
  if (input.search) params.set("q", input.search);
  if (input.sort && input.sort !== "newest") params.set("sort", input.sort);
  if (input.page && input.page > 1) params.set("page", String(input.page));
  if (input.view === "offers") params.set("view", "offers");
  const query = params.toString();
  return query ? `/?${query}` : "/";
}

export function catalogResultsHref(input: Parameters<typeof catalogHref>[0]) {
  return `${catalogHref(input)}#catalog-results`;
}
