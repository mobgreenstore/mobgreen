import Link from "next/link";
import { BadgePercent, Grid2X2 } from "lucide-react";
import { catalogHref } from "@/features/catalog/params";
import type { CatalogSort, CatalogView } from "@/features/catalog/types";
import { cn } from "@/lib/utils";

export function CatalogViewTabs({
  activeView,
  categorySlug,
  search,
  sort,
  offerCount,
}: {
  activeView: CatalogView;
  categorySlug: string;
  search: string;
  sort: CatalogSort;
  offerCount: number;
}) {
  const tabs = [
    { value: "products" as const, label: "Products", icon: Grid2X2 },
    {
      value: "offers" as const,
      label: `Get offers${offerCount ? ` (${offerCount})` : ""}`,
      icon: BadgePercent,
    },
  ];
  return (
    <nav
      aria-label="Catalog view"
      className="flex gap-1 rounded-lg bg-surface-subtle p-1"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <Link
            key={tab.value}
            href={catalogHref({
              category: categorySlug,
              search,
              sort,
              ...(tab.value === "offers" ? { view: "offers" } : {}),
            })}
            aria-current={activeView === tab.value ? "page" : undefined}
            className={cn(
              "inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-md px-3 text-sm font-semibold transition-colors motion-reduce:transition-none sm:flex-none",
              activeView === tab.value
                ? "bg-surface text-foreground shadow-sm"
                : "text-foreground-muted hover:text-foreground",
            )}
          >
            <Icon aria-hidden="true" className="size-4" />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
