export function slugifyCategoryName(name: string) {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120)
    .replace(/-+$/g, "");
}

export async function generateUniqueCategorySlug(
  name: string,
  isAvailable: (slug: string) => Promise<boolean>,
) {
  const base = slugifyCategoryName(name) || "category";
  for (let suffix = 1; suffix <= 10_000; suffix += 1) {
    const ending = suffix === 1 ? "" : `-${suffix}`;
    const candidate = `${base.slice(0, 140 - ending.length)}${ending}`;
    if (await isAvailable(candidate)) return candidate;
  }
  throw new Error("CATEGORY_SLUG_EXHAUSTED");
}
