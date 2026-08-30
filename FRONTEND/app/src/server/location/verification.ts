import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { deliveryLocationSchema } from "@/features/location/schema";
import { getSessionSecret } from "@/server/auth/environment";

type VerifiedPayload = Omit<
  import("@/features/location/schema").DeliveryLocation,
  "confirmedAt" | "verificationToken"
>;

function signature(value: string) {
  return createHmac("sha256", getSessionSecret())
    .update(value)
    .digest("base64url");
}

export function signLocationCandidate(payload: VerifiedPayload) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${signature(encoded)}`;
}

export function verifyLocationCandidate(token: string) {
  const [encoded, provided] = token.split(".");
  if (!encoded || !provided) return null;
  const expected = signature(encoded);
  const left = Buffer.from(expected);
  const right = Buffer.from(provided);
  if (left.length !== right.length || !timingSafeEqual(left, right))
    return null;
  try {
    return deliveryLocationSchema
      .omit({ confirmedAt: true, verificationToken: true })
      .parse(JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")));
  } catch {
    return null;
  }
}
