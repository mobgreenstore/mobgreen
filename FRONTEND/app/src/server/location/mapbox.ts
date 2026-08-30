import "server-only";

import type {
  DeliveryLocation,
  LocationCandidate,
} from "@/features/location/schema";
import { getMapboxServerToken } from "@/server/location/environment";
import { signLocationCandidate } from "@/server/location/verification";

interface MapboxFeature {
  id?: string;
  geometry?: { coordinates?: [number, number] };
  properties?: {
    mapbox_id?: string;
    full_address?: string;
    name?: string;
    name_preferred?: string;
    place_formatted?: string;
    context?: {
      postcode?: { name?: string };
      place?: { name?: string };
      locality?: { name?: string };
      region?: { name?: string };
      country?: { name?: string; country_code?: string };
    };
    coordinates?: { latitude?: number; longitude?: number };
  };
}

function candidate(
  feature: MapboxFeature,
  source: DeliveryLocation["source"],
  coordinateOverride?: { latitude: number; longitude: number },
): LocationCandidate | null {
  const properties = feature.properties ?? {};
  const context = properties.context ?? {};
  const longitude =
    coordinateOverride?.longitude ??
    properties.coordinates?.longitude ??
    feature.geometry?.coordinates?.[0];
  const latitude =
    coordinateOverride?.latitude ??
    properties.coordinates?.latitude ??
    feature.geometry?.coordinates?.[1];
  const mapboxPlaceId = properties.mapbox_id ?? feature.id;
  const country = context.country?.name ?? "";
  const countryCode = context.country?.country_code?.toUpperCase() ?? "";
  const formattedAddress =
    properties.full_address ??
    [properties.name_preferred ?? properties.name, properties.place_formatted]
      .filter(Boolean)
      .join(", ");
  if (
    !mapboxPlaceId ||
    !formattedAddress ||
    typeof latitude !== "number" ||
    typeof longitude !== "number" ||
    !country ||
    countryCode.length !== 2
  ) {
    return null;
  }
  const payload = {
    formattedAddress,
    postalCode: context.postcode?.name ?? "",
    locality: context.place?.name ?? context.locality?.name ?? "",
    region: context.region?.name ?? "",
    country,
    countryCode,
    latitude,
    longitude,
    mapboxPlaceId,
    source,
  };
  return { ...payload, verificationToken: signLocationCandidate(payload) };
}

async function mapboxRequest(parameters: URLSearchParams) {
  parameters.set("access_token", getMapboxServerToken());
  if (parameters.get("endpoint") === "forward") {
    parameters.set("limit", "5");
  }
  parameters.set("language", "en");
  parameters.set("permanent", "false");
  const response = await fetch(
    `https://api.mapbox.com/search/geocode/v6/${parameters.get("endpoint")}?${parameters.toString().replace(/(?:^|&)endpoint=[^&]*&?/, "")}`,
    { cache: "no-store", signal: AbortSignal.timeout(8_000) },
  );
  if (!response.ok) throw new Error("Mapbox request failed.");
  return (await response.json()) as { features?: MapboxFeature[] };
}

export async function searchPostalCode(query: string) {
  const parameters = new URLSearchParams({
    endpoint: "forward",
    q: query,
    types: "postcode,place,address",
    autocomplete: "true",
  });
  const data = await mapboxRequest(parameters);
  return (data.features ?? [])
    .map((feature) => candidate(feature, "POSTAL_CODE"))
    .filter((value): value is LocationCandidate => value !== null);
}

export async function reverseCoordinates(latitude: number, longitude: number) {
  const parameters = new URLSearchParams({
    endpoint: "reverse",
    latitude: String(latitude),
    longitude: String(longitude),
  });
  const data = await mapboxRequest(parameters);
  return (
    (data.features ?? [])
      .map((feature) =>
        candidate(feature, "CURRENT_LOCATION", { latitude, longitude }),
      )
      .find((value): value is LocationCandidate => value !== null) ?? null
  );
}
