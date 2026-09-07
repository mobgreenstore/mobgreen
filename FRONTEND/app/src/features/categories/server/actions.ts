"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminPermission } from "@/server/auth/authorization";
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
  const result = await new CategoryWriteService().create(formInput(formData));
  if (!result.ok) return failureState(result);
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

export async function deleteCategoryAction(
  id: string,
): Promise<CategoryActionState> {
  await requireAdminPermission("catalog.write");
  const result = await new CategoryWriteService().delete({ id });
  if (!result.ok) return failureState(result);
  revalidatePath("/admin/categories");
  revalidateTag("catalog", "max");
  return { status: "success", message: "Category deleted." };
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
