import type { ElementType, ReactNode } from "react";
import { ResponsiveImage } from "@/components/commerce/responsive-image";
import {
  getCategoryDisplayTone,
  type CategoryDisplayTone,
} from "@/config/category-presentation";
import { cn } from "@/lib/utils";
import type { CommerceImage } from "@/types/commerce";

interface CategoryShowcaseVisualProps {
  name: string;
  description?: string | null;
  image: CommerceImage | null;
  displayTone: CategoryDisplayTone;
  sizes: string;
  priority?: boolean;
  countLabel?: string;
  highlight?: ReactNode;
  trailing?: ReactNode;
  headingAs?: "h2" | "h3";
  className?: string;
  imageClassName?: string;
}

export function CategoryShowcaseVisual({
  name,
  description,
  image,
  displayTone,
  sizes,
  priority = false,
  countLabel,
  highlight,
  trailing,
  headingAs = "h2",
  className,
  imageClassName,
}: CategoryShowcaseVisualProps) {
  const tone = getCategoryDisplayTone(displayTone);
  const Heading = headingAs as ElementType;
  const hasImage = Boolean(image);
  const hasDarkTone = displayTone === "CHARCOAL" || displayTone === "INK";

  return (
    <div
      className={cn(
        "relative isolate min-h-[20rem] overflow-hidden rounded-xl border shadow-sm sm:min-h-[23rem]",
        tone.surfaceClassName,
        hasDarkTone && "border-white/20 shadow-[0_10px_26px_rgb(0_0_0/0.2)]",
        className,
      )}
    >
      <ResponsiveImage
        image={image}
        sizes={sizes}
        priority={priority}
        aspect="portrait"
        className="absolute inset-0 h-full w-full bg-black/5"
        imageClassName={cn(
          "object-cover transition-transform duration-300 motion-reduce:transition-none",
          imageClassName,
        )}
      />

      {hasImage && (
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/10 via-48% to-black/64"
        />
      )}

      <div
        className={cn(
          "relative z-10 flex min-h-[20rem] flex-col justify-between p-5 sm:min-h-[23rem] sm:p-6",
          hasImage && "text-white [text-shadow:0_1px_18px_rgb(0_0_0/0.32)]",
        )}
      >
        <div className="max-w-[22rem]">
          {highlight}
          {description && (
            <p
              className={cn(
                "line-clamp-2 text-sm leading-5 font-medium sm:text-base sm:leading-6",
                hasImage ? "text-white/90" : tone.mutedClassName,
              )}
            >
              {description}
            </p>
          )}
          <Heading className="mt-1.5 line-clamp-3 text-[2rem] leading-[0.98] font-semibold tracking-[-0.055em] text-balance sm:text-[2.45rem]">
            {name}
          </Heading>
        </div>

        {(countLabel || trailing) && (
          <div className="flex items-end justify-between gap-3">
            {countLabel ? (
              <span
                className={cn(
                  "rounded-full px-3 py-2 text-xs font-semibold tracking-[0.04em]",
                  hasImage
                    ? "border border-white/25 bg-black/30 text-white backdrop-blur-md"
                    : "border border-current/15 bg-black/5",
                )}
              >
                {countLabel}
              </span>
            ) : (
              <span />
            )}
            {trailing}
          </div>
        )}
      </div>
    </div>
  );
}
