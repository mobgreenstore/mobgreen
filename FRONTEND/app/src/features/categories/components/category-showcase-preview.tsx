import { CategoryShowcaseVisual } from "@/components/commerce/category-showcase-visual";
import type { CategoryDisplayTone } from "@/config/category-presentation";
import type { ManagedImage } from "@/types/media";

export function CategoryShowcasePreview({
  name,
  description,
  image,
  displayTone,
}: {
  name: string;
  description: string;
  image: ManagedImage | null;
  displayTone: CategoryDisplayTone;
}) {
  const title = name.trim() || "Category name";
  const detail = description.trim() || null;

  return (
    <section aria-labelledby="category-preview-heading" className="grid gap-3">
      <div>
        <h2 id="category-preview-heading" className="text-base font-semibold">
          Storefront preview
        </h2>
        <p className="mt-1 text-sm leading-6 text-foreground-muted">
          This preview uses the current form values and uploaded image.
        </p>
      </div>
      <CategoryShowcaseVisual
        name={title}
        description={detail}
        image={image}
        displayTone={displayTone}
        sizes="(max-width: 640px) calc(80vw - 3.2rem), 22.5rem"
        headingAs="h3"
        className="w-full max-w-[22.5rem]"
      />
    </section>
  );
}
