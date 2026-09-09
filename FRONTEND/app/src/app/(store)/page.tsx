import type { Metadata } from "next";
import Link from "next/link";
import { PackageSearch, SearchX, Mail } from "lucide-react";
import { useTranslations } from "next-intl";
import { ProductCard } from "@/components/commerce/product-card";
import { ProductGrid } from "@/components/commerce/product-grid";
import { EmptyState, Pagination, buttonVariants } from "@/components/ui";
import { CatalogDiscovery } from "@/features/catalog/components/catalog-discovery";
import { CatalogLoading } from "@/features/catalog/components/catalog-loading";
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
import { Suspense } from "react";
import { cookies } from "next/headers";
import {
  DEFAULT_STOREFRONT_CURRENCY,
  isSupportedCurrency,
  STOREFRONT_CURRENCY_COOKIE,
} from "@/features/catalog/currency-preference";
import { StoreCurrencyControl } from "@/features/catalog/components/store-currency-control";

export const metadata: Metadata = {
  title: "Fresh goods",
  description:
    "Browse real MOB GREENS products by category, weight, and currency.",
};

function CatalogFooter() {
  const t = useTranslations("Catalog");
  const currentYear = new Date().getFullYear();
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-[var(--content-max)] px-3 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between sm:gap-6">
          <div className="text-center sm:text-left">
            <h3 className="mb-1 text-sm font-semibold text-foreground">
              {t("footerTitle")}
            </h3>
            <p className="text-xs text-foreground-muted">
              {t("footerDescription")}
            </p>
          </div>

          <Link
            href="mailto:contact@mobgreens.com"
            className="flex items-center gap-2 text-xs text-foreground-muted transition-colors hover:text-foreground"
          >
            <Mail aria-hidden="true" className="size-3" />
            {t("footerContact")}
          </Link>

          <p className="text-xs text-foreground-muted">
            {t("copyright", { year: currentYear })}
          </p>
        </div>
      </div>
    </footer>
  );
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function CatalogContent({ catalog, offerPage, activeCategory, categorySlug, search, sort, view, requestedPage, currency, hasCurrencyPreference }: any) {
  const t = useTranslations("Catalog");
  const hasFilters = Boolean(categorySlug || search);

  return (
    <>
      <CatalogDiscovery
        key={categorySlug || "all-goods"}
        categories={catalog.categories}
        activeCategorySlug={categorySlug}
        search={search}
        sort={sort}
      />

      <main>
        <Suspense fallback={<CatalogLoading />}>
          <section aria-labelledby="catalog-results" className="bg-surface">
            <div className="mx-auto max-w-[var(--content-max)] px-3 py-6 sm:px-6 sm:py-8 lg:px-8">
              <div
                id="catalog-results"
                className="scroll-mt-40 sm:scroll-mt-36"
              >
                <CatalogViewTabs
                  activeView={view}
                  categorySlug={categorySlug}
                  search={search}
                  sort={sort}
                  offerCount={activeCategory ? offerPage.totalCount : 0}
                />
                <div className="mt-5">
                  <CatalogResultsHeader
                    categoryName={activeCategory?.name ?? t("allGoods")}
                    resultCount={
                      view === "offers"
                        ? offerPage.totalCount
                        : catalog.totalCount
                    }
                    toolbar={
                      <div className="flex items-center gap-2">
                        <StoreCurrencyControl
                          currency={currency}
                          hasPreference={hasCurrencyPreference}
                        />
                        {view === "products" ? (
                          <CatalogToolbar
                            categorySlug={categorySlug}
                            search={search}
                            sort={sort}
                          />
                        ) : null}
                      </div>
                    }
                  />
                </div>
              </div>

              <div className="mt-5 sm:mt-6">
                {view === "offers" ? (
                  offerPage.offers.length ? (
                    <>
                      <div className="grid grid-cols-1 gap-4 min-[390px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {offerPage.offers.map((offer: any, index: number) => (
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
                        label={t("offerPages")}
                        getHref={(page: number) =>
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
                          ? t("noOffers")
                          : t("chooseCategory")
                      }
                      description={
                        activeCategory
                          ? t("noOffersDescription")
                          : t("chooseCategory")
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
                      {catalog.products.map((product: any, index: number) => (
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
                      label={t("catalogPages")}
                      getHref={(page: number) =>
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
                        ? t("noSearchResults")
                        : activeCategory
                          ? t("noProductsCategory")
                          : t("noProducts")
                    }
                    description={
                      search
                        ? t("noSearchResultsDescription")
                        : activeCategory
                          ? t("noProductsCategoryDescription")
                          : t("noProductsDescription")
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
                          {t("browseAll")}
                        </Link>
                      ) : undefined
                    }
                  />
                )}
              </div>
            </div>
          </section>
        </Suspense>
      </main>

      <CatalogFooter />
    </>
  );
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const currencyCookie = (await cookies()).get(
    STOREFRONT_CURRENCY_COOKIE,
  )?.value;
  const hasCurrencyPreference = isSupportedCurrency(currencyCookie);
  const currency = hasCurrencyPreference
    ? currencyCookie
    : DEFAULT_STOREFRONT_CURRENCY;
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
      currency,
    }),
    getPublicSpecialOffers({
      categorySlug: requestedCategory,
      page: view === "offers" ? requestedPage : 1,
      currency,
    }),
  ]);
  const activeCategory = catalog.categories.find(
    (category) => category.slug === requestedCategory,
  );
  const categorySlug = activeCategory?.slug ?? "";

  return (
    <div className="min-h-dvh bg-background">
      <CatalogContent 
        catalog={catalog}
        offerPage={offerPage}
        activeCategory={activeCategory}
        categorySlug={categorySlug}
        search={search}
        sort={sort}
        view={view}
        requestedPage={requestedPage}
        currency={currency}
        hasCurrencyPreference={hasCurrencyPreference}
      />
    </div>
  );
}
