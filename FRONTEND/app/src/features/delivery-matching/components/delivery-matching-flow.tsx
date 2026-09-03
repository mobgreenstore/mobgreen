"use client";

import Link from "next/link";
import { AlertTriangle, LoaderCircle, MapPin, Truck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Card, InlineAlert, buttonVariants } from "@/components/ui";
import { StoreLocationControl } from "@/features/location/components/store-location-control";
import type { DeliveryLocation } from "@/features/location/schema";
import type {
  CheckoutIntentView,
  SimulatedCourierCandidate,
} from "@/features/delivery-matching/types";
import { cn } from "@/lib/utils";
import { CourierCandidateGrid } from "./courier-candidate-grid";

type RequestState = "idle" | "matching" | "selecting" | "error";

function distanceLabel(distanceMeters: number) {
  return distanceMeters < 1_000
    ? `${distanceMeters} m`
    : `${(distanceMeters / 1_000).toFixed(1)} km`;
}

function durationLabel(durationSeconds: number) {
  return `${Math.max(1, Math.ceil(durationSeconds / 60))} min`;
}

export function DeliveryMatchingFlow({
  initialIntent,
}: {
  initialIntent: CheckoutIntentView;
}) {
  const [intent, setIntent] = useState(initialIntent);
  const [requestState, setRequestState] = useState<RequestState>(
    initialIntent.location &&
      initialIntent.candidates.length &&
      !initialIntent.selectedCourier
      ? "matching"
      : "idle",
  );
  const [selected, setSelected] = useState(initialIntent.selectedCourier);
  const [error, setError] = useState("");
  const [slow, setSlow] = useState(false);
  const [offline, setOffline] = useState(false);
  const requestInFlight = useRef(false);

  useEffect(() => {
    const updateConnection = () => setOffline(!navigator.onLine);
    updateConnection();
    window.addEventListener("online", updateConnection);
    window.addEventListener("offline", updateConnection);
    return () => {
      window.removeEventListener("online", updateConnection);
      window.removeEventListener("offline", updateConnection);
    };
  }, []);

  useEffect(() => {
    if (requestState !== "matching") return;
    if (intent.candidates.length === 0) {
      const slowTimer = window.setTimeout(() => setSlow(true), 6_000);
      return () => window.clearTimeout(slowTimer);
    }
    const revealTimer = window.setTimeout(() => setRequestState("idle"), 1_100);
    return () => window.clearTimeout(revealTimer);
  }, [intent.candidates.length, requestState]);

  async function applyLocation(location: DeliveryLocation | null) {
    if (!location || requestInFlight.current) return;
    requestInFlight.current = true;
    setSlow(false);
    setRequestState("matching");
    setSelected(null);
    setIntent((current) => ({
      ...current,
      candidates: [],
      selectedCourier: null,
    }));
    setError("");
    try {
      const response = await fetch(
        `/api/checkout/intents/${encodeURIComponent(intent.publicId)}/location`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ deliveryLocation: location }),
        },
      );
      const result = (await response.json()) as {
        intent?: CheckoutIntentView;
        error?: string;
      };
      if (!response.ok || !result.intent) {
        throw new Error(result.error ?? "Delivery options could not be found.");
      }
      setIntent(result.intent);
    } catch (reason) {
      setRequestState("error");
      setError(
        reason instanceof Error && reason.message
          ? reason.message
          : "Delivery options could not be found. Check your connection and retry.",
      );
    } finally {
      requestInFlight.current = false;
    }
  }

  async function selectCandidate(candidate: SimulatedCourierCandidate) {
    if (requestInFlight.current || offline) return;
    requestInFlight.current = true;
    setRequestState("selecting");
    setSelected(null);
    setError("");
    try {
      const response = await fetch(
        `/api/checkout/intents/${encodeURIComponent(intent.publicId)}/courier`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ courierCandidateId: candidate.candidateId }),
        },
      );
      const result = (await response.json()) as {
        intent?: CheckoutIntentView;
        error?: string;
      };
      if (!response.ok || !result.intent?.selectedCourier) {
        throw new Error(
          result.error ?? "The delivery profile could not be selected.",
        );
      }
      setIntent(result.intent);
      setSelected(result.intent.selectedCourier);
      setRequestState("idle");
    } catch (reason) {
      setRequestState("error");
      setError(
        reason instanceof Error && reason.message
          ? reason.message
          : "The delivery profile could not be selected. Retry.",
      );
    } finally {
      requestInFlight.current = false;
    }
  }

  if (intent.status === "EXPIRED") {
    return (
      <InlineAlert
        tone="danger"
        title="Checkout expired"
        description={
          <span>
            Return to checkout to confirm current products and prices.{" "}
            <Link href="/checkout" className="font-semibold underline">
              Start checkout again
            </Link>
          </span>
        }
      />
    );
  }

  if (!intent.location) {
    return (
      <Card className="grid gap-5 p-5 sm:p-6">
        <div className="grid size-12 place-items-center rounded-full bg-info-subtle text-info">
          <MapPin aria-hidden="true" className="size-6" />
        </div>
        <div>
          <h2 className="text-xl font-semibold tracking-[-0.03em]">
            Location is required
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-foreground-muted">
            Confirm your delivery location so MOB GREENS can generate simulated
            nearby delivery options and estimated times.
          </p>
        </div>
        <StoreLocationControl
          triggerVariant="text"
          triggerLabel="Activate location"
          onLocationChange={applyLocation}
          className="w-fit text-base font-bold text-info"
        />
      </Card>
    );
  }

  if (requestState === "matching") {
    return (
      <Card
        className="grid min-h-80 place-items-center p-6 text-center"
        aria-live="polite"
      >
        <div>
          <div className="relative mx-auto grid size-16 place-items-center rounded-full bg-surface-subtle">
            <Truck aria-hidden="true" className="size-7" strokeWidth={1.8} />
            <LoaderCircle
              aria-hidden="true"
              className="absolute -inset-1 size-[4.5rem] animate-spin text-info motion-reduce:animate-none"
              strokeWidth={1.2}
            />
          </div>
          <h2 className="mt-5 text-xl font-semibold tracking-[-0.03em]">
            Finding nearby delivery options
          </h2>
          <div className="mt-3 flex justify-center gap-1" aria-hidden="true">
            {[0, 1, 2].map((dot) => (
              <span
                key={dot}
                className="size-2 animate-pulse rounded-full bg-foreground motion-reduce:animate-none"
                style={{ animationDelay: `${dot * 180}ms` }}
              />
            ))}
          </div>
          <p className="mt-4 text-sm text-foreground-muted">
            {[intent.location.locality, intent.location.postalCode]
              .filter(Boolean)
              .join(" · ") || "Confirmed destination"}
          </p>
          {slow && (
            <p className="mt-3 text-xs text-foreground-subtle">
              This is taking longer than usual. Keep this page open.
            </p>
          )}
        </div>
      </Card>
    );
  }

  return (
    <div className="grid gap-5">
      {offline && (
        <InlineAlert
          tone="danger"
          title="You are offline"
          description="Reconnect before selecting a delivery profile."
        />
      )}
      {error && (
        <InlineAlert
          tone="danger"
          title="Delivery matching unavailable"
          description={
            <span>
              {error}{" "}
              <button
                type="button"
                className="font-semibold underline"
                onClick={() => {
                  setError("");
                  setRequestState("idle");
                }}
              >
                Retry
              </button>
            </span>
          }
        />
      )}

      <Card className="p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-[0.08em] text-foreground-subtle uppercase">
              Confirmed destination
            </p>
            <p className="mt-1 truncate text-sm font-semibold">
              {intent.location.formattedAddress}
            </p>
          </div>
          <StoreLocationControl
            triggerVariant="text"
            triggerLabel="Change location"
            onLocationChange={applyLocation}
            className="shrink-0 font-semibold text-info"
          />
        </div>
      </Card>

      <div>
        <h2 className="text-xl font-semibold tracking-[-0.03em]">
          Nearby delivery profiles
        </h2>
        <p className="mt-1 text-sm leading-6 text-foreground-muted">
          These are simulated options based on your confirmed destination, not
          live courier GPS positions.
        </p>
      </div>

      {intent.candidates.length ? (
        <CourierCandidateGrid
          candidates={intent.candidates}
          selectedCandidateId={selected?.candidateId}
          disabled={requestState === "selecting" || offline}
          onSelect={selectCandidate}
        />
      ) : (
        <InlineAlert
          tone="neutral"
          title="No delivery options found"
          description="Change the confirmed location or retry shortly."
        />
      )}

      <p className="sr-only" aria-live="polite">
        {selected ? `${selected.displayName} selected.` : ""}
      </p>

      {selected && (
        <Card className="grid gap-4 border-info/30 bg-info-subtle p-4 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <p className="text-xs font-semibold tracking-[0.08em] text-info uppercase">
              Selected simulated profile
            </p>
            <p className="mt-1 font-semibold">{selected.displayName}</p>
            <p className="mt-1 text-sm text-foreground-muted">
              {distanceLabel(selected.distanceMeters)} · approximately{" "}
              {durationLabel(selected.estimatedDurationSeconds)}
            </p>
          </div>
          <Link
            href={
              intent.status === "SUBMITTED"
                ? "/orders?tab=active"
                : `/checkout/confirmation?intent=${encodeURIComponent(intent.publicId)}`
            }
            className={cn(
              buttonVariants({ variant: "primary", size: "large" }),
              "w-full sm:w-auto",
            )}
          >
            {intent.status === "SUBMITTED"
              ? "Save delivery profile"
              : "Continue to verification"}
          </Link>
        </Card>
      )}

      {requestState === "selecting" && (
        <p
          role="status"
          className="flex items-center gap-2 text-sm text-foreground-muted"
        >
          <LoaderCircle
            aria-hidden="true"
            className="size-4 animate-spin motion-reduce:animate-none"
          />
          Saving selection…
        </p>
      )}

      <p className="flex items-start gap-2 text-xs leading-5 text-foreground-subtle">
        <AlertTriangle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        Actual dispatch routing begins only after payment verification and an
        administrator marks the order out for delivery.
      </p>
    </div>
  );
}
