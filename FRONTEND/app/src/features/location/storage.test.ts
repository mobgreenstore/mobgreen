// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from "vitest";
import {
  clearDeliveryLocation,
  loadDeliveryLocation,
  saveDeliveryLocation,
} from "@/features/location/storage";

const location = {
  formattedAddress: "Yaoundé, Cameroon",
  postalCode: "00237",
  locality: "Yaoundé",
  region: "Centre",
  country: "Cameroon",
  countryCode: "CM",
  latitude: 3.848,
  longitude: 11.502,
  mapboxPlaceId: "mapbox.place.1",
  source: "POSTAL_CODE" as const,
  confirmedAt: "2026-08-15T12:00:00.000Z",
  verificationToken: "v".repeat(40),
};

describe("delivery location persistence", () => {
  beforeEach(() => localStorage.clear());

  it("stores and validates the versioned contract", () => {
    saveDeliveryLocation(location);
    expect(loadDeliveryLocation()).toEqual(location);
  });

  it("removes malformed storage safely", () => {
    localStorage.setItem("mob-greens-delivery-location", "{invalid");
    expect(loadDeliveryLocation()).toBeNull();
    expect(localStorage.length).toBe(0);
  });

  it("clears the current device location", () => {
    saveDeliveryLocation(location);
    clearDeliveryLocation();
    expect(loadDeliveryLocation()).toBeNull();
  });
});
