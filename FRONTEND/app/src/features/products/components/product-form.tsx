"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  ProductMediaUploader,
  WeightPriceEditor,
  type WeightPriceDraft,
} from "@/components/admin";
import {
  Button,
  Card,
  FieldDescription,
  FieldError,
  FormField,
  InlineAlert,
  Label,
  Select,
  TextArea,
  TextField,
  buttonVariants,
} from "@/components/ui";
import { initialProductActionState } from "@/features/products/server/action-state";
import {
  createProductAction,
  updateProductAction,
} from "@/features/products/server/actions";
import type { ProductViewModel } from "@/features/products/server/queries";
import { ProductPreview } from "@/features/products/components/product-preview";
import { cn } from "@/lib/utils";
import type { ManagedImage, ManagedVideo } from "@/types/media";

export interface ProductCategoryOption {
  id: string;
  name: string;
  isActive: boolean;
}

function minorToMajor(minor: string) {
  const value = BigInt(minor);
  const whole = value / 100n;
  const fraction = (value % 100n).toString().padStart(2, "0");
  return `${whole}.${fraction}`;
}

function initialPrices(product?: ProductViewModel): WeightPriceDraft[] {
  return (
    product?.priceOptions.map((option) => ({
      id: option.id,
      weightValue: option.weightValue,
      weightUnit: option.weightUnit,
      currency: option.currency,
      priceMajor: minorToMajor(option.priceMinor),
      costMajor: option.costMinor ? minorToMajor(option.costMinor) : "",
    })) ?? []
  );
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

function SubmitButton({ mode }: { mode: "create" | "edit" }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending
        ? mode === "create"
          ? "Creating product…"
          : "Saving product…"
        : mode === "create"
          ? "Create product"
          : "Save changes"}
    </Button>
  );
}

export function ProductForm({
  mode,
  categories,
  product,
}: {
  mode: "create" | "edit";
  categories: readonly ProductCategoryOption[];
  product?: ProductViewModel;
}) {
  const action =
    mode === "create"
      ? createProductAction
      : updateProductAction.bind(null, product?.id ?? "");
  const [state, formAction] = useActionState(action, initialProductActionState);
  const [name, setName] = useState(product?.name ?? "");
  const [shortDescription, setShortDescription] = useState(
    product?.shortDescription ?? "",
  );
  const [categoryId, setCategoryId] = useState(
    product && categories.some((category) => category.id === product.categoryId)
      ? product.categoryId
      : (categories[0]?.id ?? ""),
  );
  const [status, setStatus] = useState<"DRAFT" | "ACTIVE">(
    product?.status === "ACTIVE" ? "ACTIVE" : "DRAFT",
  );
  const [images, setImages] = useState<ManagedImage[]>(product?.images ?? []);
  const [video, setVideo] = useState<ManagedVideo | null>(
    product?.video ?? null,
  );
  const [priceOptions, setPriceOptions] = useState<WeightPriceDraft[]>(
    initialPrices(product),
  );
  const categoryName = useMemo(
    () => categories.find((category) => category.id === categoryId)?.name ?? "",
    [categories, categoryId],
  );

  function addPriceOption() {
    setPriceOptions((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        weightValue: "",
        weightUnit: "G",
        currency: "GBP",
        priceMajor: "",
        costMajor: "",
      },
    ]);
  }

  function updatePriceOption(
    id: string,
    changes: Partial<Omit<WeightPriceDraft, "id">>,
  ) {
    setPriceOptions((current) =>
      current.map((option) =>
        option.id === id ? { ...option, ...changes } : option,
      ),
    );
  }

  const nameError = state.fieldErrors?.name?.[0];
  const categoryError = state.fieldErrors?.categoryId?.[0];
  const shortDescriptionError = state.fieldErrors?.shortDescription?.[0];
  const imageError = state.fieldErrors?.images?.[0];
  const videoError = state.fieldErrors?.video?.[0];
  const priceError = state.fieldErrors?.priceOptions?.[0];

  return (
    <form action={formAction} className="mt-8">
      <input
        type="hidden"
        name="images"
        value={JSON.stringify(imagePayload(images))}
      />
      <input
        type="hidden"
        name="video"
        value={JSON.stringify(videoPayload(video))}
      />
      <input
        type="hidden"
        name="priceOptions"
        value={JSON.stringify(priceOptions)}
      />

      {state.status === "error" && (
        <InlineAlert
          tone="danger"
          title="Could not save product"
          description={state.message}
          className="mb-6"
        />
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <div className="grid gap-6">
          <Card className="grid gap-6 p-5 sm:p-7">
            <div>
              <h2 className="text-base font-semibold tracking-[-0.02em]">
                Product information
              </h2>
              <p className="mt-1 text-sm leading-6 text-foreground-muted">
                Core catalog details and publishing state.
              </p>
            </div>

            <FormField
              id="product-name"
              hasError={Boolean(nameError)}
              hasDescription
            >
              <Label required>Product name</Label>
              <TextField
                name="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="For example, Fresh spinach"
                minLength={2}
                maxLength={160}
                required
                autoFocus
              />
              <FieldDescription>
                A unique public slug is generated automatically.
              </FieldDescription>
              <FieldError>{nameError}</FieldError>
            </FormField>

            <div className="grid gap-6 sm:grid-cols-2">
              <FormField
                id="product-category"
                hasError={Boolean(categoryError)}
              >
                <Label required>Category</Label>
                <Select
                  name="categoryId"
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
                <FieldError>{categoryError}</FieldError>
              </FormField>

              <FormField id="product-status" hasDescription>
                <Label required>Status</Label>
                <Select
                  name="status"
                  value={status}
                  onChange={(event) =>
                    setStatus(event.target.value as "DRAFT" | "ACTIVE")
                  }
                >
                  <option value="DRAFT">Draft</option>
                  <option value="ACTIVE">Active</option>
                </Select>
                <FieldDescription>
                  Active products require an active category and price.
                </FieldDescription>
              </FormField>
            </div>

            <FormField
              id="product-short-description"
              hasError={Boolean(shortDescriptionError)}
              hasDescription
            >
              <Label required>Short description</Label>
              <TextArea
                name="shortDescription"
                value={shortDescription}
                onChange={(event) => setShortDescription(event.target.value)}
                placeholder="A concise description for product cards."
                minLength={2}
                maxLength={280}
                rows={3}
                required
              />
              <FieldDescription>Maximum 280 characters.</FieldDescription>
              <FieldError>{shortDescriptionError}</FieldError>
            </FormField>

            <FormField id="product-description" hasDescription>
              <Label optional>Full description</Label>
              <TextArea
                name="description"
                defaultValue={product?.description ?? ""}
                placeholder="Add preparation, storage, or sourcing details."
                maxLength={10_000}
                rows={7}
              />
              <FieldDescription>Maximum 10,000 characters.</FieldDescription>
            </FormField>
          </Card>

          <Card className="grid gap-5 p-5 sm:p-7">
            <div>
              <h2 className="text-base font-semibold tracking-[-0.02em]">
                Product media
              </h2>
              <p className="mt-1 text-sm leading-6 text-foreground-muted">
                Select images and one optional product video in one upload.
              </p>
            </div>
            <ProductMediaUploader
              images={images}
              onImagesChange={setImages}
              video={video}
              onVideoChange={setVideo}
              maxImages={8}
              label="Add product media"
            />
            {(imageError || videoError) && (
              <InlineAlert
                tone="danger"
                title="Check product media"
                description={imageError ?? videoError}
              />
            )}
          </Card>

          <Card className="grid gap-5 p-5 sm:p-7">
            <div>
              <h2 className="text-base font-semibold tracking-[-0.02em]">
                Weight and pricing
              </h2>
              <p className="mt-1 text-sm leading-6 text-foreground-muted">
                Prices are stored independently in their selected currency. MOB
                GREENS never converts values automatically.
              </p>
            </div>
            <WeightPriceEditor
              options={priceOptions}
              onAdd={addPriceOption}
              onUpdate={updatePriceOption}
              onRemove={(id) =>
                setPriceOptions((current) =>
                  current.filter((option) => option.id !== id),
                )
              }
            />
            {priceError && (
              <InlineAlert
                tone="danger"
                title="Check weight and pricing"
                description={priceError}
              />
            )}
          </Card>
        </div>

        <ProductPreview
          name={name}
          categoryName={categoryName}
          shortDescription={shortDescription}
          status={status}
          images={images}
          video={video}
          priceOptions={priceOptions}
        />
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
        <SubmitButton mode={mode} />
      </div>
    </form>
  );
}
