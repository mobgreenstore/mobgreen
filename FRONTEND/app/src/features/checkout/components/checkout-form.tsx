"use client";

import Link from "next/link";
import { ArrowRight, ExternalLink, LoaderCircle, Truck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { OrderSummary } from "@/components/commerce/order-summary";
import { RECHARGE_PARTNERS } from "@/config/recharge";
import {
  Button,
  Card,
  FieldDescription,
  FieldError,
  FormField,
  InlineAlert,
  Label,
  RadioGroup,
  RadioOption,
  TextField,
  buttonVariants,
} from "@/components/ui";
import { useCart } from "@/features/cart/cart-provider";
import { StoreLocationControl } from "@/features/location/components/store-location-control";
import type { DeliveryLocation } from "@/features/location/schema";
import { loadDeliveryLocation } from "@/features/location/storage";
import { PaymentMethodSelector } from "@/features/payments/components/payment-method-selector";
import type { PaymentMethodId } from "@/features/payments/payment-method";
import { cn } from "@/lib/utils";

type FieldErrors = Record<string, string[] | undefined>;

export function CheckoutForm({
  bitcoinCheckoutAvailable,
}: {
  bitcoinCheckoutAvailable: boolean;
}) {
  const router = useRouter();
  const { storedLines, cart, status, refresh } = useCart();
  const idempotencyKey = useRef(crypto.randomUUID());
  const [fulfillmentType, setFulfillmentType] = useState<"PICKUP" | "DELIVERY">(
    "PICKUP",
  );
  const [deliveryLocation, setDeliveryLocation] =
    useState<DeliveryLocation | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>(
    "RECHARGE_FROM_STORE",
  );
  const [rechargeProvider, setRechargeProvider] = useState<string>("");
  const [pending, setPending] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(
      () => setDeliveryLocation(loadDeliveryLocation()),
      0,
    );
    return () => window.clearTimeout(timer);
  }, []);

  const summaryReady =
    cart.checkoutEligible &&
    cart.currency !== null &&
    cart.subtotalMinor !== null &&
    status !== "error";
  const canSubmit =
    summaryReady &&
    !pending &&
    status !== "refreshing" &&
    (paymentMethod !== "BITCOIN_DEPOSIT" || bitcoinCheckoutAvailable);
  const amountLabel = useMemo(
    () =>
      cart.currency && cart.subtotalMinor !== null
        ? `${cart.currency} order`
        : "order",
    [cart.currency, cart.subtotalMinor],
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    setPending(true);
    setServerError(null);
    setFieldErrors({});

    const formData = new FormData(event.currentTarget);
    const payload = {
      idempotencyKey: idempotencyKey.current,
      customerName: String(formData.get("customerName") ?? ""),
      customerEmail: String(formData.get("customerEmail") ?? ""),
      fulfillmentType,
      deliveryLocation:
        fulfillmentType === "DELIVERY" ? deliveryLocation : null,
      paymentMethod,
      rechargeProvider:
        paymentMethod === "RECHARGE_ONLINE" ? rechargeProvider || null : null,
      lines: storedLines,
    };

    try {
      const response = await fetch("/api/checkout/intents", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as {
        error?: string;
        fieldErrors?: FieldErrors;
        intent?: {
          publicId: string;
          fulfillmentType: "PICKUP" | "DELIVERY";
        };
      };
      if (!response.ok || !result.intent) {
        setFieldErrors(result.fieldErrors ?? {});
        setServerError(
          result.error ?? "The order could not be placed. Try again.",
        );
        if (response.status === 409) refresh();
        return;
      }
      router.push(
        result.intent.fulfillmentType === "DELIVERY"
          ? `/checkout/delivery?intent=${encodeURIComponent(result.intent.publicId)}`
          : `/allverification?intent=${encodeURIComponent(result.intent.publicId)}`,
      );
    } catch {
      setServerError(
        "Checkout could not reach the store. Check your connection and retry.",
      );
    } finally {
      setPending(false);
    }
  }

  if (status === "loading") {
    return (
      <Card className="p-6">
        <p role="status" className="text-sm text-foreground-muted">
          Loading and confirming your cart…
        </p>
      </Card>
    );
  }

  if (!summaryReady) {
    return (
      <InlineAlert
        tone="danger"
        title="Your cart is not ready for checkout"
        description={
          <span>
            Refresh the cart and ensure every item is available and uses one
            currency.{" "}
            <Link href="/cart" className="font-semibold underline">
              Return to cart
            </Link>
          </span>
        }
      />
    );
  }

  return (
    <form
      onSubmit={submit}
      noValidate
      className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:gap-12"
    >
      <div className="grid gap-6">
        {serverError && (
          <InlineAlert
            tone="danger"
            title="Order not placed"
            description={serverError}
          />
        )}

        <Card className="grid gap-5 p-5 sm:p-6">
          <div>
            <p className="text-xs font-semibold tracking-[0.1em] text-foreground-subtle uppercase">
              Step 1
            </p>
            <h2 className="mt-1 text-lg font-semibold">Your information</h2>
            <p className="mt-1 text-sm leading-6 text-foreground-muted">
              No account is created. We use these details for this order only.
            </p>
          </div>
          <FormField
            invalid={Boolean(fieldErrors.customerName)}
            hasError={Boolean(fieldErrors.customerName)}
          >
            <Label required>Full name</Label>
            <TextField
              name="customerName"
              autoComplete="name"
              required
              maxLength={120}
            />
            <FieldError>{fieldErrors.customerName?.[0]}</FieldError>
          </FormField>
          <FormField
            invalid={Boolean(fieldErrors.customerEmail)}
            hasError={Boolean(fieldErrors.customerEmail)}
            hasDescription
          >
            <Label required>Email</Label>
            <TextField
              name="customerEmail"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              maxLength={320}
            />
            <FieldDescription>
              Used to identify and communicate about this order.
            </FieldDescription>
            <FieldError>{fieldErrors.customerEmail?.[0]}</FieldError>
          </FormField>
        </Card>

        <Card className="grid gap-5 p-5 sm:p-6">
          <div>
            <p className="text-xs font-semibold tracking-[0.1em] text-foreground-subtle uppercase">
              Step 2
            </p>
            <h2 className="mt-1 text-lg font-semibold">Fulfillment</h2>
          </div>
          <RadioGroup
            name="fulfillmentType"
            legend="How will you receive the order?"
            description="Detailed pickup and delivery instructions will be confirmed later."
            orientation="horizontal"
          >
            <RadioOption
              value="PICKUP"
              label="Pickup"
              checked={fulfillmentType === "PICKUP"}
              onChange={() => setFulfillmentType("PICKUP")}
              description="Collect the order after confirmation."
            />
            <RadioOption
              value="DELIVERY"
              label="Delivery"
              checked={fulfillmentType === "DELIVERY"}
              onChange={() => setFulfillmentType("DELIVERY")}
              description="Delivery details will be coordinated after verification."
            />
          </RadioGroup>
          {fulfillmentType === "DELIVERY" && (
            <div className="rounded-xl bg-surface-subtle p-4">
              <p className="text-sm font-semibold">Delivery destination</p>
              {deliveryLocation ? (
                <>
                  <p className="mt-1 text-sm leading-6 text-foreground-muted">
                    {deliveryLocation.formattedAddress}
                  </p>
                  <div className="mt-3">
                    <StoreLocationControl
                      onLocationChange={setDeliveryLocation}
                      className="rounded-md border border-border bg-surface"
                    />
                  </div>
                </>
              ) : (
                <div className="mt-2 flex items-center justify-between gap-3">
                  <p className="text-sm text-foreground-muted">
                    Confirm a real location before placing a delivery order.
                  </p>
                  <StoreLocationControl
                    onLocationChange={setDeliveryLocation}
                    className="shrink-0 rounded-md border border-border bg-surface"
                  />
                </div>
              )}
              <FieldError>{fieldErrors.deliveryLocation?.[0]}</FieldError>
            </div>
          )}
        </Card>

        <Card className="grid gap-5 p-5 sm:p-6">
          <div>
            <p className="text-xs font-semibold tracking-[0.1em] text-foreground-subtle uppercase">
              Step 3
            </p>
            <h2 className="mt-1 text-lg font-semibold">Payment method</h2>
            <p className="mt-1 text-sm leading-6 text-foreground-muted">
              Choose one secure method. The server saves this choice with the
              confirmed cart and order amount.
            </p>
          </div>
          <PaymentMethodSelector
            value={paymentMethod}
            bitcoinAvailable={bitcoinCheckoutAvailable}
            onChange={setPaymentMethod}
          />

          {paymentMethod === "RECHARGE_ONLINE" && (
            <div>
              <p className="text-sm font-semibold">Online recharge partners</p>
              <p className="mt-1 text-xs leading-5 text-foreground-muted">
                Partner websites open in a new tab. Complete the purchase,
                return here, and select the partner you used.
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {RECHARGE_PARTNERS.map((partner) => (
                  <label
                    key={partner.id}
                    className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface p-3.5 has-checked:border-foreground has-checked:ring-1 has-checked:ring-foreground"
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <input
                        type="radio"
                        name="rechargeProvider"
                        value={partner.id}
                        checked={rechargeProvider === partner.id}
                        onChange={() => setRechargeProvider(partner.id)}
                        className="size-5 accent-black"
                      />
                      <span className="text-sm font-semibold">
                        {partner.name}
                      </span>
                    </span>
                    <a
                      href={partner.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Open ${partner.name} in a new tab`}
                      className="grid size-11 shrink-0 place-items-center rounded-md hover:bg-surface-subtle"
                    >
                      <ExternalLink aria-hidden="true" className="size-4" />
                    </a>
                  </label>
                ))}
              </div>
              <FieldError>{fieldErrors.rechargeProvider?.[0]}</FieldError>
            </div>
          )}
        </Card>
      </div>

      <aside className="grid gap-4 lg:sticky lg:top-24">
        <OrderSummary
          currency={cart.currency!}
          subtotalMinor={cart.subtotalMinor!}
          totalMinor={cart.subtotalMinor!}
        />
        <InlineAlert
          tone="info"
          title="Final verification comes next"
          description={`Continuing this ${amountLabel} securely confirms current products and prices. Delivery orders then choose a simulated nearby profile before code verification.`}
        />
        <Button type="submit" size="large" disabled={!canSubmit}>
          {pending ? (
            <LoaderCircle
              aria-hidden="true"
              className="size-4 animate-spin motion-reduce:animate-none"
            />
          ) : fulfillmentType === "DELIVERY" ? (
            <Truck aria-hidden="true" className="size-4" />
          ) : (
            <ArrowRight aria-hidden="true" className="size-4" />
          )}
          {pending
            ? "Preparing checkout…"
            : fulfillmentType === "DELIVERY"
              ? "Find delivery options"
              : "Continue to verification"}
        </Button>
        <Link
          href="/cart"
          className={cn(buttonVariants({ variant: "secondary" }), "w-full")}
        >
          Return to cart
        </Link>
      </aside>
    </form>
  );
}
