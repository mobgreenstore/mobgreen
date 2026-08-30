"use client";

import { ArrowLeft, ArrowRight, Star, Trash2 } from "lucide-react";
import { ResponsiveImage } from "@/components/commerce/responsive-image";
import { IconButton, Label, TextField } from "@/components/ui";
import type { CommerceImage } from "@/types/commerce";

export interface ImageReorderGridProps {
  images: readonly CommerceImage[];
  coverImageId?: string;
  onMove: (imageId: string, direction: "back" | "forward") => void;
  onRemove: (imageId: string) => void;
  onCoverChange: (imageId: string) => void;
  onAltTextChange?: (imageId: string, altText: string) => void;
  disabled?: boolean;
}

export function ImageReorderGrid({
  images,
  coverImageId,
  onMove,
  onRemove,
  onCoverChange,
  onAltTextChange,
  disabled = false,
}: ImageReorderGridProps) {
  if (!images.length) return null;
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {images.map((image, index) => (
        <article
          key={image.id}
          className="overflow-hidden rounded-lg border border-border bg-surface shadow-xs"
        >
          <ResponsiveImage
            image={image}
            sizes="(max-width: 640px) 100vw, 33vw"
            aspect="landscape"
          />
          <div className="grid gap-3 p-3">
            {onAltTextChange && (
              <div className="grid gap-1.5">
                <Label htmlFor={`image-alt-${image.id}`}>
                  Alternative text
                </Label>
                <TextField
                  id={`image-alt-${image.id}`}
                  value={image.altText}
                  minLength={3}
                  maxLength={255}
                  required
                  disabled={disabled}
                  onChange={(event) =>
                    onAltTextChange(image.id, event.target.value)
                  }
                />
              </div>
            )}
            <div className="flex items-center justify-between gap-1">
              <IconButton
                aria-label={`Set ${image.altText} as cover`}
                size="small"
                disabled={disabled || coverImageId === image.id}
                onClick={() => onCoverChange(image.id)}
                className={
                  coverImageId === image.id ? "text-success" : undefined
                }
              >
                <Star
                  className="size-4"
                  fill={coverImageId === image.id ? "currentColor" : "none"}
                />
              </IconButton>
              <div className="flex">
                <IconButton
                  aria-label={`Move ${image.altText} backward`}
                  size="small"
                  disabled={disabled || index === 0}
                  onClick={() => onMove(image.id, "back")}
                >
                  <ArrowLeft className="size-4" />
                </IconButton>
                <IconButton
                  aria-label={`Move ${image.altText} forward`}
                  size="small"
                  disabled={disabled || index === images.length - 1}
                  onClick={() => onMove(image.id, "forward")}
                >
                  <ArrowRight className="size-4" />
                </IconButton>
                <IconButton
                  aria-label={`Remove ${image.altText}`}
                  size="small"
                  disabled={disabled}
                  onClick={() => onRemove(image.id)}
                  className="text-danger"
                >
                  <Trash2 className="size-4" />
                </IconButton>
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
