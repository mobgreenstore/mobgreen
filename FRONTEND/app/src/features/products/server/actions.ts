"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import type { ProductActionState } from "@/features/products/server/action-state";
import { majorToMinor } from "@/features/products/server/pricing";
import { requireAdminPermission } from "@/server/auth/authorization";
import { ProductWriteService } from "@/server/services/product-write-service";

function parseJson(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value) return [];
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
}

function normalizeProductInput(value: Record<string, unknown>) {
  const rawPrices = value.priceOptions;
  const priceOptions = Array.isArray(rawPrices)
    ? rawPrices.map((option, position) => {
        const value =
          option && typeof option === "object"
            ? (option as Record<string, unknown>)
            : {};
        return {
          weightValue: value.weightValue,
          weightUnit: value.weightUnit,
          currency: value.currency,
          priceMinor: majorToMinor(value.priceMajor),
          costMinor:
            typeof value.costMajor === "string" && value.costMajor.trim()
              ? majorToMinor(value.costMajor)
              : null,
          position,
          isActive: true,
        };
      })
    : rawPrices;

  return {
    categoryId: value.categoryId,
    name: value.name,
    shortDescription: value.shortDescription,
    description: value.description,
    status: value.status,
    images: value.images,
    priceOptions,
  };
}

function productInput(formData: FormData) {
  return normalizeProductInput({
    categoryId: formData.get("categoryId"),
    name: formData.get("name"),
    shortDescription: formData.get("shortDescription"),
    description: formData.get("description"),
    status: formData.get("status"),
    images: parseJson(formData.get("images")),
    priceOptions: parseJson(formData.get("priceOptions")),
  });
}

function productsInput(formData: FormData) {
  const rawProducts = parseJson(formData.get("products"));
  return {
    products: Array.isArray(rawProducts)
      ? rawProducts.map((product) =>
          normalizeProductInput(
            product && typeof product === "object"
              ? (product as Record<string, unknown>)
              : {},
          ),
        )
      : rawProducts,
  };
}

function failureState(result: {
  ok: false;
  error: { message: string; fieldErrors?: Record<string, string[]> };
}): ProductActionState {
  return {
    status: "error",
    message: result.error.message,
    ...(result.error.fieldErrors
      ? { fieldErrors: result.error.fieldErrors }
      : {}),
  };
}

export async function createProductAction(
  _previous: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  await requireAdminPermission("catalog.write");
  const result = await new ProductWriteService().create(productInput(formData));
  if (!result.ok) return failureState(result);
  revalidatePath("/admin/products");
  revalidateTag("catalog", "max");
  redirect("/admin/products?created=1");
}

export async function createProductsAction(
  _previous: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  await requireAdminPermission("catalog.write");
  const result = await new ProductWriteService().createMany(
    productsInput(formData),
  );
  if (!result.ok) return failureState(result);
  revalidatePath("/admin/products");
  revalidateTag("catalog", "max");
  redirect(`/admin/products?created=${result.value.length}`);
}

export async function updateProductAction(
  id: string,
  _previous: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  await requireAdminPermission("catalog.write");
  const result = await new ProductWriteService().update(
    id,
    productInput(formData),
  );
  if (!result.ok) return failureState(result);
  revalidatePath("/admin/products");
  revalidateTag("catalog", "max");
  redirect("/admin/products?updated=1");
}

export async function activateProductAction(id: string) {
  await requireAdminPermission("catalog.write");
  const result = await new ProductWriteService().activate({ id });
  if (!result.ok) return failureState(result);
  revalidatePath("/admin/products");
  revalidateTag("catalog", "max");
  return { status: "success" as const, message: "Product activated." };
}

export async function draftProductAction(id: string) {
  await requireAdminPermission("catalog.write");
  const result = await new ProductWriteService().draft({ id });
  if (!result.ok) return failureState(result);
  revalidatePath("/admin/products");
  revalidateTag("catalog", "max");
  return { status: "success" as const, message: "Product moved to draft." };
}

export async function archiveProductAction(id: string) {
  await requireAdminPermission("catalog.write");
  const result = await new ProductWriteService().archive({ id });
  if (!result.ok) return failureState(result);
  revalidatePath("/admin/products");
  revalidateTag("catalog", "max");
  return { status: "success" as const, message: "Product archived." };
}
