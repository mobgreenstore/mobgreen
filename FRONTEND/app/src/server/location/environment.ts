import "server-only";

import { z } from "zod";

const tokenSchema = z.string().trim().min(1);

export function getMapboxServerToken() {
  const token =
    process.env.MAPBOX_ACCESS_TOKEN ||
    process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  const result = tokenSchema.safeParse(token);
  if (!result.success) {
    throw new Error("Mapbox is not configured.");
  }
  return result.data;
}
