"use client";

import Link from "next/link";
import { BadgePercent, Grid2X2, LoaderCircle } from "lucide-react";
import { catalogHref } from "@/features/catalog/params";
import { useState } from "react";
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
  const [pendingView, setPendingView] = useState<CatalogView | null>(null);
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
            aria-busy={pendingView === tab.value || undefined}
            onClick={(event) => {
              if (
                event.defaultPrevented ||
                event.button !== 0 ||
                event.metaKey ||
                event.ctrlKey ||
                event.shiftKey ||
                event.altKey
              ) {
                return;
              }
              setPendingView(tab.value);
            }}
            className={cn(
              "inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-md px-3 text-sm font-semibold transition-colors motion-reduce:transition-none sm:flex-none",
              activeView === tab.value
                ? "bg-surface text-foreground shadow-sm"
                : "text-foreground-muted hover:text-foreground",
            )}
          >
            {pendingView === tab.value ? (
              <LoaderCircle
                aria-hidden="true"
                className="size-4 animate-spin motion-reduce:animate-none"
              />
            ) : (
              <Icon aria-hidden="true" className="size-4" />
            )}
            {pendingView === tab.value
              ? tab.value === "offers"
                ? "Loading offers…"
                : "Loading products…"
              : tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
