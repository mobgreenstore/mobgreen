import { describe, expect, it } from "vitest";
import { adminBootstrapSchema, adminSignInSchema } from "@/server/auth/schemas";

describe("admin authentication write schemas", () => {
  it("normalizes a sign-in email", () => {
    const input = adminSignInSchema.parse({
      email: " ADMIN@MOBGREENS.COM ",
      password: "password",
    });
    expect(input.email).toBe("admin@mobgreens.com");
  });

  it("requires a long bootstrap password", () => {
    expect(
      adminBootstrapSchema.safeParse({
        email: "admin@mobgreens.com",
        password: "short",
        name: "Store administrator",
      }).success,
    ).toBe(false);
  });
});
