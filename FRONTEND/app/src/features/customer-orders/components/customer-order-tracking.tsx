"use client";

import Link from "next/link";
import { Bike, Clock3, MapPin, Route } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button, ErrorState, InlineAlert, Skeleton } from "@/components/ui";
import { buttonVariants } from "@/components/ui/button";
import { DynamicTrackingMap } from "@/features/location/components/dynamic-tracking-map";
import { OrderStatusBadge } from "@/features/orders/components/status-badges";
import { calculateTrackingProgress } from "@/features/tracking/domain";
import type { PublicTrackingView } from "@/features/tracking/types";

function distanceLabel(meters: number) {
  if (meters < 1000) return `${meters} m`;
  return `${(meters / 1000).toFixed(meters < 10_000 ? 1 : 0)} km`;
}

function durationLabel(seconds: number, arrived = false) {
  if (arrived || seconds <= 0) return "Arrived";
  if (seconds <= 60) return "Less than 1 min";
  const minutes = Math.ceil(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours} hr ${remainder} min` : `${hours} hr`;
}

function statusLabel(status: PublicTrackingView["status"]) {
  return status
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function serverTime(view: PublicTrackingView | null) {
  return view ? new Date(view.tracking.serverTimestamp).getTime() : 0;
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
  const [clockMs, setClockMs] = useState(() => serverTime(initialTracking));
  const clockSync = useRef({
    serverMs: serverTime(initialTracking),
    clientMs: 0,
  });
  const previousStatus = useRef<string | null>(initialTracking?.status ?? null);
  const [announcement, setAnnouncement] = useState("");

  const synchronizeClock = useCallback((view: PublicTrackingView) => {
    const nextServerTime = serverTime(view);
    clockSync.current = { serverMs: nextServerTime, clientMs: Date.now() };
    setClockMs(nextServerTime);
  }, []);

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
      synchronizeClock(result.tracking);
      setStatus("ready");
    } catch {
      setStatus(navigator.onLine ? "error" : "offline");
    }
  }, [reference, synchronizeClock]);

  useEffect(() => {
    if (initialTracking && clockSync.current.clientMs === 0) {
      synchronizeClock(initialTracking);
    }
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [initialTracking, load, synchronizeClock]);

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
    if (!tracking || tracking.tracking.state !== "ACTIVE") return;
    const tick = () => {
      const sync = clockSync.current;
      if (!sync.clientMs) return;
      setClockMs(sync.serverMs + (Date.now() - sync.clientMs));
    };
    const interval = window.setInterval(tick, 1_000);
    return () => window.clearInterval(interval);
  }, [tracking]);

  useEffect(() => {
    const state = tracking?.tracking.state;
    if (state === "COMPLETED" || state === "CANCELLED") return;
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, 20_000);
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
        <Skeleton className="h-[calc(100svh-7.5rem)] min-h-[34rem] rounded-none sm:rounded-[1.75rem]" />
        <Skeleton className="h-36 rounded-2xl" />
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
            ? "Reconnect to load the latest delivery position."
            : "Tracking could not be loaded for this browser session."
        }
        onRetry={() => void load()}
      />
    );
  }

  if (!tracking) return null;
  const data = tracking.tracking;
  const liveProgress = calculateTrackingProgress({
    geometry: data.geometry,
    routeDistanceMeters: data.routeDistanceMeters,
    durationSeconds: data.estimatedDurationSeconds,
    dispatchedAt: new Date(data.dispatchedAt),
    state: data.state,
    updatedAt: new Date(data.serverTimestamp),
    now: new Date(clockMs || new Date(data.serverTimestamp).getTime()),
  });
  const liveData = { ...data, ...liveProgress };
  const arrived = data.state === "COMPLETED" || liveProgress.progress >= 1;
  const awaitingDeparture =
    data.state === "ACTIVE" &&
    (clockMs || new Date(data.serverTimestamp).getTime()) <
      new Date(data.dispatchedAt).getTime();
  const progressPercentage = Math.round(liveProgress.progress * 100);
  const estimatedArrival = new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(data.estimatedArrivalAt));
  const arrivalTime = new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(data.estimatedArrivalAt));

  return (
    <div className="grid gap-0 sm:gap-7">
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
      {status === "offline" && (
        <InlineAlert
          className="mb-4"
          tone="info"
          title="Showing the latest saved position"
          description="You are offline. Tracking will synchronize automatically after reconnecting."
        />
      )}
      {data.routeKind === "DIRECT_FALLBACK" && (
        <p className="mb-3 text-xs text-foreground-muted">
          Road-level routing is temporarily unavailable; an estimated route is
          shown.
        </p>
      )}

      <DynamicTrackingMap
        tracking={liveData}
        courierName={tracking.courier.displayName}
        statusLabel={
          arrived
            ? "Arrived"
            : awaitingDeparture
              ? "Courier assigned"
              : statusLabel(tracking.status)
        }
        distanceRemainingLabel={distanceLabel(
          liveProgress.distanceRemainingMeters,
        )}
        timeRemainingLabel={durationLabel(
          liveProgress.timeRemainingSeconds,
          arrived,
        )}
        arrivalLabel={arrived ? "Arrived" : arrivalTime}
      />

      <div className="grid border-b border-border lg:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)] lg:divide-x lg:divide-border">
        <section className="py-7 sm:px-2 sm:py-8 lg:pr-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold tracking-[0.08em] text-foreground-subtle uppercase">
                Order {tracking.reference}
              </p>
              <h2 className="mt-1 text-2xl font-semibold tracking-[-0.04em]">
                Delivery progress
              </h2>
            </div>
            <OrderStatusBadge status={tracking.status} />
          </div>

          <div className="mt-7 flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-full bg-surface-subtle">
              <Bike aria-hidden="true" className="size-5" />
            </span>
            <div>
              <p className="font-semibold">{tracking.courier.displayName}</p>
              <p className="text-sm text-foreground-muted">
                Estimated position updates every second
              </p>
            </div>
          </div>

          <section className="mt-7" aria-labelledby="courier-progress-heading">
            <div className="flex items-baseline justify-between gap-4">
              <h3
                id="courier-progress-heading"
                className="text-sm font-semibold"
              >
                Route completed
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
              aria-valuetext={`${progressPercentage}% complete. ${distanceLabel(liveProgress.distanceRemainingMeters)} remaining.`}
              className="mt-3 h-2 overflow-hidden rounded-full bg-surface-subtle"
            >
              <span
                aria-hidden="true"
                className="block h-full rounded-full bg-success transition-[width] duration-700 motion-reduce:transition-none"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </section>

          <dl className="mt-7 grid grid-cols-2 border-y border-border sm:grid-cols-3">
            <div className="py-4 pr-4">
              <dt className="flex items-center gap-2 text-xs text-foreground-muted">
                <Route aria-hidden="true" className="size-4" /> Remaining
              </dt>
              <dd className="mt-1.5 font-semibold">
                {distanceLabel(liveProgress.distanceRemainingMeters)}
              </dd>
            </div>
            <div className="border-l border-border px-4 py-4">
              <dt className="flex items-center gap-2 text-xs text-foreground-muted">
                <Clock3 aria-hidden="true" className="size-4" /> Time left
              </dt>
              <dd className="mt-1.5 font-semibold">
                {durationLabel(liveProgress.timeRemainingSeconds, arrived)}
              </dd>
            </div>
            <div className="col-span-2 border-t border-border py-4 sm:col-span-1 sm:border-t-0 sm:border-l sm:pl-4">
              <dt className="text-xs text-foreground-muted">Arrival</dt>
              <dd className="mt-1.5 font-semibold">{arrivalTime}</dd>
            </div>
          </dl>
        </section>

        <section className="border-t border-border py-7 sm:px-2 sm:py-8 lg:border-t-0 lg:pl-8">
          <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.08em] text-foreground-subtle uppercase">
            <MapPin aria-hidden="true" className="size-4" /> Delivery address
          </p>
          <p className="mt-3 leading-6">
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
          <div className="mt-7 border-t border-border pt-6">
            <p className="text-xs font-semibold tracking-[0.08em] text-foreground-subtle uppercase">
              Estimated arrival
            </p>
            <p className="mt-2 font-semibold">{estimatedArrival}</p>
            <p className="mt-2 text-sm text-foreground-muted">
              Last synchronized at{" "}
              {new Intl.DateTimeFormat("en", { timeStyle: "medium" }).format(
                new Date(data.serverTimestamp),
              )}
            </p>
          </div>
          <Link
            href={`/orders/${encodeURIComponent(reference)}`}
            className={`${buttonVariants({ variant: "secondary" })} mt-7`}
          >
            View order details
          </Link>
          {(status === "error" || status === "offline") && (
            <Button
              className="mt-3"
              variant="ghost"
              onClick={() => void load()}
            >
              Retry tracking
            </Button>
          )}
        </section>
      </div>

      <section
        className="py-7 sm:px-2 sm:py-8"
        aria-labelledby="tracking-history"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 id="tracking-history" className="text-lg font-semibold">
            Delivery updates
          </h2>
          <span className="text-xs text-foreground-muted">
            Estimated tracking
          </span>
        </div>
        <ol
          aria-label="Order tracking history"
          className="mt-5 grid gap-0 sm:grid-cols-2 sm:gap-5"
        >
          {tracking.events.map((event, index) => (
            <li
              key={`${event.status}-${event.createdAt}`}
              className="relative grid grid-cols-[1rem_1fr] gap-3 pb-5 last:pb-0 sm:pb-0"
            >
              <span className="mt-1 size-3 rounded-full bg-foreground" />
              {index < tracking.events.length - 1 && (
                <span
                  aria-hidden="true"
                  className="absolute top-4 bottom-0 left-[0.34375rem] w-px bg-border sm:hidden"
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
      </section>
    </div>
  );
}
