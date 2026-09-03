import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/server/auth/environment", () => ({
  getSessionSecret: () =>
    "a-secure-test-secret-that-is-over-thirty-two-characters",
}));

import {
  decryptVerificationCode,
  encryptVerificationCode,
  fingerprintVerificationCode,
} from "@/features/checkout/server/code-encryption";

describe("verification-code encryption", () => {
  beforeEach(() => vi.clearAllMocks());

  it("stores an authenticated encrypted value, not the raw code", () => {
    const encrypted = encryptVerificationCode("1234567890123456");
    expect(encrypted).not.toContain("1234567890123456");
    expect(decryptVerificationCode(encrypted)).toBe("1234567890123456");
  });

  it("rejects a modified encrypted value", () => {
    const encrypted = encryptVerificationCode("1234567890123456");
    expect(() => decryptVerificationCode(encrypted + "x")).toThrow();
  });

  it("creates deterministic non-reversible fingerprints for duplicate control", () => {
    const first = fingerprintVerificationCode("1234567890123456");
    const second = fingerprintVerificationCode("1234567890123456");
    expect(first).toBe(second);
    expect(first).toMatch(/^[a-f0-9]{64}$/);
    expect(first).not.toContain("1234567890123456");
  });
});
