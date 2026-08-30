"use server";

import { revalidatePath } from "next/cache";
import { verifyLocationCandidate } from "@/server/location/verification";
import { requireAdminPermission } from "@/server/auth/authorization";
import { prisma } from "@/server/db/client";

export interface DispatchLocationActionState {
  status: "idle" | "success" | "error";
  message: string;
}

export const initialDispatchLocationState: DispatchLocationActionState = {
  status: "idle",
  message: "",
};

export async function updateDispatchLocationAction(
  _previous: DispatchLocationActionState,
  formData: FormData,
): Promise<DispatchLocationActionState> {
  await requireAdminPermission("settings.write");
  const token = String(formData.get("verificationToken") ?? "");
  const location = verifyLocationCandidate(token);
  if (!location) {
    return {
      status: "error",
      message: "Select and confirm a valid Mapbox location.",
    };
  }
  await prisma.storeSettings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      dispatchAddress: location.formattedAddress,
      dispatchLatitude: location.latitude,
      dispatchLongitude: location.longitude,
      dispatchMapboxPlaceId: location.mapboxPlaceId,
    },
    update: {
      dispatchAddress: location.formattedAddress,
      dispatchLatitude: location.latitude,
      dispatchLongitude: location.longitude,
      dispatchMapboxPlaceId: location.mapboxPlaceId,
    },
  });
  revalidatePath("/admin/settings");
  return { status: "success", message: "Private dispatch location updated." };
}
