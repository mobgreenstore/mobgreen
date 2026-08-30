"use client";

import Link from "next/link";
import {
  LocateFixed,
  LoaderCircle,
  MapPin,
  Search,
  Trash2,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type PointerEvent,
} from "react";
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetDescription,
  BottomSheetTitle,
  BottomSheetTrigger,
  Button,
  IconButton,
  InlineAlert,
  TextField,
} from "@/components/ui";
import { Money } from "@/components/commerce/money";
import type {
  PublicOrderListItem,
  PublicOrderListView,
} from "@/features/customer-orders/types";
import type {
  DeliveryLocation,
  LocationCandidate,
} from "@/features/location/schema";
import {
  clearDeliveryLocation,
  loadDeliveryLocation,
  saveDeliveryLocation,
} from "@/features/location/storage";
import { cn } from "@/lib/utils";

type Status = "idle" | "loading" | "error";

function locationLine(
  location: Pick<DeliveryLocation, "postalCode" | "locality" | "country">,
) {
  return [location.postalCode, location.locality, location.country]
    .filter(Boolean)
    .join(" · ");
}

function orderLabel(status: PublicOrderListItem["status"]) {
  return status.toLowerCase().replaceAll("_", " ");
}

export function StoreLocationControl({
  className,
  onLocationChange,
  triggerVariant = "icon",
  triggerLabel,
}: {
  className?: string;
  onLocationChange?: (location: DeliveryLocation | null) => void;
  triggerVariant?: "icon" | "text";
  triggerLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [location, setLocation] = useState<DeliveryLocation | null>(null);
  const [candidate, setCandidate] = useState<LocationCandidate | null>(null);
  const [suggestions, setSuggestions] = useState<LocationCandidate[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [orders, setOrders] = useState<PublicOrderListItem[] | null>(null);
  const dragStart = useRef<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setLocation(loadDeliveryLocation());
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!open || !location) return;
    fetch("/api/customer/orders?page=1", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error();
        return (await response.json()) as PublicOrderListView;
      })
      .then((result) => setOrders(result.orders))
      .catch(() => setOrders([]));
  }, [open, location]);

  async function requestSuggestions(payload: Record<string, unknown>) {
    setStatus("loading");
    setError("");
    setCandidate(null);
    try {
      const response = await fetch("/api/location/search", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as {
        suggestions?: LocationCandidate[];
        error?: string;
      };
      if (!response.ok) throw new Error(result.error);
      setSuggestions(result.suggestions ?? []);
      if (!result.suggestions?.length) {
        setError("No exact location was found. Check the details and retry.");
      }
      setStatus("idle");
    } catch (reason) {
      setStatus("error");
      setError(
        reason instanceof Error && reason.message
          ? reason.message
          : "Location search is temporarily unavailable.",
      );
    }
  }

  function searchPostal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = String(
      new FormData(event.currentTarget).get("postalCode") ?? "",
    );
    requestSuggestions({ mode: "POSTAL_CODE", query });
  }

  function useCurrentLocation() {
    setError("");
    if (!navigator.geolocation) {
      setError(
        "Current location is unavailable in this browser. Search by postal code instead.",
      );
      return;
    }
    setStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (position) =>
        requestSuggestions({
          mode: "CURRENT_LOCATION",
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
      (reason) => {
        setStatus("error");
        setError(
          reason.code === reason.PERMISSION_DENIED
            ? "Location permission was denied. Allow it in browser settings or search by postal code."
            : reason.code === reason.TIMEOUT
              ? "Getting your location timed out. Retry or search by postal code."
              : "Your current location is unavailable. Search by postal code instead.",
        );
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  }

  async function confirmLocation() {
    if (!candidate) return;
    setStatus("loading");
    setError("");
    try {
      const response = await fetch("/api/location/confirm", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          verificationToken: candidate.verificationToken,
        }),
      });
      const result = (await response.json()) as {
        location?: DeliveryLocation;
        error?: string;
      };
      if (!response.ok || !result.location) throw new Error(result.error);
      saveDeliveryLocation(result.location);
      setLocation(result.location);
      onLocationChange?.(result.location);
      setOpen(false);
      setSuggestions([]);
      setCandidate(null);
      setStatus("idle");
    } catch (reason) {
      setStatus("error");
      setError(
        reason instanceof Error && reason.message
          ? reason.message
          : "Location could not be confirmed.",
      );
    }
  }

  function clearSaved() {
    clearDeliveryLocation();
    setLocation(null);
    onLocationChange?.(null);
    setOrders(null);
    setCandidate(null);
    setSuggestions([]);
  }

  function pointerDown(event: PointerEvent<HTMLDivElement>) {
    dragStart.current = event.clientY;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function pointerMove(event: PointerEvent<HTMLDivElement>) {
    if (dragStart.current === null) return;
    setDragOffset(Math.max(0, event.clientY - dragStart.current));
  }

  function pointerUp() {
    if (dragOffset > 100) setOpen(false);
    dragStart.current = null;
    setDragOffset(0);
  }

  const confirmed = (orders ?? []).filter(
    (order) => order.paymentStatus === "PAID",
  );
  const pending = (orders ?? []).filter(
    (order) => order.paymentStatus !== "PAID",
  );

  return (
    <BottomSheet open={open} onOpenChange={setOpen}>
      <BottomSheetTrigger asChild>
        {triggerVariant === "text" ? (
          <Button
            variant="ghost"
            className={cn(
              "min-h-0 px-0 py-0 text-info hover:bg-transparent hover:underline",
              className,
            )}
            aria-label={
              location
                ? `Change location: ${locationLine(location)}`
                : "Activate location"
            }
          >
            {triggerLabel ??
              (location ? "Change location" : "Activate location")}
          </Button>
        ) : (
          <IconButton
            aria-label={
              location
                ? `Location: ${locationLine(location)}`
                : "Choose your location"
            }
            title={
              location ? location.formattedAddress : "Choose your location"
            }
            className={className}
          >
            <MapPin aria-hidden="true" className="size-5" strokeWidth={2} />
          </IconButton>
        )}
      </BottomSheetTrigger>
      <BottomSheetContent
        aria-describedby="location-sheet-description"
        className="rounded-t-[1.75rem] px-4 sm:px-6"
        style={{
          transform: dragOffset ? `translateY(${dragOffset}px)` : undefined,
        }}
        onPointerDown={pointerDown}
        onPointerMove={pointerMove}
        onPointerUp={pointerUp}
        onPointerCancel={pointerUp}
      >
        <div onPointerDown={(event) => event.stopPropagation()}>
          <BottomSheetTitle className="text-2xl font-semibold tracking-[-0.04em]">
            {location ? "Your location" : "Choose your location"}
          </BottomSheetTitle>
          <BottomSheetDescription
            id="location-sheet-description"
            className="mt-2 max-w-lg text-sm leading-6 text-foreground-muted"
          >
            Delivery availability and future tracking depend on the exact
            location you confirm.
          </BottomSheetDescription>

          {error && (
            <InlineAlert
              className="mt-4"
              tone="danger"
              title="Location unavailable"
              description={error}
            />
          )}

          {location ? (
            <div className="mt-6 grid gap-5">
              <div className="rounded-xl border border-border bg-surface-subtle p-4">
                <p className="font-semibold">{location.formattedAddress}</p>
                <p className="mt-1 text-sm text-foreground-muted">
                  {locationLine(location)}
                </p>
                <p className="mt-3 text-xs leading-5 text-foreground-subtle">
                  Saved only in this browser and on this device.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {onLocationChange && (
                  <Button
                    onClick={() => {
                      onLocationChange(location);
                      setOpen(false);
                    }}
                  >
                    Use this location
                  </Button>
                )}
                <Button variant="secondary" onClick={() => setLocation(null)}>
                  Change location
                </Button>
                <Button variant="ghost" onClick={clearSaved}>
                  <Trash2 aria-hidden="true" className="size-4" />
                  Clear saved location
                </Button>
              </div>

              <section aria-labelledby="recent-orders">
                <div className="flex items-center justify-between gap-3">
                  <h3 id="recent-orders" className="font-semibold">
                    Recent orders
                  </h3>
                  <Link
                    href="/orders"
                    className="text-sm font-semibold underline underline-offset-4"
                  >
                    View all orders
                  </Link>
                </div>
                {orders === null ? (
                  <p
                    role="status"
                    className="mt-4 flex items-center gap-2 text-sm text-foreground-muted"
                  >
                    <LoaderCircle
                      aria-hidden="true"
                      className="size-4 animate-spin motion-reduce:animate-none"
                    />
                    Loading orders…
                  </p>
                ) : (
                  <div className="mt-3 grid gap-5">
                    {confirmed.length > 0 && (
                      <OrderGroup title="Confirmed orders" orders={confirmed} />
                    )}
                    {pending.length > 0 && (
                      <OrderGroup
                        title="Pending verification"
                        orders={pending}
                      />
                    )}
                    {orders?.length === 0 && (
                      <p className="rounded-lg bg-surface-subtle p-4 text-sm text-foreground-muted">
                        No orders are linked to this browser yet.
                      </p>
                    )}
                  </div>
                )}
              </section>
            </div>
          ) : (
            <div className="mt-6 grid gap-5">
              <form onSubmit={searchPostal} className="flex items-end gap-2">
                <label className="min-w-0 flex-1 text-sm font-semibold">
                  ZIP or postal code
                  <TextField
                    name="postalCode"
                    className="mt-2"
                    autoComplete="postal-code"
                    maxLength={32}
                    required
                  />
                </label>
                <Button type="submit" disabled={status === "loading"}>
                  <Search aria-hidden="true" className="size-4" />
                  Search
                </Button>
              </form>

              <Button
                variant="secondary"
                className="w-full justify-start"
                onClick={useCurrentLocation}
                disabled={status === "loading"}
              >
                {status === "loading" ? (
                  <LoaderCircle
                    aria-hidden="true"
                    className="size-4 animate-spin motion-reduce:animate-none"
                  />
                ) : (
                  <LocateFixed aria-hidden="true" className="size-4" />
                )}
                Use my current location
              </Button>

              {suggestions.length > 0 && (
                <div>
                  <p className="text-sm font-semibold">
                    Select the exact place
                  </p>
                  <div className="mt-2 grid gap-2" role="list">
                    {suggestions.map((suggestion) => (
                      <button
                        key={suggestion.verificationToken}
                        type="button"
                        onClick={() => setCandidate(suggestion)}
                        className={cn(
                          "min-h-16 rounded-lg border p-3 text-left transition-colors motion-reduce:transition-none",
                          candidate?.verificationToken ===
                            suggestion.verificationToken
                            ? "border-foreground bg-surface-subtle ring-1 ring-foreground"
                            : "border-border bg-surface hover:border-border-strong",
                        )}
                      >
                        <span className="block text-sm font-semibold">
                          {suggestion.formattedAddress}
                        </span>
                        <span className="mt-1 block text-xs text-foreground-muted">
                          {locationLine(suggestion)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {candidate && (
                <div className="rounded-xl bg-surface-subtle p-4">
                  <p className="text-sm font-semibold">Resolved address</p>
                  <p className="mt-1 text-sm leading-6 text-foreground-muted">
                    {candidate.formattedAddress}
                  </p>
                  <Button
                    className="mt-4 w-full"
                    onClick={confirmLocation}
                    disabled={status === "loading"}
                  >
                    Use this location
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </BottomSheetContent>
    </BottomSheet>
  );
}

function OrderGroup({
  title,
  orders,
}: {
  title: string;
  orders: PublicOrderListItem[];
}) {
  return (
    <div>
      <h4 className="text-xs font-semibold tracking-[0.08em] text-foreground-subtle uppercase">
        {title}
      </h4>
      <div className="mt-2 grid gap-2">
        {orders.slice(0, 3).map((order) => (
          <article
            key={order.reference}
            className="rounded-lg border border-border p-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{order.reference}</p>
                <p className="mt-1 text-xs text-foreground-muted capitalize">
                  {orderLabel(order.status)}
                </p>
              </div>
              <Money
                amountMinor={order.totalMinor}
                currency={order.currency}
                className="text-sm font-semibold"
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-3 text-sm font-semibold">
              <Link
                href={`/orders/${order.reference}`}
                className="underline underline-offset-4"
              >
                View order
              </Link>
              {order.fulfillmentType === "DELIVERY" &&
                order.status === "OUT_FOR_DELIVERY" && (
                  <Link
                    href={`/orders/${order.reference}/tracking`}
                    className="underline underline-offset-4"
                  >
                    View tracking
                  </Link>
                )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
