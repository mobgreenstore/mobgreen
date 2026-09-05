"use client";

import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { useMemo, useState } from "react";
import { ResponsiveImage } from "@/components/commerce/responsive-image";
import type { CommerceImage, CommerceVideo } from "@/types/commerce";
import { cn } from "@/lib/utils";

type MediaSlide =
  | { key: string; type: "image"; image: CommerceImage }
  | { key: string; type: "video"; video: CommerceVideo };

export function ImageGallery({
  images,
  video = null,
  label = "Product images",
}: {
  images: readonly CommerceImage[];
  video?: CommerceVideo | null;
  label?: string;
}) {
  const slides = useMemo<MediaSlide[]>(
    () => [
      ...images.map((image) => ({
        key: `image-${image.id}`,
        type: "image" as const,
        image,
      })),
      ...(video
        ? [
            {
              key: `video-${video.id}`,
              type: "video" as const,
              video,
            },
          ]
        : []),
    ],
    [images, video],
  );
  const [selectedKey, setSelectedKey] = useState<string | undefined>(
    slides[0]?.key,
  );
  const active = slides.find((slide) => slide.key === selectedKey) ?? slides[0];
  const activeIndex = active
    ? slides.findIndex((slide) => slide.key === active.key)
    : -1;

  function move(direction: "back" | "forward") {
    if (activeIndex < 0 || slides.length < 2) return;
    const nextIndex =
      direction === "back"
        ? (activeIndex - 1 + slides.length) % slides.length
        : (activeIndex + 1) % slides.length;
    setSelectedKey(slides[nextIndex]?.key);
  }

  return (
    <div aria-label={label} className="grid gap-3">
      <div className="relative">
        {active?.type === "image" ? (
          <ResponsiveImage
            image={active.image}
            sizes="(max-width: 768px) 100vw, 50vw"
            className="rounded-lg border border-border"
          />
        ) : active?.type === "video" ? (
          <div className="aspect-[4/3] overflow-hidden rounded-lg border border-border bg-black">
            <video
              controls
              preload="metadata"
              playsInline
              poster={active.video.posterUrl ?? undefined}
              aria-label={active.video.altText}
              className="size-full object-contain"
            >
              <source src={active.video.url} />
              Your browser cannot play this video.
            </video>
          </div>
        ) : (
          <ResponsiveImage
            image={null}
            sizes="(max-width: 768px) 100vw, 50vw"
            className="rounded-lg border border-border"
          />
        )}
        {slides.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Show previous media"
              onClick={() => move("back")}
              className="absolute top-1/2 left-3 grid size-10 -translate-y-1/2 place-items-center rounded-full border border-white/30 bg-black/55 text-white backdrop-blur-sm transition-colors hover:bg-black/75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
            >
              <ChevronLeft aria-hidden="true" className="size-5" />
            </button>
            <button
              type="button"
              aria-label="Show next media"
              onClick={() => move("forward")}
              className="absolute top-1/2 right-3 grid size-10 -translate-y-1/2 place-items-center rounded-full border border-white/30 bg-black/55 text-white backdrop-blur-sm transition-colors hover:bg-black/75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
            >
              <ChevronRight aria-hidden="true" className="size-5" />
            </button>
          </>
        )}
      </div>
      {slides.length > 1 && (
        <div
          className="flex gap-2 overflow-x-auto pb-1"
          aria-label="Choose product media"
        >
          {slides.map((slide) => (
            <button
              key={slide.key}
              type="button"
              aria-label={
                slide.type === "image"
                  ? `Show ${slide.image.altText}`
                  : `Play ${slide.video.altText}`
              }
              aria-pressed={active?.key === slide.key}
              onClick={() => setSelectedKey(slide.key)}
              className={cn(
                "relative size-16 shrink-0 overflow-hidden rounded-md border border-border p-0.5",
                active?.key === slide.key &&
                  "border-foreground ring-1 ring-foreground",
              )}
            >
              {slide.type === "image" ? (
                <ResponsiveImage
                  image={slide.image}
                  sizes="64px"
                  className="size-full rounded-sm"
                />
              ) : (
                <span className="grid size-full place-items-center rounded-sm bg-foreground text-background">
                  <Play aria-hidden="true" className="size-5 fill-current" />
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
