"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { ImageUploader } from "@/components/admin";
import {
  Button,
  Card,
  FieldDescription,
  FieldError,
  FormField,
  InlineAlert,
  Label,
  Select,
  Switch,
  TextArea,
  TextField,
  buttonVariants,
} from "@/components/ui";
import {
  CATEGORY_DISPLAY_TONE_OPTIONS,
  getCategoryDisplayTone,
  type CategoryDisplayTone,
} from "@/config/category-presentation";
import { CategoryShowcasePreview } from "@/features/categories/components/category-showcase-preview";
import { OfferPolicyFields } from "@/features/special-offers/components/offer-policy-fields";
import { initialCategoryActionState } from "@/features/categories/server/action-state";
import {
  createCategoryAction,
  updateCategoryAction,
} from "@/features/categories/server/actions";
import type { CategoryViewModel } from "@/features/categories/server/queries";
import { cn } from "@/lib/utils";
import type { ManagedImage } from "@/types/media";

function SubmitButton({ mode }: { mode: "create" | "edit" }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending
        ? mode === "create"
          ? "Creating..."
          : "Saving..."
        : mode === "create"
          ? "Create category"
          : "Save changes"}
    </Button>
  );
}

function serializedImage(image: ManagedImage | undefined) {
  if (!image) return "";
  return JSON.stringify({
    publicId: image.publicId,
    url: image.url,
    altText: image.altText,
    width: image.width,
    height: image.height,
  });
}

export function CategoryForm({
  mode,
  category,
}: {
  mode: "create" | "edit";
  category?: CategoryViewModel;
}) {
  const action =
    mode === "create"
      ? createCategoryAction
      : updateCategoryAction.bind(null, category?.id ?? "");
  const [state, formAction] = useActionState(
    action,
    initialCategoryActionState,
  );
  const [images, setImages] = useState<ManagedImage[]>(
    category?.image ? [category.image] : [],
  );
  const [name, setName] = useState(category?.name ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  const [displayTone, setDisplayTone] = useState<CategoryDisplayTone>(
    category?.displayTone ?? "MIST",
  );
  const nameError = state.fieldErrors?.name?.[0];
  const descriptionError = state.fieldErrors?.description?.[0];
  const displayToneError = state.fieldErrors?.displayTone?.[0];
  const imageError =
    state.fieldErrors?.image?.[0] ?? state.fieldErrors?.["image.altText"]?.[0];
  const selectedTone = getCategoryDisplayTone(displayTone);

  return (
    <form action={formAction} className="mt-8 grid gap-6">
      <input type="hidden" name="image" value={serializedImage(images[0])} />
      {state.status === "error" && (
        <InlineAlert
          tone="danger"
          title="Could not save category"
          description={state.message}
        />
      )}

      <Card className="p-5 sm:p-7">
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,28rem)] xl:items-start">
          <div className="grid gap-6">
            <FormField
              id="category-name"
              hasDescription
              hasError={Boolean(nameError)}
            >
              <Label required>Category name</Label>
              <TextField
                name="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="For example, Leafy greens"
                minLength={2}
                maxLength={120}
                required
                autoFocus
              />
              <FieldDescription>
                The public slug is generated automatically and kept unique.
              </FieldDescription>
              <FieldError>{nameError}</FieldError>
            </FormField>

            <FormField
              id="category-description"
              hasDescription
              hasError={Boolean(descriptionError)}
            >
              <Label optional>Description</Label>
              <TextArea
                name="description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Describe what customers will find in this category."
                maxLength={500}
                rows={5}
              />
              <FieldDescription>Maximum 500 characters.</FieldDescription>
              <FieldError>{descriptionError}</FieldError>
            </FormField>

            <FormField
              id="category-display-tone"
              hasDescription
              hasError={Boolean(displayToneError)}
            >
              <Label required>Storefront surface</Label>
              <Select
                name="displayTone"
                value={displayTone}
                onChange={(event) =>
                  setDisplayTone(event.target.value as CategoryDisplayTone)
                }
                required
              >
                {CATEGORY_DISPLAY_TONE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
              <FieldDescription>
                {selectedTone.description} Blue, green, and red remain reserved
                for status indications.
              </FieldDescription>
              <FieldError>{displayToneError}</FieldError>
            </FormField>

            <section className="grid gap-4 border-t border-border pt-5">
              <div>
                <h2 className="text-base font-semibold tracking-[-0.02em]">
                  Category image
                </h2>
                <p className="mt-1 text-sm leading-6 text-foreground-muted">
                  Add one real category image. Uploading a new image replaces
                  the current image only after you save this category.
                </p>
              </div>
              <ImageUploader
                scope="category"
                images={images}
                onImagesChange={setImages}
                maxFiles={1}
                multiple={false}
                label={
                  images.length
                    ? "Replace category image"
                    : "Add category image"
                }
              />
              {imageError && (
                <InlineAlert
                  tone="danger"
                  title="Check the category image"
                  description={imageError}
                />
              )}
            </section>

            {mode === "create" && <OfferPolicyFields />}

            <div className="border-t border-border pt-5">
              <Switch
                name="isActive"
                defaultChecked={category?.isActive ?? true}
                label="Active category"
                description="Only active, non-archived categories are returned to the storefront."
              />
            </div>
          </div>

          <div className="xl:sticky xl:top-24">
            <CategoryShowcasePreview
              name={name}
              description={description}
              image={images[0] ?? null}
              displayTone={displayTone}
            />
          </div>
        </div>
      </Card>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link
          href="/admin/categories"
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
