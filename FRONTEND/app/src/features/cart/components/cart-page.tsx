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
import { useTranslations } from "next-intl";
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
  const t = useTranslations("Cart");
  return (
    <SkeletonGroup label={t("loading")} className="grid gap-4">
      <Skeleton className="h-28 w-full rounded-lg" />
      <Skeleton className="h-28 w-full rounded-lg" />
      <Skeleton className="h-52 w-full rounded-lg" />
    </SkeletonGroup>
  );
}

export function CartPage() {
  const t = useTranslations("Cart");
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
        title={t("error")}
        description={error}
        onRetry={refresh}
      />
    );
  }

  if (cart.lines.length === 0) {
    return (
      <EmptyState
        title={t("empty")}
        description={t("emptyDescription")}
        icon={<ShoppingBag aria-hidden="true" className="size-5" />}
        action={
          <Link href="/" className={cn(buttonVariants())}>
            {t("continueShopping")}
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
                {t("yourSelections")}
              </h2>
              <p className="mt-1 text-sm text-foreground-muted">
                {itemCount === 1 ? "1 item" : `${itemCount} items`} · {t("quantitiesSaved")}
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
                {t("retry")}
              </Button>
              <Button
                variant="ghost"
                size="small"
                className="text-danger"
                onClick={() => setClearOpen(true)}
              >
                {t("delete")}
              </Button>
            </div>
          </div>

          <div className="mt-5 grid gap-4">
            {error && (
              <InlineAlert
                tone="danger"
                title={t("error")}
                description={
                  <span>
                    {error}{" "}
                    <button
                      className="font-semibold underline"
                      onClick={refresh}
                    >
                      {t("retry")}
                    </button>
                  </span>
                }
              />
            )}
            {cart.hasCurrencyConflict && (
              <InlineAlert
                tone="danger"
                title={t("error")}
                description={t("quantitiesSaved")}
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
              title={t("error")}
              description={t("quantitiesSaved")}
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
            {t("checkout")}
          </Link>
          <p className="text-xs leading-5 text-foreground-muted">
            {t("quantitiesSaved")}
          </p>
          <Link
            href="/"
            className={cn(buttonVariants({ variant: "secondary" }), "w-full")}
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            {t("backToCatalog")}
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
            <DialogTitle>{t("remove")}</DialogTitle>
            <DialogDescription>
              {removeTarget
                ? `${removeTarget.productName} ${t("quantitiesSaved")}`
                : t("quantitiesSaved")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary">{t("cancel")}</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() => {
                if (removeTarget) removeItem(removeTarget.key);
                setRemoveTarget(null);
              }}
            >
              {t("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={clearOpen} onOpenChange={setClearOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("delete")}</DialogTitle>
            <DialogDescription>
              {t("quantitiesSaved")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary">{t("cancel")}</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() => {
                clear();
                setClearOpen(false);
              }}
            >
              {t("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
