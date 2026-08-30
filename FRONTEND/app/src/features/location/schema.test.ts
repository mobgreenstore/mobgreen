import { describe, expect, it } from "vitest";
import {
  coordinateSearchSchema,
  deliveryLocationSchema,
  postalSearchSchema,
} from "@/features/location/schema";

describe("delivery location validation", () => {
  it("normalizes postal code spacing and casing", () => {
    expect(postalSearchSchema.parse({ query: "  nw1   6xe " }).query).toBe(
      "NW1 6XE",
    );
  });

  it("rejects out-of-range coordinates", () => {
    expect(
      coordinateSearchSchema.safeParse({ latitude: 91, longitude: 0 }).success,
    ).toBe(false);
    expect(
      coordinateSearchSchema.safeParse({ latitude: 0, longitude: -181 })
        .success,
    ).toBe(false);
  });

  it("requires an exact Mapbox place identity", () => {
    const result = deliveryLocationSchema.safeParse({
      formattedAddress: "London, United Kingdom",
      postalCode: "NW1 6XE",
      locality: "London",
      region: "England",
      country: "United Kingdom",
      countryCode: "gb",
      latitude: 51.5,
      longitude: -0.1,
      mapboxPlaceId: "",
      source: "POSTAL_CODE",
      confirmedAt: new Date().toISOString(),
    });
    expect(result.success).toBe(false);
  });
});
