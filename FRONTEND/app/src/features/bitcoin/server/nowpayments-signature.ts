import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

function sortObject(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortObject);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, entry]) => [key, sortObject(entry)]),
    );
  }
  return value;
}

export function verifyNowPaymentsWebhookSignature(
  rawBody: string,
  signature: string | null,
  secret: string,
) {
  if (!signature || secret.length < 20) return false;
  if (!/^[a-f0-9]{128}$/i.test(signature)) return false;
  let canonical: string;
  try {
    canonical = JSON.stringify(sortObject(JSON.parse(rawBody)));
  } catch {
    return false;
  }
  const expected = createHmac("sha512", secret).update(canonical).digest();
  const received = Buffer.from(signature, "hex");
  return (
    received.length === expected.length && timingSafeEqual(received, expected)
  );
}
