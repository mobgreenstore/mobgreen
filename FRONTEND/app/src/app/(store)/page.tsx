import type { Metadata } from "next";
import Link from "next/link";
import { PackageSearch, SearchX } from "lucide-react";
import { ProductCard } from "@/components/commerce/product-card";
import { ProductGrid } from "@/components/commerce/product-grid";
import { EmptyState, Pagination, buttonVariants } from "@/components/ui";
import { CatalogDiscovery } from "@/features/catalog/components/catalog-discovery";
import { CatalogResultsHeader } from "@/features/catalog/components/catalog-results-header";
import { CatalogToolbar } from "@/features/catalog/components/catalog-toolbar";
import { CatalogViewTabs } from "@/features/catalog/components/catalog-view-tabs";
import {
  catalogHref,
  normalizeCatalogSearch,
  parseCatalogPage,
  parseCatalogSort,
  parseCatalogView,
} from "@/features/catalog/params";
import { getCatalogPage } from "@/features/catalog/server/queries";
import { PublicOfferCard } from "@/features/special-offers/components/public-offer-card";
import { getPublicSpecialOffers } from "@/features/special-offers/server/public-queries";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Fresh goods",
  description:
    "Browse real MOB GREENS products by category, weight, and currency.",
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const search = normalizeCatalogSearch(first(params.q));
  const sort = parseCatalogSort(first(params.sort));
  const view = parseCatalogView(first(params.view));
  const requestedCategory = first(params.category)?.trim().slice(0, 140) ?? "";
  const requestedPage = parseCatalogPage(first(params.page));
  const [catalog, offerPage] = await Promise.all([
    getCatalogPage({
      categorySlug: requestedCategory,
      search,
      sort,
      page: view === "products" ? requestedPage : 1,
    }),
    getPublicSpecialOffers({
      categorySlug: requestedCategory,
      page: view === "offers" ? requestedPage : 1,
    }),
  ]);
  const activeCategory = catalog.categories.find(
    (category) => category.slug === requestedCategory,
  );
  const categorySlug = activeCategory?.slug ?? "";
  const hasFilters = Boolean(categorySlug || search);

  return (
    <div className="min-h-dvh bg-background">
      <CatalogDiscovery
        key={categorySlug || "all-goods"}
        categories={catalog.categories}
        activeCategorySlug={categorySlug}
        search={search}
        sort={sort}
      />

      <main>
        <section aria-labelledby="catalog-results" className="bg-surface">
          <div className="mx-auto max-w-[var(--content-max)] px-3 py-6 sm:px-6 sm:py-8 lg:px-8">
            <div id="catalog-results" className="scroll-mt-40 sm:scroll-mt-36">
              <CatalogViewTabs
                activeView={view}
                categorySlug={categorySlug}
                search={search}
                sort={sort}
                offerCount={activeCategory ? offerPage.totalCount : 0}
              />
              <div className="mt-5">
                <CatalogResultsHeader
                  categoryName={activeCategory?.name ?? "All goods"}
                  resultCount={
                    view === "offers"
                      ? offerPage.totalCount
                      : catalog.totalCount
                  }
                  toolbar={
                    view === "products" ? (
                      <CatalogToolbar
                        categorySlug={categorySlug}
                        search={search}
                        sort={sort}
                      />
                    ) : undefined
                  }
                />
              </div>
            </div>

            <div className="mt-5 sm:mt-6">
              {view === "offers" ? (
                offerPage.offers.length ? (
                  <>
                    <div className="grid grid-cols-1 gap-4 min-[390px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {offerPage.offers.map((offer, index) => (
                        <PublicOfferCard
                          key={offer.publicId}
                          offer={offer}
                          priority={index < 4}
                        />
                      ))}
                    </div>
                    <Pagination
                      currentPage={offerPage.page}
                      totalPages={offerPage.totalPages}
                      className="mt-8 sm:mt-10"
                      label="Offer pages"
                      getHref={(page) =>
                        catalogHref({
                          category: categorySlug,
                          search,
                          sort,
                          page,
                          view: "offers",
                        })
                      }
                    />
                  </>
                ) : (
                  <EmptyState
                    title={
                      activeCategory
                        ? "No live offers in this category"
                        : "Choose a category to see offers"
                    }
                    description={
                      activeCategory
                        ? "There are no active, non-expired special offers right now. Products remain available at their normal prices."
                        : "Special offers are organized by category. Select a category tab above."
                    }
                    icon={
                      <PackageSearch aria-hidden="true" className="size-5" />
                    }
                    compact
                    className="border-0 bg-surface-subtle"
                  />
                )
              ) : catalog.products.length ? (
                <>
                  <ProductGrid>
                    {catalog.products.map((product, index) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        priority={index < 4}
                      />
                    ))}
                  </ProductGrid>
                  <Pagination
                    currentPage={catalog.page}
                    totalPages={catalog.totalPages}
                    className="mt-8 sm:mt-10"
                    label="Catalog pages"
                    getHref={(page) =>
                      catalogHref({
                        category: categorySlug,
                        search,
                        sort,
                        page,
                      })
                    }
                  />
                </>
              ) : (
                <EmptyState
                  title={
                    search
                      ? "No products match your search"
                      : activeCategory
                        ? "No products in this category"
                        : "No products available yet"
                  }
                  description={
                    search
                      ? "Try a shorter search or browse all goods."
                      : activeCategory
                        ? "This category has no active products with active prices."
                        : "The store administrator has not activated any products yet."
                  }
                  icon={
                    search ? (
                      <SearchX aria-hidden="true" className="size-5" />
                    ) : (
                      <PackageSearch aria-hidden="true" className="size-5" />
                    )
                  }
                  compact
                  className="border-0 bg-surface-subtle"
                  action={
                    hasFilters ? (
                      <Link href="/" className={cn(buttonVariants())}>
                        Browse all goods
                      </Link>
                    ) : undefined
                  }
                />
              )}
            </div>
          </div>
        </section>
      </main>

      <footer>
        <div className="mx-auto max-w-[var(--content-max)] px-3 py-8 text-sm text-foreground-muted sm:px-6 lg:px-8">
          © {new Date().getFullYear()} MOB GREENS
        </div>
      </footer>
    </div>
  );
}
