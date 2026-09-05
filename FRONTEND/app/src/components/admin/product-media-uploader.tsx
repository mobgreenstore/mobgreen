"use client";

import { ImagePlus, LoaderCircle, Trash2, Video } from "lucide-react";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import { ImageGallery } from "@/components/commerce/image-gallery";
import { ImageReorderGrid } from "@/components/admin/image-reorder-grid";
import { Button, InlineAlert, Label, TextField } from "@/components/ui";
import { IMAGE_UPLOAD_ACCEPT, IMAGE_UPLOAD_MAX_LABEL } from "@/config/images";
import {
  PRODUCT_VIDEO_UPLOAD_ACCEPT,
  PRODUCT_VIDEO_UPLOAD_MAX_LABEL,
} from "@/config/product-video";
import {
  removeAdminImage,
  uploadAdminImage,
  validateClientImageFile,
} from "@/features/media/client/image-api";
import {
  removeAdminProductVideo,
  uploadAdminProductVideo,
  validateClientProductVideoFile,
} from "@/features/media/client/video-api";
import { cn } from "@/lib/utils";
import type { ManagedImage, ManagedVideo } from "@/types/media";
import type { ImageUploadProgress } from "./image-uploader";

export interface ProductMediaUploaderProps {
  images: readonly ManagedImage[];
  video: ManagedVideo | null;
  onImagesChange: (images: ManagedImage[]) => void;
  onVideoChange: (video: ManagedVideo | null) => void;
  maxImages?: number;
  disabled?: boolean;
  onUploadProgressChange?: (state: ImageUploadProgress) => void;
  label?: string;
  className?: string;
}

function ordered(images: readonly ManagedImage[]) {
  return images.map((image, position) => ({ ...image, position }));
}

export function ProductMediaUploader({
  images,
  video,
  onImagesChange,
  onVideoChange,
  maxImages = 8,
  disabled = false,
  onUploadProgressChange,
  label = "Add product media",
  className,
}: ProductMediaUploaderProps) {
  const inputId = `product-media-${useId().replaceAll(":", "")}`;
  const descriptionId = `product-media-description-${useId().replaceAll(":", "")}`;
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string>();
  const imagesRef = useRef(images);
  const videoRef = useRef(video);
  const coverImageId = images.find((image) => image.isCover)?.id;

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  useEffect(() => {
    videoRef.current = video;
  }, [video]);

  useEffect(() => {
    return () => {
      for (const image of imagesRef.current) {
        if (!image.persisted) {
          void removeAdminImage(image.publicId).catch(() => undefined);
        }
      }
      const transientVideo = videoRef.current;
      if (transientVideo && !transientVideo.persisted) {
        void removeAdminProductVideo(transientVideo.publicId).catch(
          () => undefined,
        );
      }
    };
  }, []);

  function updateProgress(nextProgress: number) {
    setProgress(nextProgress);
    onUploadProgressChange?.({ status: "uploading", progress: nextProgress });
  }

  async function uploadFiles(files: File[]) {
    if (disabled || uploading || files.length === 0) return;
    setError(undefined);
    const usefulDescription = description.trim();
    if (usefulDescription.length < 3) {
      setError("Describe the media before uploading it.");
      onUploadProgressChange?.({ status: "error", progress: 0 });
      return;
    }

    const imageFiles = files.filter((file) => file.type.startsWith("image/"));
    const videoFiles = files.filter((file) => file.type.startsWith("video/"));
    if (imageFiles.length + videoFiles.length !== files.length) {
      setError("Choose images or one MP4, WebM, or MOV video.");
      onUploadProgressChange?.({ status: "error", progress: 0 });
      return;
    }
    if (videoFiles.length > 1) {
      setError("Choose at most one product video at a time.");
      onUploadProgressChange?.({ status: "error", progress: 0 });
      return;
    }
    if (images.length + imageFiles.length > maxImages) {
      setError(`You can add up to ${maxImages} product images.`);
      onUploadProgressChange?.({ status: "error", progress: 0 });
      return;
    }
    for (const file of imageFiles) {
      const validationError = validateClientImageFile(file);
      if (validationError) {
        setError(validationError);
        onUploadProgressChange?.({ status: "error", progress: 0 });
        return;
      }
    }
    for (const file of videoFiles) {
      const validationError = validateClientProductVideoFile(file);
      if (validationError) {
        setError(validationError);
        onUploadProgressChange?.({ status: "error", progress: 0 });
        return;
      }
    }

    setUploading(true);
    updateProgress(0);
    const totalFiles = files.length;
    const uploadedImages: ManagedImage[] = [];
    let uploadedVideo: ManagedVideo | null = null;
    let nextImages: ManagedImage[] | null = null;
    try {
      for (const [index, file] of imageFiles.entries()) {
        const image = await uploadAdminImage({
          file,
          scope: "product",
          altText:
            imageFiles.length === 1
              ? usefulDescription
              : `${usefulDescription} ${index + 1}`,
          onProgress: (fileProgress) =>
            updateProgress(
              Math.round(((index + fileProgress / 100) / totalFiles) * 100),
            ),
        });
        uploadedImages.push(image);
      }

      if (uploadedImages.length) {
        const hadCover = images.some((current) => current.isCover);
        nextImages = ordered([...images, ...uploadedImages]).map(
          (image, index) => ({
            ...image,
            isCover: hadCover ? image.isCover : index === 0,
          }),
        );
      }

      const videoFile = videoFiles[0];
      if (videoFile) {
        uploadedVideo = await uploadAdminProductVideo({
          file: videoFile,
          altText: usefulDescription,
          onProgress: (fileProgress) =>
            updateProgress(
              Math.round(
                ((imageFiles.length + fileProgress / 100) / totalFiles) * 100,
              ),
            ),
        });
      }

      if (nextImages) {
        imagesRef.current = nextImages;
        onImagesChange(nextImages);
      }
      if (uploadedVideo) {
        const previousVideo = videoRef.current;
        videoRef.current = uploadedVideo;
        onVideoChange(uploadedVideo);
        if (previousVideo && !previousVideo.persisted) {
          void removeAdminProductVideo(previousVideo.publicId).catch(
            () => undefined,
          );
        }
      }

      setDescription("");
      updateProgress(100);
      onUploadProgressChange?.({ status: "success", progress: 100 });
    } catch (uploadError) {
      await Promise.allSettled(
        uploadedImages.map((image) => removeAdminImage(image.publicId)),
      );
      if (uploadedVideo) {
        await removeAdminProductVideo(uploadedVideo.publicId).catch(
          () => undefined,
        );
      }
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "The media could not be uploaded. Try again.",
      );
      onUploadProgressChange?.({ status: "error", progress: 0 });
    } finally {
      setUploading(false);
    }
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (files.length) void uploadFiles(files);
    event.target.value = "";
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    if (disabled || uploading) return;
    const files = Array.from(event.dataTransfer.files);
    if (files.length) void uploadFiles(files);
  }

  async function removeImage(imageId: string) {
    const image = images.find((item) => item.id === imageId);
    if (!image) return;
    setError(undefined);
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

  function moveImage(imageId: string, direction: "back" | "forward") {
    const index = images.findIndex((image) => image.id === imageId);
    const destination = direction === "back" ? index - 1 : index + 1;
    if (index < 0 || destination < 0 || destination >= images.length) return;
    const next = [...images];
    [next[index], next[destination]] = [next[destination]!, next[index]!];
    onImagesChange(ordered(next));
  }

  async function removeVideo() {
    if (!video) return;
    setError(undefined);
    try {
      if (!video.persisted) await removeAdminProductVideo(video.publicId);
      onVideoChange(null);
    } catch (removeError) {
      setError(
        removeError instanceof Error
          ? removeError.message
          : "The video could not be removed.",
      );
    }
  }

  return (
    <div className={cn("grid gap-4", className)}>
      <div className="grid gap-2">
        <Label htmlFor={descriptionId} required>
          Media description
        </Label>
        <TextField
          id={descriptionId}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="For example, fresh spinach leaves in a basket"
          minLength={3}
          maxLength={255}
          disabled={disabled || uploading}
        />
        <p className="text-xs leading-5 text-foreground-muted">
          Select several images and one optional video in the same upload.
        </p>
      </div>

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
            "grid cursor-pointer place-items-center gap-2",
            (disabled || uploading) && "cursor-not-allowed",
          )}
        >
          <input
            id={inputId}
            type="file"
            accept={`${IMAGE_UPLOAD_ACCEPT},${PRODUCT_VIDEO_UPLOAD_ACCEPT}`}
            multiple
            disabled={disabled || uploading}
            className="sr-only"
            onChange={handleChange}
          />
          {uploading ? (
            <LoaderCircle
              aria-hidden="true"
              className="size-7 animate-spin motion-reduce:animate-none"
            />
          ) : (
            <span className="flex items-center gap-2" aria-hidden="true">
              <ImagePlus className="size-6" strokeWidth={1.7} />
              <Video className="size-6" strokeWidth={1.7} />
            </span>
          )}
          <span className="text-sm font-semibold">
            {uploading ? `Uploading ${progress}%` : label}
          </span>
          <span className="text-xs text-foreground-muted">
            Images up to {IMAGE_UPLOAD_MAX_LABEL}; one MP4, WebM, or MOV up to{" "}
            {PRODUCT_VIDEO_UPLOAD_MAX_LABEL}.
          </span>
        </label>
      </div>

      {(images.length > 0 || video) && (
        <ImageGallery
          images={images}
          video={video}
          label="Product media carousel"
        />
      )}

      {images.length > 0 && (
        <ImageReorderGrid
          images={images}
          {...(coverImageId ? { coverImageId } : {})}
          disabled={disabled || uploading}
          onMove={moveImage}
          onRemove={removeImage}
          onCoverChange={(imageId) =>
            onImagesChange(
              images.map((image) => ({
                ...image,
                isCover: image.id === imageId,
              })),
            )
          }
          onAltTextChange={(imageId, altText) =>
            onImagesChange(
              images.map((image) =>
                image.id === imageId ? { ...image, altText } : image,
              ),
            )
          }
        />
      )}

      {video && (
        <div className="overflow-hidden rounded-lg border border-border bg-surface">
          <video
            controls
            preload="metadata"
            playsInline
            poster={video.posterUrl ?? undefined}
            className="aspect-[4/3] w-full bg-black object-contain"
          >
            <source src={video.url} />
            Your browser cannot play this video.
          </video>
          <div className="grid gap-3 p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <div className="grid gap-1.5">
              <Label htmlFor={`product-video-alt-${video.id}`}>
                Video description
              </Label>
              <TextField
                id={`product-video-alt-${video.id}`}
                value={video.altText}
                minLength={3}
                maxLength={255}
                disabled={disabled || uploading}
                onChange={(event) =>
                  onVideoChange({ ...video, altText: event.target.value })
                }
              />
            </div>
            <Button
              type="button"
              variant="secondary"
              size="small"
              disabled={disabled || uploading}
              onClick={removeVideo}
            >
              <Trash2 aria-hidden="true" className="size-4" />
              Remove
            </Button>
          </div>
        </div>
      )}

      {error && (
        <InlineAlert
          tone="danger"
          title="Check product media"
          description={error}
        />
      )}
    </div>
  );
}
