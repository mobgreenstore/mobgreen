"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminPermission } from "@/server/auth/authorization";
import { categoryOfferPolicySchema } from "@/features/special-offers/schema";
import type { CategoryActionState } from "@/features/categories/server/action-state";
import { CategoryWriteService } from "@/server/services/category-write-service";

function imageInput(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value) return null;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
}

function formInput(formData: FormData) {
  return {
    name: formData.get("name"),
    description: formData.get("description"),
    isActive: formData.get("isActive") === "on",
    displayTone: formData.get("displayTone"),
    image: imageInput(formData.get("image")),
  };
}

function offerPolicyInput(formData: FormData) {
  if (formData.get("offerPolicyPresent") !== "true") return null;
  return categoryOfferPolicySchema.safeParse({
    enabled: formData.get("offerEnabled") === "on",
    minimumWeightGrams: Number(formData.get("offerMinimumWeightGrams")),
    maximumWeightGrams: Number(formData.get("offerMaximumWeightGrams")),
    minimumDiscountBps: Number(formData.get("offerMinimumDiscountBps")),
    maximumDiscountBps: Number(formData.get("offerMaximumDiscountBps")),
    minimumMarginBps: Number(formData.get("offerMinimumMarginBps")),
    durationMinutes: Number(formData.get("offerDurationMinutes")),
    maxOffersPerPriceOption: Number(
      formData.get("offerMaxOffersPerPriceOption"),
    ),
  });
}

function failureState(result: {
  ok: false;
  error: { message: string; fieldErrors?: Record<string, string[]> };
}): CategoryActionState {
  return {
    status: "error",
    message: result.error.message,
    ...(result.error.fieldErrors
      ? { fieldErrors: result.error.fieldErrors }
      : {}),
  };
}

export async function createCategoryAction(
  _previous: CategoryActionState,
  formData: FormData,
): Promise<CategoryActionState> {
  await requireAdminPermission("catalog.write");
  const policy = offerPolicyInput(formData);
  if (policy && !policy.success) {
    return {
      status: "error",
      message: "Review the special-offer policy.",
      fieldErrors: policy.error.flatten().fieldErrors,
    };
  }
  const result = await new CategoryWriteService().create(formInput(formData));
  if (!result.ok) return failureState(result);
  if (policy?.success) {
    await new (
      await import("@/features/special-offers/server/campaign-service")
    ).SpecialOfferCampaignService().savePolicy({
      categoryId: result.value.id,
      policy: policy.data,
    });
  }
  revalidatePath("/admin/categories");
  revalidateTag("catalog", "max");
  redirect("/admin/categories?created=1");
}

export async function updateCategoryAction(
  id: string,
  _previous: CategoryActionState,
  formData: FormData,
): Promise<CategoryActionState> {
  await requireAdminPermission("catalog.write");
  const result = await new CategoryWriteService().update(
    id,
    formInput(formData),
  );
  if (!result.ok) return failureState(result);
  revalidatePath("/admin/categories");
  revalidateTag("catalog", "max");
  redirect("/admin/categories?updated=1");
}

export async function archiveCategoryAction(
  id: string,
): Promise<CategoryActionState> {
  await requireAdminPermission("catalog.write");
  const result = await new CategoryWriteService().archive({ id });
  if (!result.ok) return failureState(result);
  revalidatePath("/admin/categories");
  revalidateTag("catalog", "max");
  return { status: "success", message: "Category archived." };
}

export async function activateCategoryAction(
  id: string,
): Promise<CategoryActionState> {
  await requireAdminPermission("catalog.write");
  const result = await new CategoryWriteService().activate({ id });
  if (!result.ok) return failureState(result);
  revalidatePath("/admin/categories");
  revalidateTag("catalog", "max");
  return { status: "success", message: "Category activated." };
}

export async function reorderCategoriesAction(
  categories: readonly { id: string; position: number }[],
): Promise<CategoryActionState> {
  await requireAdminPermission("catalog.write");
  const result = await new CategoryWriteService().reorder({ categories });
  if (!result.ok) return failureState(result);
  revalidatePath("/admin/categories");
  revalidateTag("catalog", "max");
  return { status: "success", message: "Category order updated." };
}
