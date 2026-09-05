"use client";

import { Eye } from "lucide-react";
import { Money } from "@/components/commerce/money";
import { ImageGallery } from "@/components/commerce/image-gallery";
import { WeightDisplay } from "@/components/commerce/weight-display";
import { Card, StatusBadge } from "@/components/ui";
import type { WeightPriceDraft } from "@/components/admin";
import type { ManagedImage, ManagedVideo } from "@/types/media";

export function ProductPreview({
  name,
  categoryName,
  shortDescription,
  status,
  images,
  video,
  priceOptions,
}: {
  name: string;
  categoryName: string;
  shortDescription: string;
  status: "DRAFT" | "ACTIVE";
  images: readonly ManagedImage[];
  video: ManagedVideo | null;
  priceOptions: readonly WeightPriceDraft[];
}) {
  const option = priceOptions[0];
  const major = option ? Number(option.priceMajor) : Number.NaN;
  const validPrice = option && Number.isFinite(major) && major >= 0;

  return (
    <aside className="lg:sticky lg:top-24 lg:self-start">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <Eye aria-hidden="true" className="size-4" />
        Live product preview
      </div>
      <Card className="overflow-hidden p-0">
        <ImageGallery
          images={images}
          video={video}
          label="Product media preview"
        />
        <div className="grid gap-3 p-5">
          <div className="flex items-start justify-between gap-3">
            <p className="text-xs font-medium text-foreground-muted">
              {categoryName || "Select a category"}
            </p>
            <StatusBadge status={status === "ACTIVE" ? "active" : "draft"} />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-[-0.025em]">
              {name.trim() || "Product name"}
            </h2>
            <p className="mt-1 text-sm leading-6 text-foreground-muted">
              {shortDescription.trim() ||
                "The short product description appears here."}
            </p>
          </div>
          {validPrice ? (
            <p className="flex flex-wrap items-baseline gap-1.5 text-sm">
              <Money
                amountMinor={Math.round(major * 100)}
                currency={option.currency}
                className="font-mono font-semibold"
              />
              <span className="text-foreground-muted">/</span>
              <WeightDisplay
                value={Number(option.weightValue) || 0}
                unit={option.weightUnit}
                className="text-foreground-muted"
              />
            </p>
          ) : (
            <p className="text-sm text-foreground-muted">
              Add a weight and price option.
            </p>
          )}
          <p className="text-xs leading-5 text-foreground-subtle">
            Preview values are local and are not saved until you submit the
            form.
          </p>
        </div>
      </Card>
    </aside>
  );
}
