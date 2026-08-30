import { z } from "zod";

export const locationSourceSchema = z.enum(["POSTAL_CODE", "CURRENT_LOCATION"]);

export const deliveryLocationSchema = z.object({
  formattedAddress: z.string().trim().min(3).max(500),
  postalCode: z.string().trim().max(32),
  locality: z.string().trim().max(160),
  region: z.string().trim().max(160),
  country: z.string().trim().min(2).max(160),
  countryCode: z
    .string()
    .trim()
    .length(2)
    .transform((value) => value.toUpperCase()),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  mapboxPlaceId: z.string().trim().min(1).max(255),
  source: locationSourceSchema,
  confirmedAt: z.iso.datetime(),
  verificationToken: z.string().min(40).max(4096),
});

export type DeliveryLocation = z.output<typeof deliveryLocationSchema>;

export const storedDeliveryLocationSchema = z.object({
  version: z.literal(1),
  location: deliveryLocationSchema,
});

export const postalSearchSchema = z.object({
  query: z
    .string()
    .trim()
    .min(2, "Enter at least 2 characters.")
    .max(32, "Postal or ZIP code is too long.")
    .transform((value) => value.replace(/\s+/g, " ").toUpperCase()),
});

export const coordinateSearchSchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
});

export const locationCandidateSchema = deliveryLocationSchema
  .omit({ confirmedAt: true, verificationToken: true })
  .extend({ verificationToken: z.string().min(40).max(4096) });

export type LocationCandidate = z.output<typeof locationCandidateSchema>;

export const confirmLocationSchema = z.object({
  verificationToken: z.string().min(40).max(4096),
});
