"use client";

import { ImagePlus, LoaderCircle, RotateCcw } from "lucide-react";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import { ImageReorderGrid } from "@/components/admin/image-reorder-grid";
import { Button, InlineAlert, Label, TextField } from "@/components/ui";
import {
  IMAGE_UPLOAD_ACCEPT,
  IMAGE_UPLOAD_MAX_LABEL,
  type ImageUploadScope,
} from "@/config/images";
import {
  removeAdminImage,
  uploadAdminImage,
  validateClientImageFile,
} from "@/features/media/client/image-api";
import { cn } from "@/lib/utils";
import type { ManagedImage } from "@/types/media";

export interface ImageUploadProgress {
  status: "idle" | "uploading" | "success" | "error";
  progress: number;
}

export interface ImageUploaderProps {
  onFilesSelected?: (files: File[]) => void;
  scope?: ImageUploadScope;
  images?: readonly ManagedImage[];
  onImagesChange?: (images: ManagedImage[]) => void;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  disabled?: boolean;
  uploading?: boolean;
  progress?: number;
  onUploadProgressChange?: (state: ImageUploadProgress) => void;
  label?: string;
  className?: string;
}

function ordered(images: readonly ManagedImage[]) {
  return images.map((image, position) => ({ ...image, position }));
}

export function ImageUploader({
  onFilesSelected,
  scope,
  images = [],
  onImagesChange,
  accept = IMAGE_UPLOAD_ACCEPT,
  multiple,
  maxFiles = 8,
  disabled = false,
  uploading: controlledUploading,
  progress: controlledProgress,
  onUploadProgressChange,
  label = "Upload images",
  className,
}: ImageUploaderProps) {
  const inputId = `upload-${useId().replaceAll(":", "")}`;
  const altId = `alt-${useId().replaceAll(":", "")}`;
  const [altText, setAltText] = useState("");
  const [internalUploading, setInternalUploading] = useState(false);
  const [internalProgress, setInternalProgress] = useState(0);
  const [error, setError] = useState<string>();
  const [retryFiles, setRetryFiles] = useState<File[]>([]);
  const realWorkflow = Boolean(scope && onImagesChange);
  const uploading = controlledUploading ?? internalUploading;
  const progress = controlledProgress ?? internalProgress;
  const allowMultiple = multiple ?? maxFiles > 1;
  const imagesRef = useRef(images);

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  useEffect(() => {
    return () => {
      for (const image of imagesRef.current) {
        if (image.persisted) continue;
        void fetch("/api/admin/images", {
          method: "DELETE",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ publicId: image.publicId }),
          keepalive: true,
        }).catch(() => undefined);
      }
    };
  }, []);

  async function removeTransient(imagesToRemove: readonly ManagedImage[]) {
    await Promise.all(
      imagesToRemove
        .filter((image) => !image.persisted)
        .map((image) => removeAdminImage(image.publicId)),
    );
  }

  async function uploadFiles(files: File[]) {
    onFilesSelected?.(files);
    if (!realWorkflow || !scope || !onImagesChange) return;

    setError(undefined);
    const usefulAlt = altText.trim();
    if (usefulAlt.length < 3) {
      setRetryFiles(files);
      setError("Describe the image before uploading it.");
      onUploadProgressChange?.({ status: "error", progress: 0 });
      return;
    }

    const selected = files.slice(0, maxFiles);
    for (const file of selected) {
      const validationError = validateClientImageFile(file);
      if (validationError) {
        setRetryFiles(selected);
        setError(validationError);
        onUploadProgressChange?.({ status: "error", progress: 0 });
        return;
      }
    }
    if (maxFiles > 1 && images.length + selected.length > maxFiles) {
      setRetryFiles(selected);
      setError(`You can add up to ${maxFiles} images.`);
      onUploadProgressChange?.({ status: "error", progress: 0 });
      return;
    }

    setInternalUploading(true);
    setInternalProgress(0);
    onUploadProgressChange?.({ status: "uploading", progress: 0 });
    let next = [...images];
    const uploaded: ManagedImage[] = [];
    try {
      for (const [index, file] of selected.entries()) {
        const image = await uploadAdminImage({
          file,
          altText:
            selected.length === 1 ? usefulAlt : `${usefulAlt} ${index + 1}`,
          scope,
          onProgress: (fileProgress) => {
            const batchProgress = Math.round(
              ((index + fileProgress / 100) / selected.length) * 100,
            );
            setInternalProgress(batchProgress);
            onUploadProgressChange?.({
              status: "uploading",
              progress: batchProgress,
            });
          },
        });
        uploaded.push(image);
      }

      if (maxFiles === 1) {
        await removeTransient(next);
        next = [{ ...uploaded[0]!, position: 0, isCover: true }];
      } else {
        const hadCover = next.some((image) => image.isCover);
        next = ordered([...next, ...uploaded]).map((image, index) => ({
          ...image,
          isCover: !hadCover && index === 0 ? true : image.isCover,
        }));
      }
      onImagesChange(next);
      setAltText("");
      setRetryFiles([]);
      setInternalProgress(100);
      onUploadProgressChange?.({ status: "success", progress: 100 });
    } catch (uploadError) {
      await Promise.allSettled(
        uploaded.map((image) => removeAdminImage(image.publicId)),
      );
      setRetryFiles(selected);
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "The image could not be uploaded. Try again.",
      );
      onUploadProgressChange?.({ status: "error", progress: 0 });
    } finally {
      setInternalUploading(false);
    }
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).slice(0, maxFiles);
    if (files.length) void uploadFiles(files);
    event.target.value = "";
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    if (disabled || uploading) return;
    const files = Array.from(event.dataTransfer.files).slice(0, maxFiles);
    if (files.length) void uploadFiles(files);
  }

  async function handleRemove(imageId: string) {
    if (!onImagesChange) return;
    setError(undefined);
    const image = images.find((item) => item.id === imageId);
    if (!image) return;
    try {
      if (!image.persisted) await removeAdminImage(image.publicId);
      const next = ordered(images.filter((item) => item.id !== imageId));
      if (next.length && !next.some((item) => item.isCover)) {
        next[0] = { ...next[0]!, isCover: true };
      }
      onImagesChange(next);
    } catch (removeError) {
      setError(
        removeError instanceof Error
          ? removeError.message
          : "The image could not be removed.",
      );
    }
  }

  function handleMove(imageId: string, direction: "back" | "forward") {
    if (!onImagesChange) return;
    const index = images.findIndex((image) => image.id === imageId);
    const destination = direction === "back" ? index - 1 : index + 1;
    if (index < 0 || destination < 0 || destination >= images.length) return;
    const next = [...images];
    [next[index], next[destination]] = [next[destination]!, next[index]!];
    onImagesChange(ordered(next));
  }

  function handleCover(imageId: string) {
    onImagesChange?.(
      images.map((image) => ({ ...image, isCover: image.id === imageId })),
    );
  }

  function handleAltText(imageId: string, value: string) {
    onImagesChange?.(
      images.map((image) =>
        image.id === imageId ? { ...image, altText: value } : image,
      ),
    );
  }

  return (
    <div className={cn("grid gap-4", className)}>
      {realWorkflow && (
        <div className="grid gap-2">
          <Label htmlFor={altId} required>
            Image description
          </Label>
          <TextField
            id={altId}
            value={altText}
            onChange={(event) => setAltText(event.target.value)}
            placeholder="For example, fresh spinach leaves in a basket"
            minLength={3}
            maxLength={255}
            disabled={disabled || uploading}
          />
          <p className="text-xs leading-5 text-foreground-muted">
            Describe what is visible for customers who cannot see the image.
          </p>
        </div>
      )}

      <div
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
        className={cn(
          "grid min-h-40 place-items-center rounded-lg border border-dashed border-border-strong bg-background p-5 text-center transition-colors",
          disabled || uploading
            ? "cursor-not-allowed opacity-55"
            : "hover:border-foreground-muted hover:bg-surface-subtle",
        )}
      >
        <label
          htmlFor={inputId}
          className={cn(
            "grid cursor-pointer place-items-center",
            (disabled || uploading) && "cursor-not-allowed",
          )}
        >
          <input
            id={inputId}
            type="file"
            accept={accept}
            multiple={allowMultiple}
            disabled={disabled || uploading}
            className="sr-only"
            onChange={handleChange}
          />
          <span className="mx-auto grid size-11 place-items-center rounded-md bg-surface-subtle text-foreground-muted">
            {uploading ? (
              <LoaderCircle
                aria-hidden="true"
                className="size-5 animate-spin motion-reduce:animate-none"
              />
            ) : (
              <ImagePlus aria-hidden="true" className="size-5" />
            )}
          </span>
          <span className="mt-3 block text-sm font-semibold">
            {uploading ? "Uploading images…" : label}
          </span>
          <span className="mt-1 block text-xs leading-5 text-foreground-muted">
            JPEG, PNG, WebP, or AVIF · maximum {IMAGE_UPLOAD_MAX_LABEL}
          </span>
          {uploading && (
            <span
              className="mt-3 block h-1.5 w-44 overflow-hidden rounded-full bg-surface-subtle"
              role="progressbar"
              aria-label="Image upload progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.min(Math.max(progress ?? 0, 0), 100)}
            >
              <span
                className="block h-full bg-info transition-[width] motion-reduce:transition-none"
                style={{
                  width: `${Math.min(Math.max(progress ?? 0, 0), 100)}%`,
                }}
              />
            </span>
          )}
        </label>
      </div>

      {error && (
        <div className="grid gap-2">
          <InlineAlert
            tone="danger"
            title="Image action failed"
            description={error}
          />
          {retryFiles.length > 0 && (
            <Button
              size="small"
              variant="secondary"
              onClick={() => void uploadFiles(retryFiles)}
              disabled={uploading}
              className="justify-self-start"
            >
              <RotateCcw aria-hidden="true" className="size-4" />
              Retry
            </Button>
          )}
        </div>
      )}

      {realWorkflow && (
        <ImageReorderGrid
          images={images}
          {...(images.find((image) => image.isCover)?.id
            ? { coverImageId: images.find((image) => image.isCover)!.id }
            : {})}
          onMove={handleMove}
          onRemove={(imageId) => void handleRemove(imageId)}
          onCoverChange={handleCover}
          onAltTextChange={handleAltText}
          disabled={disabled || uploading}
        />
      )}
    </div>
  );
}
