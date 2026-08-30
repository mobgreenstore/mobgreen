"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StoreDiscoveryHeader } from "@/components/shared/store-discovery-header";
import { CategoryShowcaseRail } from "@/features/catalog/components/category-showcase-rail";
import { CategoryTabRail } from "@/features/catalog/components/category-tab-rail";
import { catalogHref } from "@/features/catalog/params";
import type {
  CatalogCategoryViewModel,
  CatalogSort,
} from "@/features/catalog/types";

export function CatalogDiscovery({
  categories,
  activeCategorySlug,
  search,
  sort,
}: {
  categories: readonly CatalogCategoryViewModel[];
  activeCategorySlug: string;
  search: string;
  sort: CatalogSort;
}) {
  const router = useRouter();
  const [focusedSlug, setFocusedSlug] = useState(activeCategorySlug);
  const focusedCategory = categories.find(
    (category) => category.slug === focusedSlug,
  );
  const displayTone = focusedCategory?.displayTone ?? "MIST";

  function commitCategory(slug: string) {
    if (!slug || slug === activeCategorySlug) return;
    router.replace(
      catalogHref({
        category: slug,
        search,
        sort,
      }),
      { scroll: false },
    );
  }

  return (
    <>
      <StoreDiscoveryHeader
        search={search}
        categorySlug={activeCategorySlug}
        sort={sort}
        displayTone={displayTone}
        navigation={
          <CategoryTabRail
            categories={categories}
            activeCategorySlug={focusedSlug}
            search={search}
            sort={sort}
            displayTone={displayTone}
          />
        }
      />
      <CategoryShowcaseRail
        categories={categories}
        activeCategorySlug={activeCategorySlug}
        search={search}
        sort={sort}
        displayTone={displayTone}
        onFocusedCategoryChange={setFocusedSlug}
        onFocusedCategoryCommit={commitCategory}
      />
    </>
  );
}
