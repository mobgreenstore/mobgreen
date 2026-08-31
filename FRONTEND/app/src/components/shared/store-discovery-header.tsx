import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { BrandMark } from "@/components/shared/brand-mark";
import { StoreSearchBar } from "@/components/shared/store-search-bar";
import { StorefrontMenu } from "@/components/shared/storefront-menu";
import { IconButton } from "@/components/ui/icon-button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  getCategoryDisplayTone,
  type CategoryDisplayTone,
} from "@/config/category-presentation";
import { CartButton } from "@/features/cart/components/cart-button";
import type { CatalogSort } from "@/features/catalog/types";
import { StoreLocationControl } from "@/features/location/components/store-location-control";
import { cn } from "@/lib/utils";

export function StoreDiscoveryHeader({
  search,
  categorySlug,
  sort,
  displayTone,
  navigation,
}: {
  search: string;
  categorySlug: string;
  sort: CatalogSort;
  displayTone: CategoryDisplayTone;
  navigation: ReactNode;
}) {
  const tone = getCategoryDisplayTone(displayTone);
  const darkSurface = displayTone === "CHARCOAL" || displayTone === "INK";
  const controlClassName = darkSurface
    ? "text-white hover:bg-white/10 disabled:opacity-55"
    : "text-[#121212] hover:bg-black/5 disabled:opacity-50";

  return (
    <header
      className={cn(
        "sticky top-0 z-40 transition-colors duration-200",
        tone.surfaceClassName,
      )}
      style={
        {
          "--store-header-surface": tone.surfaceColor,
        } as CSSProperties
      }
    >
      <div className="safe-top">
        <div className="mx-auto max-w-[var(--content-max)] px-3 py-2.5 sm:px-5 lg:px-8">
          <div className="flex min-h-11 items-center justify-between md:hidden">
            <BrandMark
              compact
              className={cn("text-inherit", controlClassName)}
            />
            <div className="flex items-center gap-1">
              <ThemeToggle className={controlClassName} />
              <CartButton className={controlClassName} />
            </div>
          </div>

          <div className="mt-2 flex items-center gap-2 md:mt-0 md:gap-3">
            <BrandMark
              className={cn(
                "hidden shrink-0 text-inherit md:inline-flex",
                controlClassName,
              )}
            />
            <StorefrontMenu
              triggerClassName={cn(
                "shrink-0 rounded-full border border-current/15",
                controlClassName,
              )}
            />
            <StoreSearchBar
              search={search}
              categorySlug={categorySlug}
              sort={sort}
              className="min-w-0 flex-1"
            />
            <StoreLocationControl
              className={cn(
                "shrink-0 rounded-full border border-current/15",
                controlClassName,
              )}
            />
            <div className="hidden shrink-0 items-center gap-1 md:flex">
              <ThemeToggle className={controlClassName} />
              <CartButton className={controlClassName} />
            </div>
          </div>
        </div>
      </div>
      {navigation}
    </header>
  );
}
