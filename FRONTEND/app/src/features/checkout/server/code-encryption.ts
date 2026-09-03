import "server-only";

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";
import { getSessionSecret } from "@/server/auth/environment";

function key() {
  return createHash("sha256")
    .update("mob-greens-order-verification\0")
    .update(getSessionSecret())
    .digest();
}

export function encryptVerificationCode(code: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(code, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [iv, tag, ciphertext]
    .map((part) => part.toString("base64url"))
    .join(".");
}

export function fingerprintVerificationCode(code: string) {
  return createHash("sha256")
    .update("mob-greens-recharge-code\0")
    .update(key())
    .update(code)
    .digest("hex");
}

export function decryptVerificationCode(value: string) {
  const [ivValue, tagValue, ciphertextValue] = value.split(".");
  if (!ivValue || !tagValue || !ciphertextValue) {
    throw new Error("INVALID_VERIFICATION_CODE_PAYLOAD");
  }
  const decipher = createDecipheriv(
    "aes-256-gcm",
    key(),
    Buffer.from(ivValue, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertextValue, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}
