import { Search } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";
import type { CatalogSort } from "@/features/catalog/types";
import { cn } from "@/lib/utils";

export function StoreSearchBar({
  search,
  categorySlug,
  sort,
  className,
}: {
  search: string;
  categorySlug: string;
  sort: CatalogSort;
  className?: string;
}) {
  return (
    <form
      action="/"
      method="get"
      role="search"
      className={cn("relative min-w-0", className)}
    >
      {categorySlug && (
        <input type="hidden" name="category" value={categorySlug} />
      )}
      {sort !== "newest" && <input type="hidden" name="sort" value={sort} />}
      <IconButton
        type="submit"
        aria-label="Search products"
        title="Search products"
        className="absolute top-1/2 left-0.5 z-10 size-11 min-h-11 -translate-y-1/2 rounded-full text-[#121212] hover:bg-black/5"
      >
        <Search aria-hidden="true" className="size-5" strokeWidth={2} />
      </IconButton>
      <label>
        <span className="sr-only">Search products</span>
        <input
          type="search"
          name="q"
          defaultValue={search}
          placeholder="Search products"
          enterKeyHint="search"
          autoComplete="off"
          maxLength={120}
          className="h-12 w-full rounded-full border border-black/12 bg-white pr-4 pl-12 text-base text-[#121212] shadow-sm outline-none placeholder:text-[#777772] hover:border-black/25 focus:border-black/45 focus:ring-3 focus:ring-black/8"
        />
      </label>
    </form>
  );
}
