export const ADMIN_SESSION_COOKIE_NAME = "mob-greens-admin";
export const ADMIN_SESSION_TTL_SECONDS = 60 * 60 * 8;
export const LEGACY_ADMIN_SESSION_PATH = "/admin";

export function getAdminSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };
}
