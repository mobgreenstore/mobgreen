const DEFAULT_ADMIN_DESTINATION = "/admin";

export function getSafeAdminRedirect(value: unknown) {
  if (typeof value !== "string") return DEFAULT_ADMIN_DESTINATION;
  if (!value.startsWith("/admin") || value.startsWith("//")) {
    return DEFAULT_ADMIN_DESTINATION;
  }
  try {
    const parsed = new URL(value, "http://mob-greens.local");
    if (parsed.origin !== "http://mob-greens.local") {
      return DEFAULT_ADMIN_DESTINATION;
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return DEFAULT_ADMIN_DESTINATION;
  }
}
