const configuredLogoUrl = process.env.NEXT_PUBLIC_BRAND_LOGO_URL?.trim();

/** Public Cloudinary logo when configured, with a local resilient fallback. */
export const brandLogoSrc = configuredLogoUrl || "/images/mobgreen.png";

export function brandLogoUrlForEmail(storefrontUrl: string) {
  if (configuredLogoUrl) return configuredLogoUrl;
  return storefrontUrl.replace(/\/$/, "") + "/images/mobgreen.png";
}
