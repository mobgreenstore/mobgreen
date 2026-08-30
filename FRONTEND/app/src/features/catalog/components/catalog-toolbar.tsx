"use client";

import { Check, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui";
import { catalogResultsHref } from "@/features/catalog/params";
import type { CatalogSort } from "@/features/catalog/types";

const SORT_OPTIONS: readonly { value: CatalogSort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "name-asc", label: "Name A-Z" },
  { value: "name-desc", label: "Name Z-A" },
];

export function CatalogToolbar({
  categorySlug,
  search,
  sort,
}: {
  categorySlug: string;
  search: string;
  sort: CatalogSort;
}) {
  const router = useRouter();
  const selectedLabel =
    SORT_OPTIONS.find((option) => option.value === sort)?.label ?? "Newest";

  function selectSort(nextSort: CatalogSort) {
    if (nextSort === sort) return;
    router.replace(
      catalogResultsHref({
        category: categorySlug,
        search,
        sort: nextSort,
      }),
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Sort products, currently ${selectedLabel}`}
          className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full bg-surface-subtle px-3 text-sm font-medium text-foreground transition-colors outline-none hover:bg-border focus-visible:ring-2 focus-visible:ring-foreground/35 focus-visible:ring-offset-2 motion-reduce:transition-none"
        >
          <span className="text-xs text-foreground-muted">Sort</span>
          <span className="max-w-24 truncate">{selectedLabel}</span>
          <ChevronDown
            aria-hidden="true"
            className="size-4 text-foreground-muted"
            strokeWidth={1.8}
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        side="bottom"
        sideOffset={8}
        collisionPadding={12}
        className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-44"
        aria-label="Sort products"
      >
        {SORT_OPTIONS.map((option) => {
          const selected = option.value === sort;
          return (
            <DropdownMenuItem
              key={option.value}
              onSelect={() => selectSort(option.value)}
              className="min-h-11 justify-between"
            >
              <span>{option.label}</span>
              {selected && (
                <Check aria-hidden="true" className="size-4" strokeWidth={2} />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
