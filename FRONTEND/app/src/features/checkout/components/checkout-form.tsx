"use client";

import Link from "next/link";
import { ArrowRight, ExternalLink, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
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
  Select,
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
  const onlinePartnerSelected =
    paymentMethod !== "RECHARGE_ONLINE" || Boolean(rechargeProvider);
  const deliveryReady =
    fulfillmentType !== "DELIVERY" || deliveryLocation !== null;
  const canSubmit =
    summaryReady &&
    !pending &&
    status !== "refreshing" &&
    deliveryReady &&
    onlinePartnerSelected &&
    (paymentMethod !== "BITCOIN_DEPOSIT" || bitcoinCheckoutAvailable);
  const selectedRechargePartner = RECHARGE_PARTNERS.find(
    (partner) => partner.id === rechargeProvider,
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
        intent?: { publicId: string };
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
        "/allverification?intent=" + encodeURIComponent(result.intent.publicId),
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
      <div className="grid gap-7">
        {serverError && (
          <InlineAlert
            tone="danger"
            title="Order not placed"
            description={serverError}
          />
        )}

        <section className="grid gap-5 border-b border-border pb-7 sm:gap-6 sm:pb-9">
          <div>
            <p className="text-xs font-bold tracking-[0.12em] text-info uppercase">
              Order contact
            </p>
            <h2 className="mt-1 text-xl font-black tracking-[-0.035em]">
              Where should we send your update?
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-foreground-muted">
              These details are used only for this order. No account is created.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
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
                We use this for your order and delivery updates.
              </FieldDescription>
              <FieldError>{fieldErrors.customerEmail?.[0]}</FieldError>
            </FormField>
          </div>
        </section>

        <Card className="grid gap-5 rounded-2xl border-border-strong/65 p-5 sm:p-6">
          <div>
            <p className="text-xs font-bold tracking-[0.12em] text-info uppercase">
              Fulfillment
            </p>
            <h2 className="mt-1 text-xl font-black tracking-[-0.035em]">
              How will you receive the order?
            </h2>
          </div>
          <RadioGroup
            name="fulfillmentType"
            legend="Choose pickup or delivery"
            description="Delivery requires your confirmed location. It is securely carried into All Verification."
            orientation="horizontal"
          >
            <RadioOption
              value="PICKUP"
              label="Pickup"
              checked={fulfillmentType === "PICKUP"}
              onChange={() => setFulfillmentType("PICKUP")}
              description="Collect after your payment is confirmed."
            />
            <RadioOption
              value="DELIVERY"
              label="Delivery"
              checked={fulfillmentType === "DELIVERY"}
              onChange={() => setFulfillmentType("DELIVERY")}
              description="Choose a nearby delivery profile in verification."
            />
          </RadioGroup>
          {fulfillmentType === "DELIVERY" && (
            <div className="border-t border-border pt-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">Delivery destination</p>
                  <p className="mt-1 text-sm leading-6 text-foreground-muted">
                    {deliveryLocation
                      ? deliveryLocation.formattedAddress
                      : "Confirm a real location before continuing."}
                  </p>
                </div>
                <StoreLocationControl
                  onLocationChange={setDeliveryLocation}
                  className="shrink-0 rounded-md border border-border bg-surface"
                />
              </div>
              <FieldError className="mt-3">
                {fieldErrors.deliveryLocation?.[0]}
              </FieldError>
            </div>
          )}
        </Card>

        <section className="grid gap-5 border-t border-border pt-7 sm:pt-9">
          <div>
            <p className="text-xs font-bold tracking-[0.12em] text-info uppercase">
              Payment
            </p>
            <h2 className="mt-1 text-xl font-black tracking-[-0.035em]">
              Choose a payment method
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-foreground-muted">
              The selected method, products, and exact total are secured
              together before verification opens.
            </p>
          </div>
          <PaymentMethodSelector
            value={paymentMethod}
            bitcoinAvailable={bitcoinCheckoutAvailable}
            onChange={setPaymentMethod}
          />

          {paymentMethod === "RECHARGE_ONLINE" && (
            <section className="grid gap-4 border-t border-border pt-5">
              <div>
                <p className="text-sm font-semibold">Recharge partner</p>
                <p className="mt-1 text-sm leading-6 text-foreground-muted">
                  Choose the partner that will issue your code. Their website
                  opens in a new tab when you are ready.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                <FormField
                  invalid={Boolean(fieldErrors.rechargeProvider)}
                  hasError={Boolean(fieldErrors.rechargeProvider)}
                >
                  <Label required>Partner used for this order</Label>
                  <Select
                    value={rechargeProvider}
                    onChange={(event) =>
                      setRechargeProvider(event.target.value)
                    }
                    required
                  >
                    <option value="" disabled>
                      Select a recharge partner
                    </option>
                    {RECHARGE_PARTNERS.map((partner) => (
                      <option key={partner.id} value={partner.id}>
                        {partner.name}
                      </option>
                    ))}
                  </Select>
                  <FieldError>{fieldErrors.rechargeProvider?.[0]}</FieldError>
                </FormField>
                {selectedRechargePartner ? (
                  <a
                    href={selectedRechargePartner.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      buttonVariants({ variant: "secondary" }),
                      "w-full sm:w-auto",
                    )}
                  >
                    Open partner{" "}
                    <ExternalLink aria-hidden="true" className="size-4" />
                  </a>
                ) : null}
              </div>
            </section>
          )}
        </section>
      </div>

      <aside className="grid gap-4 lg:sticky lg:top-24">
        <OrderSummary
          currency={cart.currency!}
          subtotalMinor={cart.subtotalMinor!}
          totalMinor={cart.subtotalMinor!}
        />
        <Button type="submit" size="large" disabled={!canSubmit}>
          {pending ? (
            <LoaderCircle
              aria-hidden="true"
              className="size-4 animate-spin motion-reduce:animate-none"
            />
          ) : (
            <ArrowRight aria-hidden="true" className="size-4" />
          )}
          {pending ? "Preparing checkout…" : "Continue to verification"}
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
