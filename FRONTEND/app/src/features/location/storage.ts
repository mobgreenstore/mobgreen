"use client";

import {
  storedDeliveryLocationSchema,
  type DeliveryLocation,
} from "@/features/location/schema";

const STORAGE_KEY = "mob-greens-delivery-location";

export function loadDeliveryLocation(): DeliveryLocation | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (!value) return null;
    const parsed = storedDeliveryLocationSchema.safeParse(JSON.parse(value));
    if (!parsed.success) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed.data.location;
  } catch {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    return null;
  }
}

export function saveDeliveryLocation(location: DeliveryLocation) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, location }));
}

export function clearDeliveryLocation() {
  localStorage.removeItem(STORAGE_KEY);
}
