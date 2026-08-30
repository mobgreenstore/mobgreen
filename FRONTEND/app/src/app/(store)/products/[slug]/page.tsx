import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { ImageGallery } from "@/components/commerce/image-gallery";
import { StoreHeader } from "@/components/shared/store-header";
import { Badge } from "@/components/ui";
import { ProductOptionPanel } from "@/features/catalog/components/product-option-panel";
import { catalogHref } from "@/features/catalog/params";
import { getPublicProductBySlug } from "@/features/catalog/server/queries";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const product = await getPublicProductBySlug((await params).slug);
  if (!product) {
    return {
      title: "Product not found",
      robots: { index: false, follow: false },
    };
  }
  const image = product.images[0];
  return {
    title: product.name,
    description: product.shortDescription,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      title: product.name,
      description: product.shortDescription,
      type: "website",
      ...(image
        ? {
            images: [
              {
                url: image.url,
                width: image.width,
                height: image.height,
                alt: image.altText,
              },
            ],
          }
        : {}),
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await getPublicProductBySlug((await params).slug);
  if (!product) notFound();

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description ?? product.shortDescription,
    category: product.categoryName,
    image: product.images.map((image) => image.url),
    offers: product.priceOptions.map((option) => ({
      "@type": "Offer",
      priceCurrency: option.currency,
      price: (option.priceMinor / 100).toFixed(2),
      availability: "https://schema.org/InStock",
      url: `/products/${product.slug}`,
    })),
  };

  return (
    <div className="min-h-dvh bg-background">
      <StoreHeader />
      <main className="mx-auto max-w-[var(--content-max)] px-4 py-6 sm:px-6 sm:py-10 lg:px-8 lg:py-14">
        <Link
          href={catalogHref({ category: product.categorySlug })}
          className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-foreground-muted hover:text-foreground"
        >
          <ChevronLeft aria-hidden="true" className="size-4" />
          Back to {product.categoryName}
        </Link>

        <div className="mt-5 grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(20rem,0.95fr)] lg:gap-12">
          <ImageGallery
            images={product.images}
            label={`${product.name} images`}
          />

          <div className="min-w-0">
            <Badge>{product.categoryName}</Badge>
            <h1 className="heading-display mt-4 text-balance">
              {product.name}
            </h1>
            <p className="mt-4 text-base leading-7 text-foreground-muted sm:text-lg">
              {product.shortDescription}
            </p>

            <div className="mt-7">
              <ProductOptionPanel
                productId={product.id}
                options={product.priceOptions}
              />
            </div>

            {product.description && (
              <section
                aria-labelledby="product-description"
                className="mt-8 border-t border-border pt-7"
              >
                <h2
                  id="product-description"
                  className="text-base font-semibold tracking-[-0.02em]"
                >
                  Product details
                </h2>
                <p className="mt-3 text-sm leading-7 whitespace-pre-line text-foreground-muted">
                  {product.description}
                </p>
              </section>
            )}
          </div>
        </div>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(productJsonLd).replace(/</g, "\\u003c"),
          }}
        />
      </main>
    </div>
  );
}
