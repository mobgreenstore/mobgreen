import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { CategoryShowcaseVisual } from "@/components/commerce/category-showcase-visual";
import { catalogResultsHref } from "@/features/catalog/params";
import { CategoryOfferBranding } from "@/features/catalog/components/category-offer-branding";
import type {
  CatalogCategoryViewModel,
  CatalogSort,
} from "@/features/catalog/types";

export function CategoryShowcaseCard({
  category,
  search,
  sort,
  priority = false,
}: {
  category: CatalogCategoryViewModel;
  search: string;
  sort: CatalogSort;
  priority?: boolean;
}) {
  const countLabel =
    category.productCount === 1
      ? "1 active product"
      : `${category.productCount} active products`;

  return (
    <article
      data-showcase-card
      data-category-slug={category.slug}
      className="h-full"
    >
      <Link
        href={catalogResultsHref({
          category: category.slug,
          search,
          sort,
          ...(category.strongestOffer ? { view: "offers" as const } : {}),
        })}
        aria-label={
          category.strongestOffer
            ? "View " + category.name + " special offers"
            : "Browse " + category.name
        }
        className="group block h-full rounded-xl focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        <CategoryShowcaseVisual
          name={category.name}
          description={category.description}
          image={category.image}
          displayTone={category.displayTone}
          sizes="(max-width: 639px) 66vw, (max-width: 1023px) 17.5rem, 20rem"
          priority={priority}
          countLabel={countLabel}
          highlight={
            category.strongestOffer ? (
              <CategoryOfferBranding
                discountBps={category.strongestOffer.discountBps}
                totalWeightGrams={category.strongestOffer.totalWeightGrams}
                endsAt={category.strongestOffer.endsAt}
              />
            ) : undefined
          }
          trailing={
            <span className="grid size-11 shrink-0 place-items-center rounded-full border border-white/25 bg-black/30 text-white backdrop-blur-md transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transition-none">
              <ArrowUpRight aria-hidden="true" className="size-5" />
            </span>
          }
          imageClassName="group-hover:scale-[1.02] motion-reduce:transform-none"
        />
      </Link>
    </article>
  );
}
