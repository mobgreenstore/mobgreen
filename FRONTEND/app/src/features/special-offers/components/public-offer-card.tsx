"use client";

import Link from "next/link";
import { BadgePercent, LoaderCircle, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import { Money } from "@/components/commerce/money";
import { ResponsiveImage } from "@/components/commerce/responsive-image";
import { Badge, Button } from "@/components/ui";
import { useCart } from "@/features/cart/cart-provider";
import type { PublicSpecialOfferViewModel } from "@/features/special-offers/public-types";

function remaining(endsAt: string, now: number) {
  const milliseconds = new Date(endsAt).getTime() - now;
  if (milliseconds <= 0) return null;
  const minutes = Math.ceil(milliseconds / 60_000);
  const hours = Math.floor(minutes / 60);
  return hours ? `${hours}h ${minutes % 60}m` : `${minutes}m`;
}

export function PublicOfferCard({
  offer,
  priority = false,
}: {
  offer: PublicSpecialOfferViewModel;
  priority?: boolean;
}) {
  const { addItem } = useCart();
  const [pending, setPending] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  const timeLeft = remaining(offer.endsAt, now);
  const discount = offer.discountBps / 100;
  return (
    <article className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
      <Link href={`/products/${offer.productSlug}`} className="block">
        <ResponsiveImage
          image={offer.image}
          aspect="square"
          priority={priority}
          sizes="(max-width: 639px) 44vw, (max-width: 1023px) 30vw, 22vw"
          className="rounded-none border-0"
          imageClassName="object-cover"
        />
      </Link>
      <div className="grid gap-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Badge tone="success">
              <BadgePercent aria-hidden="true" className="mr-1 size-3.5" />
              {Number.isInteger(discount) ? discount : discount.toFixed(1)}% off
            </Badge>
            <Link
              href={`/products/${offer.productSlug}`}
              className="mt-2 block leading-tight font-semibold hover:underline"
            >
              {offer.productName}
            </Link>
          </div>
          <p
            className="shrink-0 text-xs font-semibold text-foreground-muted"
            aria-live="polite"
          >
            {timeLeft ? `${timeLeft} left` : "Ended"}
          </p>
        </div>
        <div>
          <p className="text-sm text-foreground-muted">
            {offer.totalWeightGrams}g · {offer.bundleQuantity} units
          </p>
          <div className="mt-1 flex flex-wrap items-baseline gap-2">
            <Money
              amountMinor={offer.offerTotalMinor}
              currency={offer.currency}
              className="text-xl font-bold"
            />
            <Money
              amountMinor={offer.originalTotalMinor}
              currency={offer.currency}
              className="text-sm text-foreground-muted line-through"
            />
          </div>
        </div>
        <Button
          className="w-full"
          disabled={pending || !timeLeft}
          onClick={async () => {
            setPending(true);
            try {
              await addItem(
                offer.productId,
                offer.priceOptionId,
                offer.publicId,
              );
            } finally {
              setPending(false);
            }
          }}
        >
          {pending ? (
            <LoaderCircle
              aria-hidden="true"
              className="size-4 animate-spin motion-reduce:animate-none"
            />
          ) : (
            <ShoppingBag aria-hidden="true" className="size-4" />
          )}
          {timeLeft ? "Add offer to cart" : "Offer ended"}
        </Button>
      </div>
    </article>
  );
}
