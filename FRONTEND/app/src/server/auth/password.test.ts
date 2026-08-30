import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/server/auth/password";

describe("admin password hashing", () => {
  it("creates and verifies an Argon2id password hash", async () => {
    const passwordHash = await hashPassword("a-realistic-long-password");
    expect(passwordHash).toMatch(/^\$argon2id\$/);
    await expect(
      verifyPassword("a-realistic-long-password", passwordHash),
    ).resolves.toBe(true);
    await expect(
      verifyPassword("incorrect-password", passwordHash),
    ).resolves.toBe(false);
  });
});
