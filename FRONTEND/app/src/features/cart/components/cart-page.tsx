"use client";

import Link from "next/link";
import {
  ArrowLeft,
  LoaderCircle,
  PackageX,
  RefreshCw,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { CartItem } from "@/components/commerce/cart-item";
import { Money } from "@/components/commerce/money";
import { OrderSummary } from "@/components/commerce/order-summary";
import { WeightDisplay } from "@/components/commerce/weight-display";
import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  EmptyState,
  ErrorState,
  IconButton,
  InlineAlert,
  Skeleton,
  SkeletonGroup,
  buttonVariants,
} from "@/components/ui";
import { useCart } from "@/features/cart/cart-provider";
import type { ValidatedCartLine } from "@/features/cart/types";
import { cn } from "@/lib/utils";

function CartLoading() {
  return (
    <SkeletonGroup label="Loading your card" className="grid gap-4">
      <Skeleton className="h-28 w-full rounded-lg" />
      <Skeleton className="h-28 w-full rounded-lg" />
      <Skeleton className="h-52 w-full rounded-lg" />
    </SkeletonGroup>
  );
}

export function CartPage() {
  const {
    cart,
    status,
    error,
    itemCount,
    updateQuantity,
    removeItem,
    clear,
    refresh,
  } = useCart();
  const [removeTarget, setRemoveTarget] = useState<ValidatedCartLine | null>(
    null,
  );
  const [clearOpen, setClearOpen] = useState(false);

  if (status === "loading") return <CartLoading />;

  if (status === "error" && cart.lines.length === 0) {
    return (
      <ErrorState
        title="Your card could not be confirmed"
        description={error}
        onRetry={refresh}
      />
    );
  }

  if (cart.lines.length === 0) {
    return (
      <EmptyState
        title="Your card is empty"
        description="Choose a real product and weight option from the catalog."
        icon={<ShoppingBag aria-hidden="true" className="size-5" />}
        action={
          <Link href="/" className={cn(buttonVariants())}>
            Browse goods
          </Link>
        }
      />
    );
  }

  const busy = status === "refreshing";
  const availableLines = cart.lines.filter(
    (line) => line.available && line.option,
  );
  const unavailableLines = cart.lines.filter((line) => !line.available);

  return (
    <>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:gap-12">
        <section aria-labelledby="cart-items-heading" className="min-w-0">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-4">
            <div>
              <h2
                id="cart-items-heading"
                className="text-lg font-semibold tracking-[-0.025em]"
              >
                Card items
              </h2>
              <p className="mt-1 text-sm text-foreground-muted">
                {itemCount === 1 ? "1 item" : `${itemCount} items`} · prices
                confirmed by the store
              </p>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="small"
                disabled={busy}
                onClick={refresh}
              >
                {busy ? (
                  <LoaderCircle
                    aria-hidden="true"
                    className="size-4 animate-spin motion-reduce:animate-none"
                  />
                ) : (
                  <RefreshCw aria-hidden="true" className="size-4" />
                )}
                Refresh
              </Button>
              <Button
                variant="ghost"
                size="small"
                className="text-danger"
                onClick={() => setClearOpen(true)}
              >
                Clear
              </Button>
            </div>
          </div>

          <div className="mt-5 grid gap-4">
            {error && (
              <InlineAlert
                tone="danger"
                title="Prices are not currently confirmed"
                description={
                  <span>
                    {error}{" "}
                    <button
                      className="font-semibold underline"
                      onClick={refresh}
                    >
                      Try again
                    </button>
                  </span>
                }
              />
            )}
            {cart.hasCurrencyConflict && (
              <InlineAlert
                tone="danger"
                title="This card contains multiple currencies"
                description="Remove items until every remaining selection uses only GBP, EUR, or USD. Currency conversion is never automatic."
              />
            )}
            {availableLines.map((line) => {
              const option = line.option;
              if (!option) return null;
              return (
                <div key={line.key}>
                  <CartItem
                    item={{
                      id: line.key,
                      productName: line.productName,
                      image: line.image,
                      option,
                      quantity: line.quantity,
                    }}
                    disabled={busy}
                    onQuantityChange={(quantity) =>
                      updateQuantity(line.key, quantity)
                    }
                    onRemove={() => setRemoveTarget(line)}
                  />
                  {line.offer && (
                    <InlineAlert
                      className="mt-3"
                      tone="success"
                      title={`% special offer applied`}
                      description={`This card item contains units per offer bundle. The offer is rechecked at checkout.`}
                    />
                  )}
                  {line.issues.length > 0 && (
                    <InlineAlert
                      className="mt-3"
                      tone="info"
                      title="This selection changed"
                      description={line.issues
                        .map((issue) => issue.message)
                        .join(" ")}
                    />
                  )}
                </div>
              );
            })}

            {unavailableLines.map((line) => (
              <article
                key={line.key}
                className="grid grid-cols-[auto_1fr_auto] gap-3 rounded-lg border border-danger/25 bg-danger-subtle/35 p-4"
              >
                <div className="grid size-11 place-items-center rounded-md bg-danger-subtle text-danger">
                  <PackageX aria-hidden="true" className="size-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold">{line.productName}</h3>
                  {line.option && (
                    <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-foreground-muted">
                      <WeightDisplay
                        value={line.option.weightValue}
                        unit={line.option.weightUnit}
                      />
                      <Money
                        amountMinor={line.option.priceMinor}
                        currency={line.option.currency}
                      />
                    </p>
                  )}
                  <p className="mt-2 text-sm leading-6 text-danger">
                    {line.issues.map((issue) => issue.message).join(" ")}
                  </p>
                </div>
                <IconButton
                  aria-label={`Remove ${line.productName}`}
                  size="small"
                  onClick={() => setRemoveTarget(line)}
                  className="text-danger"
                >
                  <Trash2 aria-hidden="true" className="size-4" />
                </IconButton>
              </article>
            ))}
          </div>
        </section>

        <aside className="grid gap-4 lg:sticky lg:top-24">
          {cart.currency !== null && cart.subtotalMinor !== null ? (
            <OrderSummary
              currency={cart.currency}
              subtotalMinor={cart.subtotalMinor}
              totalMinor={cart.subtotalMinor}
            />
          ) : (
            <InlineAlert
              title="Total unavailable"
              description="A total appears after every available item uses the same currency."
            />
          )}
          <Link
            href="/checkout"
            aria-disabled={!cart.checkoutEligible}
            className={cn(
              buttonVariants({ size: "large" }),
              "w-full",
              !cart.checkoutEligible && "pointer-events-none opacity-45",
            )}
          >
            Continue to checkout
          </Link>
          <p className="text-xs leading-5 text-foreground-muted">
            Every item is confirmed again when the order is placed. The entire
            order must use one currency.
          </p>
          <Link
            href="/"
            className={cn(buttonVariants({ variant: "secondary" }), "w-full")}
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            Continue shopping
          </Link>
        </aside>
      </div>

      <Dialog
        open={removeTarget !== null}
        onOpenChange={(open) => {
          if (!open) setRemoveTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove this item?</DialogTitle>
            <DialogDescription>
              {removeTarget
                ? `${removeTarget.productName} will be removed from your card.`
                : "This item will be removed from your card."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary">Keep item</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() => {
                if (removeTarget) removeItem(removeTarget.key);
                setRemoveTarget(null);
              }}
            >
              Remove item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={clearOpen} onOpenChange={setClearOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear your card?</DialogTitle>
            <DialogDescription>
              Every saved selection will be removed from this browser.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary">Keep card</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() => {
                clear();
                setClearOpen(false);
              }}
            >
              Clear card
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
