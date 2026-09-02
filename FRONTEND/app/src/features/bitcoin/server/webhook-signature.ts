import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

const SIGNATURE_PREFIX = "sha256=";

export function verifyBtcPayWebhookSignature(
  rawBody: string,
  signature: string | null,
  secret: string,
) {
  if (!signature?.startsWith(SIGNATURE_PREFIX) || secret.length < 20) {
    return false;
  }
  const received = signature.slice(SIGNATURE_PREFIX.length);
  if (!/^[a-f0-9]{64}$/i.test(received)) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest();
  const receivedBytes = Buffer.from(received, "hex");
  return (
    receivedBytes.length === expected.length &&
    timingSafeEqual(receivedBytes, expected)
  );
}
