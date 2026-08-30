import Link from "next/link";
import { Money } from "@/components/commerce/money";
import { ResponsiveImage } from "@/components/commerce/responsive-image";
import { WeightDisplay } from "@/components/commerce/weight-display";
import type { ProductCardViewModel } from "@/types/commerce";
import { cn } from "@/lib/utils";

export function ProductCard({
  product,
  className,
  priority = false,
}: {
  product: ProductCardViewModel;
  className?: string;
  priority?: boolean;
}) {
  return (
    <article className={cn("group min-w-0", className)}>
      <Link
        href={`/products/${product.slug}`}
        aria-label={`View ${product.name}`}
        className="flex h-full min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-xs transition-[border-color,transform,box-shadow] hover:-translate-y-0.5 hover:border-border-strong hover:shadow-sm focus-visible:ring-2 focus-visible:ring-foreground focus-visible:outline-none"
      >
        <ResponsiveImage
          image={product.coverImage}
          sizes="(max-width: 767px) calc(50vw - 1.25rem), (max-width: 1279px) 33vw, 25vw"
          priority={priority}
          className="rounded-none border-b border-border bg-surface-subtle"
          imageClassName="transition-transform duration-300 group-hover:scale-[1.025]"
        />
        <div className="flex min-h-0 flex-1 flex-col p-3 sm:p-3.5">
          <p className="truncate text-[0.6875rem] font-semibold tracking-[0.07em] text-foreground-subtle uppercase">
            {product.categoryName}
          </p>
          <h3 className="mt-1.5 line-clamp-2 text-sm leading-5 font-semibold tracking-[-0.02em] sm:text-base">
            {product.name}
          </h3>
          <div className="mt-auto pt-3">
            <Money
              amountMinor={product.primaryPrice.priceMinor}
              currency={product.primaryPrice.currency}
              className="block font-mono text-base font-semibold tracking-[-0.02em]"
            />
            <span className="mt-0.5 block text-xs text-foreground-muted">
              <WeightDisplay
                value={product.primaryPrice.weightValue}
                unit={product.primaryPrice.weightUnit}
              />
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
