"use client";

import { useState } from "react";
import { ResponsiveImage } from "@/components/commerce/responsive-image";
import type { CommerceImage } from "@/types/commerce";
import { cn } from "@/lib/utils";

export function ImageGallery({
  images,
  label = "Product images",
}: {
  images: readonly CommerceImage[];
  label?: string;
}) {
  const [selectedId, setSelectedId] = useState<string | undefined>(
    images[0]?.id,
  );
  const activeImage =
    images.find(({ id }) => id === selectedId) ?? images[0] ?? null;

  return (
    <div aria-label={label} className="grid gap-3">
      <ResponsiveImage
        image={activeImage}
        sizes="(max-width: 768px) 100vw, 50vw"
        className="rounded-lg border border-border"
      />
      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-2" aria-label="Choose image">
          {images.map((image) => (
            <button
              key={image.id}
              type="button"
              aria-label={`Show ${image.altText}`}
              aria-pressed={activeImage?.id === image.id}
              onClick={() => setSelectedId(image.id)}
              className={cn(
                "rounded-md border border-border p-0.5",
                activeImage?.id === image.id &&
                  "border-foreground ring-1 ring-foreground",
              )}
            >
              <ResponsiveImage
                image={image}
                sizes="20vw"
                className="rounded-sm"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
