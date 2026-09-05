"use client";

import Link from "next/link";
import { Clock3, MapPin, Navigation, Route } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button, ErrorState, InlineAlert, Skeleton } from "@/components/ui";
import { OrderStatusBadge } from "@/features/orders/components/status-badges";
import { DynamicTrackingMap } from "@/features/location/components/dynamic-tracking-map";
import type { PublicTrackingView } from "@/features/tracking/types";
import { buttonVariants } from "@/components/ui/button";

function distanceLabel(meters: number) {
  if (meters < 1000) return `${meters} m`;
  return `${(meters / 1000).toFixed(meters < 10_000 ? 1 : 0)} km`;
}

function durationLabel(seconds: number) {
  if (seconds <= 60) return "Less than a minute";
  const minutes = Math.ceil(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours} hr ${remainder} min` : `${hours} hr`;
}

export function CustomerOrderTracking({
  reference,
  initialTracking = null,
}: {
  reference: string;
  initialTracking?: PublicTrackingView | null;
}) {
  const [tracking, setTracking] = useState<PublicTrackingView | null>(
    initialTracking,
  );
  const [status, setStatus] = useState<
    "loading" | "ready" | "error" | "offline"
  >(initialTracking ? "ready" : "loading");
  const previousStatus = useRef<string | null>(initialTracking?.status ?? null);
  const [announcement, setAnnouncement] = useState("");

  const load = useCallback(async () => {
    if (!navigator.onLine) {
      setStatus("offline");
      return;
    }
    try {
      const response = await fetch(
        `/api/customer/orders/${encodeURIComponent(reference)}/tracking`,
        { cache: "no-store" },
      );
      if (!response.ok) throw new Error("Tracking request failed.");
      const result = (await response.json()) as {
        tracking: PublicTrackingView;
      };
      if (
        previousStatus.current &&
        previousStatus.current !== result.tracking.status
      ) {
        setAnnouncement(
          `Order status changed to ${result.tracking.status.toLowerCase().replaceAll("_", " ")}.`,
        );
      }
      previousStatus.current = result.tracking.status;
      setTracking(result.tracking);
      setStatus("ready");
    } catch {
      setStatus(navigator.onLine ? "error" : "offline");
    }
  }, [reference]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    const onOnline = () => void load();
    const onOffline = () => setStatus("offline");
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [load]);

  useEffect(() => {
    const state = tracking?.tracking.state;
    if (state === "COMPLETED" || state === "CANCELLED") return;
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, 15_000);
    const onVisibility = () => {
      if (document.visibilityState === "visible") void load();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [load, tracking?.tracking.state]);

  if (status === "loading" && !tracking) {
    return (
      <div className="grid gap-5" aria-label="Loading tracking">
        <Skeleton className="h-[430px] rounded-2xl" />
        <Skeleton className="h-44 rounded-2xl" />
      </div>
    );
  }

  if ((status === "error" || status === "offline") && !tracking) {
    return (
      <ErrorState
        title={
          status === "offline" ? "You are offline" : "Tracking unavailable"
        }
        description={
          status === "offline"
            ? "Reconnect to load the latest simulated delivery position."
            : "Tracking could not be loaded for this browser session."
        }
        onRetry={() => void load()}
      />
    );
  }

  if (!tracking) return null;
  const data = tracking.tracking;
  const progress = Math.min(1, Math.max(0, data.progress));
  const progressPercentage = Math.round(progress * 100);
  const estimatedArrival = new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(data.estimatedArrivalAt));

  return (
    <div className="grid gap-6">
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
      {status === "offline" && (
        <InlineAlert
          tone="info"
          title="Showing the last confirmed position"
          description="You are offline. Tracking will refresh automatically after reconnecting."
        />
      )}
      {data.routeKind === "DIRECT_FALLBACK" && (
        <InlineAlert
          tone="info"
          title="Direct trajectory fallback"
          description="A supported driving route was unavailable. The line shown is simulated directly between dispatch and destination; it is not a road route."
        />
      )}

      <DynamicTrackingMap tracking={data} />

      <section className="grid gap-5 rounded-2xl border border-border bg-background p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold tracking-[0.08em] text-foreground-subtle uppercase">
              Order {tracking.reference}
            </p>
            <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em]">
              Delivery progress
            </h2>
          </div>
          <OrderStatusBadge status={tracking.status} />
        </div>

        <InlineAlert
          tone="info"
          title="Simulated delivery progress"
          description={data.routeDisclosure}
        />

        <section aria-labelledby="courier-progress-heading">
          <div className="flex items-baseline justify-between gap-4">
            <h3 id="courier-progress-heading" className="text-sm font-semibold">
              Courier progress
            </h3>
            <span className="font-mono text-sm font-semibold">
              {progressPercentage}%
            </span>
          </div>
          <div
            role="progressbar"
            aria-labelledby="courier-progress-heading"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progressPercentage}
            aria-valuetext={`${progressPercentage}% complete. ${distanceLabel(data.distanceRemainingMeters)} remaining.`}
            className="mt-3 h-2 overflow-hidden rounded-full bg-surface-subtle"
          >
            <span
              aria-hidden="true"
              className="block h-full rounded-full bg-success transition-[width] duration-500 motion-reduce:transition-none"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-foreground-muted">
            {distanceLabel(data.distanceRemainingMeters)} remaining to the
            recipient.
          </p>
        </section>

        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-surface-subtle p-4">
            <dt className="flex items-center gap-2 text-xs text-foreground-muted">
              <Route aria-hidden="true" className="size-4" />
              Remaining
            </dt>
            <dd className="mt-2 font-semibold">
              {distanceLabel(data.distanceRemainingMeters)}
            </dd>
          </div>
          <div className="rounded-xl bg-surface-subtle p-4">
            <dt className="flex items-center gap-2 text-xs text-foreground-muted">
              <Clock3 aria-hidden="true" className="size-4" />
              Time left
            </dt>
            <dd className="mt-2 font-semibold">
              {durationLabel(data.timeRemainingSeconds)}
            </dd>
          </div>
          <div className="col-span-2 rounded-xl bg-surface-subtle p-4 sm:col-span-1">
            <dt className="flex items-center gap-2 text-xs text-foreground-muted">
              <Navigation aria-hidden="true" className="size-4" />
              Progress
            </dt>
            <dd className="mt-2 font-semibold">
              {Math.round(data.progress * 100)}%
            </dd>
          </div>
        </dl>

        <div>
          <p className="text-xs font-semibold tracking-[0.08em] text-foreground-subtle uppercase">
            Estimated arrival
          </p>
          <p className="mt-1 font-semibold">{estimatedArrival}</p>
        </div>

        <div>
          <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.08em] text-foreground-subtle uppercase">
            <MapPin aria-hidden="true" className="size-4" />
            Recipient location
          </p>
          <p className="mt-2 text-sm leading-6">
            {tracking.deliveryAddress.formattedAddress}
          </p>
          {(tracking.deliveryAddress.locality ||
            tracking.deliveryAddress.postalCode) && (
            <p className="mt-1 text-sm text-foreground-muted">
              {[
                tracking.deliveryAddress.locality,
                tracking.deliveryAddress.postalCode,
              ]
                .filter(Boolean)
                .join(" / ")}
            </p>
          )}
        </div>

        <div>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="font-semibold">Courier timeline</h3>
            <span className="text-xs text-foreground-muted">
              Updated{" "}
              {new Intl.DateTimeFormat("en", {
                timeStyle: "short",
              }).format(new Date(data.serverTimestamp))}
            </span>
          </div>
          <ol aria-label="Order tracking history" className="grid gap-0">
            {tracking.events.map((event, index) => (
              <li
                key={`${event.status}-${event.createdAt}`}
                className="relative grid grid-cols-[1rem_1fr] gap-3 pb-5 last:pb-0"
              >
                <span className="mt-1 size-3 rounded-full bg-foreground" />
                {index < tracking.events.length - 1 && (
                  <span
                    aria-hidden="true"
                    className="absolute top-4 bottom-0 left-[0.34375rem] w-px bg-border"
                  />
                )}
                <div>
                  <p className="font-semibold capitalize">
                    {event.status.toLowerCase().replaceAll("_", " ")}
                  </p>
                  <time className="text-sm text-foreground-muted">
                    {new Intl.DateTimeFormat("en", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(event.createdAt))}
                  </time>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="flex flex-wrap gap-3 border-t border-border pt-5">
          <Link
            href={`/orders/${encodeURIComponent(reference)}`}
            className={buttonVariants({ variant: "secondary" })}
          >
            View order details
          </Link>
          {(status === "error" || status === "offline") && (
            <Button variant="ghost" onClick={() => void load()}>
              Retry tracking
            </Button>
          )}
        </div>
      </section>
    </div>
  );
}
