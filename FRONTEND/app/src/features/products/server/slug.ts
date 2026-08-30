export function slugifyProductName(name: string) {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 160)
    .replace(/-+$/g, "");
}

export async function generateUniqueProductSlug(
  name: string,
  isAvailable: (slug: string) => Promise<boolean>,
) {
  const base = slugifyProductName(name) || "product";
  for (let suffix = 1; suffix <= 10_000; suffix += 1) {
    const ending = suffix === 1 ? "" : `-${suffix}`;
    const candidate = `${base.slice(0, 180 - ending.length)}${ending}`;
    if (await isAvailable(candidate)) return candidate;
  }
  throw new Error("PRODUCT_SLUG_EXHAUSTED");
}
