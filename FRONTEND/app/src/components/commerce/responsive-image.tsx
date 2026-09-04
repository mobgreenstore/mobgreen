"use client";

import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { useState } from "react";
import type { CommerceImage } from "@/types/commerce";
import { cn } from "@/lib/utils";

type DisplayImage = Pick<CommerceImage, "url" | "altText">;

interface ResponsiveImageProps {
  image: DisplayImage | null;
  sizes: string;
  priority?: boolean;
  className?: string;
  imageClassName?: string;
  aspect?: "square" | "portrait" | "landscape";
}

export function ResponsiveImage({
  image,
  sizes,
  priority = false,
  className,
  imageClassName,
  aspect = "square",
}: ResponsiveImageProps) {
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
  const imageFailed = image !== null && failedImageUrl === image.url;

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-surface-subtle",
        aspect === "square" && "aspect-square",
        aspect === "portrait" && "aspect-[4/5]",
        aspect === "landscape" && "aspect-[4/3]",
        className,
      )}
    >
      {image && !imageFailed ? (
        <Image
          src={image.url}
          alt={image.altText}
          fill
          sizes={sizes}
          priority={priority}
          className={cn("object-cover", imageClassName)}
          onError={() => setFailedImageUrl(image.url)}
        />
      ) : (
        <div
          className="absolute inset-0 grid place-items-center text-foreground-subtle"
          aria-label="Image unavailable"
        >
          <ImageIcon aria-hidden="true" className="size-6" strokeWidth={1.5} />
        </div>
      )}
    </div>
  );
}
