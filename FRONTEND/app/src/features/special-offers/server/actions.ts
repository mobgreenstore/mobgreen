"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { majorToMinor } from "@/features/products/server/pricing";
import { categoryOfferPolicySchema } from "@/features/special-offers/schema";
import { SpecialOfferCampaignService } from "@/features/special-offers/server/campaign-service";
import type { SpecialOfferActionState } from "@/features/special-offers/server/action-state";
import { requireAdminPermission } from "@/server/auth/authorization";

function numberValue(formData: FormData, name: string) {
  return Number(formData.get(name));
}

function policyInput(formData: FormData) {
  return {
    enabled: formData.get("enabled") === "on",
    minimumWeightGrams: numberValue(formData, "minimumWeightGrams"),
    maximumWeightGrams: numberValue(formData, "maximumWeightGrams"),
    minimumDiscountBps: numberValue(formData, "minimumDiscountBps"),
    maximumDiscountBps: numberValue(formData, "maximumDiscountBps"),
    minimumMarginBps: numberValue(formData, "minimumMarginBps"),
    durationMinutes: numberValue(formData, "durationMinutes"),
    maxOffersPerPriceOption: numberValue(formData, "maxOffersPerPriceOption"),
  };
}

function serializePreview(
  generationKey: string,
  result: Awaited<ReturnType<SpecialOfferCampaignService["preview"]>>,
) {
  return {
    generationKey,
    offers: result.offers.map((offer) => ({
      ...offer,
      originalTotalMinor: offer.originalTotalMinor.toString(),
      discountMinor: offer.discountMinor.toString(),
      offerTotalMinor: offer.offerTotalMinor.toString(),
      startsAt: offer.startsAt.toISOString(),
      endsAt: offer.endsAt.toISOString(),
    })),
    exclusions: result.exclusions,
  };
}

function errorState(error: unknown): SpecialOfferActionState {
  return {
    status: "error",
    message: error instanceof Error ? error.message : "The operation failed.",
  };
}

function invalidate(categoryId: string) {
  revalidatePath(`/admin/categories/${categoryId}/edit`);
  revalidatePath("/");
  revalidateTag("catalog", "max");
  revalidateTag("special-offers", "max");
}

export async function saveOfferPolicyAction(
  categoryId: string,
  _previous: SpecialOfferActionState,
  formData: FormData,
): Promise<SpecialOfferActionState> {
  await requireAdminPermission("catalog.write");
  const parsed = categoryOfferPolicySchema.safeParse(policyInput(formData));
  if (!parsed.success) {
    return {
      status: "error",
      message: "Review the offer policy.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }
  try {
    await new SpecialOfferCampaignService().savePolicy({
      categoryId,
      policy: parsed.data,
    });
    invalidate(categoryId);
    return { status: "success", message: "Offer policy saved." };
  } catch (error) {
    return errorState(error);
  }
}

export async function savePriceOptionCostAction(
  categoryId: string,
  priceOptionId: string,
  _previous: SpecialOfferActionState,
  formData: FormData,
): Promise<SpecialOfferActionState> {
  await requireAdminPermission("catalog.write");
  try {
    const raw = String(formData.get("costMajor") ?? "").trim();
    await new SpecialOfferCampaignService().updateCost({
      priceOptionId,
      costMinor: raw ? majorToMinor(raw) : null,
    });
    invalidate(categoryId);
    return { status: "success", message: "Cost price saved." };
  } catch (error) {
    return errorState(error);
  }
}

export async function previewCampaignAction(
  categoryId: string,
): Promise<SpecialOfferActionState> {
  await requireAdminPermission("catalog.write");
  try {
    const generationKey = crypto.randomUUID();
    const result = await new SpecialOfferCampaignService().preview({
      categoryId,
      generationKey,
    });
    return {
      status: "success",
      message: result.offers.length
        ? `${result.offers.length} safe offers generated for preview.`
        : "No safe offers can be generated yet.",
      preview: serializePreview(generationKey, result),
    };
  } catch (error) {
    return errorState(error);
  }
}

export async function saveCampaignDraftAction(
  categoryId: string,
  generationKey: string,
): Promise<SpecialOfferActionState> {
  await requireAdminPermission("catalog.write");
  try {
    const result = await new SpecialOfferCampaignService().persistDraft({
      categoryId,
      generationKey,
    });
    invalidate(categoryId);
    return {
      status: "success",
      message: `${result.offers.length} offers saved as a draft campaign.`,
    };
  } catch (error) {
    return errorState(error);
  }
}

export async function activateCampaignAction(
  categoryId: string,
  generationKey: string,
): Promise<SpecialOfferActionState> {
  await requireAdminPermission("catalog.write");
  try {
    const count = await new SpecialOfferCampaignService().activate({
      categoryId,
      generationKey,
    });
    invalidate(categoryId);
    return { status: "success", message: `${count} offers activated.` };
  } catch (error) {
    return errorState(error);
  }
}

export async function cancelCampaignAction(
  categoryId: string,
  generationKey: string,
): Promise<SpecialOfferActionState> {
  await requireAdminPermission("catalog.write");
  try {
    const count = await new SpecialOfferCampaignService().cancel({
      categoryId,
      generationKey,
    });
    invalidate(categoryId);
    return { status: "success", message: `${count} offers cancelled.` };
  } catch (error) {
    return errorState(error);
  }
}

export async function regenerateCampaignAction(
  categoryId: string,
  generationKey: string,
): Promise<SpecialOfferActionState> {
  await requireAdminPermission("catalog.write");
  try {
    const result = await new SpecialOfferCampaignService().regenerate({
      categoryId,
      generationKey,
    });
    invalidate(categoryId);
    return {
      status: "success",
      message: `${result.offers.length} updated offers saved as a new draft.`,
    };
  } catch (error) {
    return errorState(error);
  }
}
