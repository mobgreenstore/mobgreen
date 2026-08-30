import { describe, expect, it } from "vitest";
import { getSafeAdminRedirect } from "@/server/auth/safe-redirect";

describe("safe admin redirects", () => {
  it("accepts only local admin destinations", () => {
    expect(getSafeAdminRedirect("/admin/orders?page=2")).toBe(
      "/admin/orders?page=2",
    );
  });

  it.each([
    "https://attacker.example/admin",
    "//attacker.example/admin",
    "/store",
    "javascript:alert(1)",
  ])("rejects an unsafe destination: %s", (destination) => {
    expect(getSafeAdminRedirect(destination)).toBe("/admin");
  });
});
