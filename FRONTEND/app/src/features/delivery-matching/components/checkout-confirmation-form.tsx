"use client";

import Link from "next/link";
import { LoaderCircle, ShieldCheck, Truck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  Button,
  Card,
  FieldDescription,
  FieldError,
  FormField,
  InlineAlert,
  Label,
  TextField,
  buttonVariants,
} from "@/components/ui";
import { useCart } from "@/features/cart/cart-provider";
import { VerificationOrderSummary } from "@/features/delivery-matching/components/verification-order-summary";
import type { CheckoutConfirmationView } from "@/features/delivery-matching/types";
import { cn } from "@/lib/utils";

type FieldErrors = Record<string, string[] | undefined>;

export function CheckoutConfirmationForm({
  intent,
}: {
  intent: CheckoutConfirmationView;
}) {
  const router = useRouter();
  const { clear } = useCart();
  const [pending, setPending] = useState(false);
  const [serverError, setServerError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [verificationCode, setVerificationCode] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setServerError("");
    setFieldErrors({});
    try {
      const response = await fetch(
        `/api/checkout/intents/${encodeURIComponent(intent.publicId)}/submit`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            verificationCode,
          }),
        },
      );
      const result = (await response.json()) as {
        error?: string;
        fieldErrors?: FieldErrors;
        order?: { reference: string };
      };
      if (!response.ok || !result.order) {
        setFieldErrors(result.fieldErrors ?? {});
        setServerError(
          result.error ?? "The order could not be submitted. Retry.",
        );
        return;
      }
      clear();
      router.push(
        `/order-success?reference=${encodeURIComponent(result.order.reference)}`,
      );
    } catch {
      setServerError(
        "The store could not be reached. Check your connection and retry.",
      );
    } finally {
      setPending(false);
    }
  }

  if (intent.status === "EXPIRED") {
    return (
      <InlineAlert
        tone="danger"
        title="Checkout expired"
        description={
          <Link href="/checkout" className="font-semibold underline">
            Return to checkout and confirm current prices.
          </Link>
        }
      />
    );
  }

  if (intent.fulfillmentType === "DELIVERY" && !intent.selectedCourier) {
    return (
      <InlineAlert
        tone="danger"
        title="Choose a delivery profile first"
        description={
          <Link
            href={`/checkout/delivery?intent=${encodeURIComponent(intent.publicId)}`}
            className="font-semibold underline"
          >
            Return to delivery matching
          </Link>
        }
      />
    );
  }

  return (
    <form
      onSubmit={submit}
      noValidate
      className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:gap-10"
    >
      <div className="grid gap-5">
        {!intent.confirmationEligible && (
          <InlineAlert
            tone="danger"
            title="Review your card again"
            description={
              <Link href="/cart" className="font-semibold underline">
                A product, price, or offer changed. Return to your card before
                submitting the recharge code.
              </Link>
            }
          />
        )}
        {serverError && (
          <InlineAlert
            tone="danger"
            title="Order not submitted"
            description={serverError}
          />
        )}

        {intent.selectedCourier && (
          <Card className="flex items-center gap-4 p-4 sm:p-5">
            <div className="grid size-11 shrink-0 place-items-center rounded-full bg-info-subtle text-info">
              <Truck aria-hidden="true" className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold tracking-[0.08em] text-foreground-subtle uppercase">
                Selected simulated delivery profile
              </p>
              <p className="mt-1 truncate font-semibold">
                {intent.selectedCourier.displayName}
              </p>
            </div>
            <Link
              href={`/checkout/delivery?intent=${encodeURIComponent(intent.publicId)}`}
              className="ml-auto shrink-0 text-sm font-semibold text-info underline underline-offset-4"
            >
              Change
            </Link>
          </Card>
        )}

        <Card className="grid gap-5 p-5 sm:p-6">
          <div>
            <h2 className="text-xl font-semibold tracking-[-0.03em]">
              Recharge verification
            </h2>
            <p className="mt-2 text-sm leading-6 text-foreground-muted">
              Enter the numeric code received after recharging. The store
              administrator verifies it before processing the order.
            </p>
          </div>
          <FormField
            invalid={Boolean(fieldErrors.verificationCode)}
            hasError={Boolean(fieldErrors.verificationCode)}
            hasDescription
          >
            <Label required>Verification code</Label>
            <TextField
              name="verificationCode"
              value={verificationCode.replace(/(\d{4})(?=\d)/g, "$1 ")}
              onChange={(event) =>
                setVerificationCode(
                  event.target.value.replace(/\D/g, "").slice(0, 64),
                )
              }
              spellCheck={false}
              inputMode="numeric"
              autoComplete="off"
              pattern="[0-9]+"
              maxLength={79}
              required
            />
            <FieldDescription>
              Digits only. The code is encrypted before storage.
            </FieldDescription>
            <FieldError>{fieldErrors.verificationCode?.[0]}</FieldError>
          </FormField>
        </Card>
      </div>

      <aside className="grid gap-4 lg:sticky lg:top-24">
        <VerificationOrderSummary intent={intent} />
        <InlineAlert
          tone="info"
          title="Verification required"
          description="Submitting creates the order with payment verification pending. It does not mark the recharge as paid."
        />
        <Button
          type="submit"
          size="large"
          disabled={pending || !intent.confirmationEligible}
        >
          {pending ? (
            <LoaderCircle
              aria-hidden="true"
              className="size-4 animate-spin motion-reduce:animate-none"
            />
          ) : (
            <ShieldCheck aria-hidden="true" className="size-4" />
          )}
          {pending ? "Submitting…" : "Submit order for verification"}
        </Button>
        <Link
          href={
            intent.fulfillmentType === "DELIVERY"
              ? `/checkout/delivery?intent=${encodeURIComponent(intent.publicId)}`
              : "/checkout"
          }
          className={cn(buttonVariants({ variant: "secondary" }), "w-full")}
        >
          Back
        </Link>
      </aside>
    </form>
  );
}
