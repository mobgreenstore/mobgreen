import { describe, expect, it } from "vitest";
import {
  ADMIN_SESSION_COOKIE_NAME,
  ADMIN_SESSION_TTL_SECONDS,
  getAdminSessionCookieOptions,
  LEGACY_ADMIN_SESSION_PATH,
} from "@/config/admin-session";

describe("admin session cookie scope", () => {
  it("covers both admin pages and protected admin APIs", () => {
    expect(ADMIN_SESSION_COOKIE_NAME).toBe("mob-greens-admin");
    expect(ADMIN_SESSION_TTL_SECONDS).toBe(28_800);
    expect(getAdminSessionCookieOptions()).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
    expect(LEGACY_ADMIN_SESSION_PATH).toBe("/admin");
  });
});
