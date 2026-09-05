"use client";

import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Images,
  LoaderCircle,
  PackagePlus,
  Plus,
  Scale,
  Trash2,
  UploadCloud,
  Video,
} from "lucide-react";
import { useActionState, useMemo, useState, type FormEvent } from "react";
import { useFormStatus } from "react-dom";
import {
  ProductMediaUploader,
  WeightPriceEditor,
  type WeightPriceDraft,
} from "@/components/admin";
import {
  Badge,
  Button,
  Card,
  FieldDescription,
  FormField,
  IconButton,
  InlineAlert,
  Label,
  Select,
  TextArea,
  TextField,
  buttonVariants,
} from "@/components/ui";
import { initialProductActionState } from "@/features/products/server/action-state";
import { createProductsAction } from "@/features/products/server/actions";
import type { ProductCategoryOption } from "@/features/products/components/product-form";
import { cn } from "@/lib/utils";
import type { ManagedImage, ManagedVideo } from "@/types/media";

const MAX_BULK_PRODUCTS = 10;

type UploadState = {
  status: "idle" | "uploading" | "success" | "error";
  progress: number;
};

interface ProductDraft {
  id: string;
  name: string;
  shortDescription: string;
  description: string;
  status: "DRAFT" | "ACTIVE";
  images: ManagedImage[];
  video: ManagedVideo | null;
  priceOptions: WeightPriceDraft[];
  upload: UploadState;
}

function newPriceOption(): WeightPriceDraft {
  return {
    id: crypto.randomUUID(),
    weightValue: "",
    weightUnit: "G",
    currency: "GBP",
    priceMajor: "",
    costMajor: "",
  };
}

function newProductDraft(): ProductDraft {
  return {
    id: crypto.randomUUID(),
    name: "",
    shortDescription: "",
    description: "",
    status: "DRAFT",
    images: [],
    video: null,
    priceOptions: [],
    upload: { status: "idle", progress: 0 },
  };
}

function imagePayload(images: readonly ManagedImage[]) {
  return images.map((image, position) => ({
    cloudinaryPublicId: image.publicId,
    url: image.url,
    altText: image.altText,
    width: image.width,
    height: image.height,
    position,
    isCover: image.isCover,
  }));
}

function videoPayload(video: ManagedVideo | null) {
  if (!video) return null;
  return {
    cloudinaryPublicId: video.publicId,
    url: video.url,
    posterUrl: video.posterUrl,
    altText: video.altText,
    width: video.width,
    height: video.height,
    durationSeconds: video.durationSeconds,
  };
}

function priceOptionIsComplete(option: WeightPriceDraft) {
  return (
    Number(option.weightValue) > 0 &&
    option.priceMajor.trim() !== "" &&
    Number.isFinite(Number(option.priceMajor)) &&
    Number(option.priceMajor) >= 0 &&
    (option.costMajor.trim() === "" ||
      (Number.isFinite(Number(option.costMajor)) &&
        Number(option.costMajor) > 0 &&
        Number(option.costMajor) < Number(option.priceMajor)))
  );
}

function draftIsComplete(draft: ProductDraft) {
  const hasCoreDetails =
    draft.name.trim().length >= 2 && draft.shortDescription.trim().length >= 2;
  const imagesAreValid = draft.images.every(
    (image) => image.altText.trim().length >= 3,
  );
  const pricesAreValid = draft.priceOptions.every(priceOptionIsComplete);
  const hasRequiredPrice =
    draft.status === "DRAFT" || draft.priceOptions.length > 0;
  return hasCoreDetails && imagesAreValid && pricesAreValid && hasRequiredPrice;
}

function draftError(draft: ProductDraft) {
  if (draft.name.trim().length < 2) return "Enter a product name.";
  if (draft.shortDescription.trim().length < 2) {
    return "Enter a short description.";
  }
  if (draft.images.some((image) => image.altText.trim().length < 3)) {
    return "Every image needs useful alternative text.";
  }
  if (draft.priceOptions.some((option) => !priceOptionIsComplete(option))) {
    return "Complete or remove every weight and price option.";
  }
  if (draft.status === "ACTIVE" && draft.priceOptions.length === 0) {
    return "Active products need at least one valid weight and price.";
  }
  return undefined;
}

function BatchSubmitButton({
  count,
  uploadsPending,
}: {
  count: number;
  uploadsPending: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || uploadsPending}>
      {pending ? (
        <LoaderCircle
          aria-hidden="true"
          className="size-4 animate-spin motion-reduce:animate-none"
        />
      ) : (
        <PackagePlus aria-hidden="true" className="size-4" />
      )}
      {pending
        ? `Creating ${count} ${count === 1 ? "product" : "products"}…`
        : `Create ${count} ${count === 1 ? "product" : "products"}`}
    </Button>
  );
}

export function BulkProductForm({
  categories,
}: {
  categories: readonly ProductCategoryOption[];
}) {
  const [state, formAction] = useActionState(
    createProductsAction,
    initialProductActionState,
  );
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [drafts, setDrafts] = useState<ProductDraft[]>([newProductDraft()]);
  const [expandedId, setExpandedId] = useState(drafts[0]!.id);
  const [localError, setLocalError] = useState<string>();

  const payload = useMemo(
    () =>
      drafts.map((draft) => ({
        categoryId,
        name: draft.name,
        shortDescription: draft.shortDescription,
        description: draft.description,
        status: draft.status,
        images: imagePayload(draft.images),
        video: videoPayload(draft.video),
        priceOptions: draft.priceOptions,
      })),
    [categoryId, drafts],
  );

  const uploadsPending = drafts.some(
    (draft) => draft.upload.status === "uploading",
  );
  const readyCount = drafts.filter(draftIsComplete).length;

  function updateDraft(id: string, changes: Partial<Omit<ProductDraft, "id">>) {
    setDrafts((current) =>
      current.map((draft) =>
        draft.id === id ? { ...draft, ...changes } : draft,
      ),
    );
  }

  function addDraft() {
    if (drafts.length >= MAX_BULK_PRODUCTS) return;
    const draft = newProductDraft();
    setDrafts((current) => [...current, draft]);
    setExpandedId(draft.id);
    setLocalError(undefined);
  }

  function removeDraft(id: string) {
    if (drafts.length === 1) return;
    const index = drafts.findIndex((draft) => draft.id === id);
    const remaining = drafts.filter((draft) => draft.id !== id);
    setDrafts(remaining);
    if (expandedId === id) {
      setExpandedId(remaining[Math.max(0, index - 1)]?.id ?? remaining[0]!.id);
    }
  }

  function validateBatch(event: FormEvent<HTMLFormElement>) {
    if (uploadsPending) {
      event.preventDefault();
      setLocalError("Wait for every media upload to finish before saving.");
      return;
    }
    const invalidIndex = drafts.findIndex((draft) => draftError(draft));
    if (invalidIndex >= 0) {
      event.preventDefault();
      const invalid = drafts[invalidIndex]!;
      setExpandedId(invalid.id);
      setLocalError(
        `Product ${invalidIndex + 1}: ${draftError(invalid) ?? "Review this product."}`,
      );
      return;
    }
    setLocalError(undefined);
  }

  return (
    <form action={formAction} onSubmit={validateBatch} className="mt-8">
      <input type="hidden" name="products" value={JSON.stringify(payload)} />

      {(localError || state.status === "error") && (
        <InlineAlert
          tone="danger"
          title="Review the product batch"
          description={localError ?? state.message}
          className="mb-6"
        />
      )}

      <Card className="p-5 sm:p-6">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <FormField id="bulk-category" hasDescription>
            <Label required>Category for this batch</Label>
            <Select
              name="category-preview"
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
              required
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                  {category.isActive ? "" : " — inactive"}
                </option>
              ))}
            </Select>
            <FieldDescription>
              Every product in this batch will be assigned to this category.
            </FieldDescription>
          </FormField>

          <div className="flex items-center gap-2">
            <Badge tone={readyCount === drafts.length ? "success" : "neutral"}>
              {readyCount}/{drafts.length} ready
            </Badge>
            <Badge tone="info">{drafts.length}/10 products</Badge>
          </div>
        </div>
      </Card>

      <div className="mt-4 grid gap-3">
        {drafts.map((draft, index) => {
          const expanded = expandedId === draft.id;
          const complete = draftIsComplete(draft);
          const uploadLabel =
            draft.upload.status === "uploading"
              ? `Uploading ${draft.upload.progress}%`
              : draft.upload.status === "error"
                ? "Upload failed"
                : complete
                  ? "Ready"
                  : "Incomplete";
          const tone =
            draft.upload.status === "error"
              ? "danger"
              : draft.upload.status === "uploading"
                ? "info"
                : complete
                  ? "success"
                  : "neutral";

          return (
            <Card key={draft.id} className="overflow-hidden">
              <div className="flex min-h-16 items-center gap-3 px-4 py-3 sm:px-5">
                <button
                  type="button"
                  onClick={() => setExpandedId(expanded ? "" : draft.id)}
                  aria-expanded={expanded}
                  aria-controls={`bulk-product-${draft.id}`}
                  className="flex min-w-0 flex-1 items-center gap-3 rounded-md text-left focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-surface-subtle font-semibold">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold sm:text-base">
                      {draft.name.trim() || `Product ${index + 1}`}
                    </span>
                    <span className="mt-0.5 flex items-center gap-2 text-xs text-foreground-muted">
                      <Images aria-hidden="true" className="size-3.5" />
                      {draft.images.length}{" "}
                      {draft.images.length === 1 ? "image" : "images"}
                      {draft.video && (
                        <>
                          <span aria-hidden="true">·</span>
                          <Video aria-hidden="true" className="size-3.5" />
                          video
                        </>
                      )}
                      <span aria-hidden="true">·</span>
                      <Scale aria-hidden="true" className="size-3.5" />
                      {draft.priceOptions.length}{" "}
                      {draft.priceOptions.length === 1 ? "price" : "prices"}
                    </span>
                  </span>
                  <Badge tone={tone}>
                    {draft.upload.status === "uploading" && (
                      <UploadCloud
                        aria-hidden="true"
                        className="mr-1 size-3.5"
                      />
                    )}
                    {draft.upload.status === "error" && (
                      <AlertCircle
                        aria-hidden="true"
                        className="mr-1 size-3.5"
                      />
                    )}
                    {draft.upload.status !== "uploading" &&
                      draft.upload.status !== "error" &&
                      complete && (
                        <CheckCircle2
                          aria-hidden="true"
                          className="mr-1 size-3.5"
                        />
                      )}
                    {uploadLabel}
                  </Badge>
                  {expanded ? (
                    <ChevronUp aria-hidden="true" className="size-5 shrink-0" />
                  ) : (
                    <ChevronDown
                      aria-hidden="true"
                      className="size-5 shrink-0"
                    />
                  )}
                </button>
                <IconButton
                  aria-label={`Remove product ${index + 1}`}
                  title="Remove product"
                  onClick={() => removeDraft(draft.id)}
                  disabled={drafts.length === 1 || uploadsPending}
                  className="shrink-0 text-danger"
                >
                  <Trash2 aria-hidden="true" className="size-4" />
                </IconButton>
              </div>

              {draft.upload.status === "uploading" && (
                <div
                  className="h-1 bg-surface-subtle"
                  role="progressbar"
                  aria-label={`Product ${index + 1} upload progress`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={draft.upload.progress}
                >
                  <div
                    className="h-full bg-info transition-[width] motion-reduce:transition-none"
                    style={{ width: `${draft.upload.progress}%` }}
                  />
                </div>
              )}

              {expanded && (
                <div
                  id={`bulk-product-${draft.id}`}
                  className="grid gap-6 border-t border-border px-4 py-5 sm:px-5 lg:grid-cols-2"
                >
                  <div className="grid content-start gap-5">
                    <FormField id={`name-${draft.id}`}>
                      <Label required>Product name</Label>
                      <TextField
                        value={draft.name}
                        onChange={(event) =>
                          updateDraft(draft.id, { name: event.target.value })
                        }
                        placeholder="For example, Fresh spinach"
                        maxLength={160}
                      />
                    </FormField>

                    <FormField id={`short-description-${draft.id}`}>
                      <Label required>Short description</Label>
                      <TextArea
                        value={draft.shortDescription}
                        onChange={(event) =>
                          updateDraft(draft.id, {
                            shortDescription: event.target.value,
                          })
                        }
                        placeholder="A concise description for product cards."
                        maxLength={280}
                        rows={3}
                      />
                    </FormField>

                    <FormField id={`description-${draft.id}`}>
                      <Label optional>Full description</Label>
                      <TextArea
                        value={draft.description}
                        onChange={(event) =>
                          updateDraft(draft.id, {
                            description: event.target.value,
                          })
                        }
                        placeholder="Add preparation, storage, or sourcing details."
                        maxLength={10_000}
                        rows={5}
                      />
                    </FormField>

                    <FormField id={`status-${draft.id}`} hasDescription>
                      <Label required>Initial status</Label>
                      <Select
                        value={draft.status}
                        onChange={(event) =>
                          updateDraft(draft.id, {
                            status: event.target.value as "DRAFT" | "ACTIVE",
                          })
                        }
                      >
                        <option value="DRAFT">Draft</option>
                        <option value="ACTIVE">Active</option>
                      </Select>
                      <FieldDescription>
                        Active products require an active category and a valid
                        price.
                      </FieldDescription>
                    </FormField>
                  </div>

                  <div className="grid content-start gap-6">
                    <section className="grid gap-3">
                      <div>
                        <h3 className="text-sm font-semibold">Product media</h3>
                        <p className="mt-1 text-xs leading-5 text-foreground-muted">
                          Select images and one optional video together, then
                          choose the image cover.
                        </p>
                      </div>
                      <ProductMediaUploader
                        images={draft.images}
                        onImagesChange={(images) =>
                          updateDraft(draft.id, { images })
                        }
                        video={draft.video}
                        onVideoChange={(video) =>
                          updateDraft(draft.id, { video })
                        }
                        onUploadProgressChange={(upload) =>
                          updateDraft(draft.id, { upload })
                        }
                        maxImages={8}
                        label="Add product media"
                      />
                    </section>

                    <WeightPriceEditor
                      options={draft.priceOptions}
                      onAdd={() =>
                        updateDraft(draft.id, {
                          priceOptions: [
                            ...draft.priceOptions,
                            newPriceOption(),
                          ],
                        })
                      }
                      onUpdate={(optionId, changes) =>
                        updateDraft(draft.id, {
                          priceOptions: draft.priceOptions.map((option) =>
                            option.id === optionId
                              ? { ...option, ...changes }
                              : option,
                          ),
                        })
                      }
                      onRemove={(optionId) =>
                        updateDraft(draft.id, {
                          priceOptions: draft.priceOptions.filter(
                            (option) => option.id !== optionId,
                          ),
                        })
                      }
                    />
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <div className="mt-4 flex flex-col gap-3 rounded-xl bg-surface-subtle p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold">
            {drafts.length} of {MAX_BULK_PRODUCTS} product slots used
          </p>
          <p className="mt-0.5 text-xs text-foreground-muted">
            Add products now; edit any saved product individually later.
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={addDraft}
          disabled={drafts.length >= MAX_BULK_PRODUCTS || uploadsPending}
        >
          <Plus aria-hidden="true" className="size-4" />
          Add another product
        </Button>
      </div>

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link
          href="/admin/products"
          className={cn(
            buttonVariants({ variant: "secondary" }),
            "w-full sm:w-auto",
          )}
        >
          Cancel
        </Link>
        <BatchSubmitButton
          count={drafts.length}
          uploadsPending={uploadsPending}
        />
      </div>
    </form>
  );
}
