"use client";

import Link from "next/link";
import { Eye, EyeOff, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  Button,
  FieldDescription,
  FormField,
  IconButton,
  InlineAlert,
  Label,
  Select,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  TextField,
} from "@/components/ui";
import { RECHARGE_PARTNERS } from "@/config/recharge";
import { CourierCandidateGrid } from "@/features/delivery-matching/components/courier-candidate-grid";
import { CourierMatchLoading } from "@/features/delivery-matching/components/courier-match-loading";
import type { SimulatedCourierCandidate } from "@/features/delivery-matching/types";
import { StoreLocationControl } from "@/features/location/components/store-location-control";
import type { DeliveryLocation } from "@/features/location/schema";
import { loadDeliveryLocation } from "@/features/location/storage";
import { RechargePartnerRail } from "@/features/payments/components/recharge-partner-rail";

const methodDetails = {
  RECHARGE_ONLINE: {
    label: "Recharge online",
    helper: "Enter the purchase details and the recharge codes together.",
  },
  RECHARGE_FROM_STORE: {
    label: "Recharge from store",
    helper: "Enter the details from your in-store recharge receipt.",
  },
  BITCOIN_DEPOSIT: {
    label: "Bitcoin - 50% deposit",
    helper: "Pay 50% now. The remaining balance is paid at delivery.",
  },
} as const;

type DirectMethod = keyof typeof methodDetails;

const profileNames = [
  "Maxime L.",
  "Sofia M.",
  "Lucas P.",
  "Elena R.",
  "Matteo B.",
  "Amélie K.",
] as const;

function candidateSet(location: DeliveryLocation): SimulatedCourierCandidate[] {
  const seed = Math.abs(
    Math.round(location.latitude * 1000) +
      Math.round(location.longitude * 1000),
  );
  return profileNames
    .map((displayName, index) => {
      const distanceMeters = 700 + ((seed + index * 619) % 4300);
      const trafficSeconds = (seed + index * 71) % 121;
      return {
        candidateId: `direct-${index}-${(seed + index * 37).toString(36)}`,
        displayName,
        distanceMeters,
        estimatedDurationSeconds: Math.max(
          9 * 60,
          Math.round(distanceMeters / 4.8) + 7 * 60 + trafficSeconds,
        ),
      };
    })
    .sort(
      (left, right) =>
        left.distanceMeters - right.distanceMeters ||
        left.estimatedDurationSeconds - right.estimatedDurationSeconds,
    );
}

function VerificationCodes({
  codes,
  onChange,
}: {
  codes: string[];
  onChange: (next: string[]) => void;
}) {
  const [visible, setVisible] = useState<Set<number>>(new Set());

  function update(index: number, value: string) {
    onChange(
      codes.map((code, position) =>
        position === index
          ? value.replace(/[^a-zA-Z0-9-]/g, "").slice(0, 64)
          : code,
      ),
    );
  }

  function remove(index: number) {
    onChange(codes.filter((_, position) => position !== index));
    setVisible((current) => {
      const next = new Set<number>();
      current.forEach((position) => {
        if (position < index) next.add(position);
        if (position > index) next.add(position - 1);
      });
      return next;
    });
  }

  return (
    <section
      aria-labelledby="recharge-codes-title"
      className="border-y border-border py-6"
    >
      <div>
        <p className="text-xs font-bold tracking-[0.12em] text-foreground-subtle uppercase">
          Recharge codes
        </p>
        <h2
          id="recharge-codes-title"
          className="mt-1 text-xl font-black tracking-tight"
        >
          Add your codes
        </h2>
      </div>
      <div className="mt-5 grid gap-4">
        {codes.map((code, index) => {
          const isVisible = visible.has(index);
          return (
            <FormField key={index}>
              <Label>Recharge code {index + 1}</Label>
              <div className="grid grid-cols-[minmax(0,1fr)_2.75rem_auto] gap-2">
                <TextField
                  value={code}
                  onChange={(event) => update(index, event.target.value)}
                  type={isVisible ? "text" : "password"}
                  autoComplete="off"
                  inputMode="text"
                  minLength={6}
                  maxLength={64}
                  required
                  aria-label={`Recharge code ${index + 1}`}
                />
                <IconButton
                  type="button"
                  aria-label={`${isVisible ? "Hide" : "Show"} recharge code ${index + 1}`}
                  onClick={() =>
                    setVisible((current) => {
                      const next = new Set(current);
                      if (next.has(index)) next.delete(index);
                      else next.add(index);
                      return next;
                    })
                  }
                >
                  {isVisible ? (
                    <EyeOff aria-hidden="true" />
                  ) : (
                    <Eye aria-hidden="true" />
                  )}
                </IconButton>
                {codes.length > 3 && (
                  <IconButton
                    type="button"
                    aria-label={`Remove recharge code ${index + 1}`}
                    onClick={() => remove(index)}
                  >
                    <Trash2 aria-hidden="true" />
                  </IconButton>
                )}
              </div>
            </FormField>
          );
        })}
      </div>
      <Button
        type="button"
        variant="secondary"
        size="small"
        className="mt-4"
        disabled={codes.length >= 10}
        aria-label="Add another recharge code"
        onClick={() => onChange(codes.length < 10 ? [...codes, ""] : codes)}
      >
        <Plus aria-hidden="true" className="size-4" />
        Add another code
      </Button>
    </section>
  );
}

export function PartnerMarquee() {
  return <RechargePartnerRail />;
}

function VerificationForm({
  method,
  codes,
  onCodesChange,
  onSubmit,
}: {
  method: DirectMethod;
  codes: string[];
  onCodesChange: (codes: string[]) => void;
  onSubmit: (method: DirectMethod, event: FormEvent<HTMLFormElement>) => void;
}) {
  const detail = methodDetails[method];
  return (
    <form onSubmit={(event) => onSubmit(method, event)} className="grid gap-7">
      <section className="grid gap-5">
        <div>
          <p className="text-xs font-bold tracking-[0.12em] text-info uppercase">
            Payment verification
          </p>
          <h2 className="mt-1 text-2xl font-black tracking-[-0.04em]">
            {detail.label}
          </h2>
          <p className="mt-2 text-sm leading-6 text-foreground-muted">
            {detail.helper}
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField>
            <Label required>Full name</Label>
            <TextField name="name" autoComplete="name" minLength={2} required />
          </FormField>
          <FormField>
            <Label required>Email address</Label>
            <TextField
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </FormField>
          <FormField hasDescription>
            <Label required>Order amount</Label>
            <TextField
              name="amount"
              type="number"
              inputMode="decimal"
              min="1"
              step="0.01"
              placeholder="0.00"
              required
            />
            <FieldDescription>
              Enter the amount shown on your purchase record.
            </FieldDescription>
          </FormField>
        </div>
        {method === "RECHARGE_ONLINE" && (
          <FormField>
            <Label required>Recharge partner</Label>
            <Select name="partner" required defaultValue="">
              <option value="" disabled>
                Select the partner used
              </option>
              {RECHARGE_PARTNERS.map((partner) => (
                <option key={partner.id} value={partner.id}>
                  {partner.name}
                </option>
              ))}
            </Select>
          </FormField>
        )}
        {method === "BITCOIN_DEPOSIT" && (
          <p className="border-l-2 border-info pl-3 text-sm leading-6 text-foreground-muted">
            The exact BTC amount and invoice are created from a valid checkout
            total, never from this browser field.
          </p>
        )}
      </section>
      {method !== "BITCOIN_DEPOSIT" && (
        <VerificationCodes codes={codes} onChange={onCodesChange} />
      )}
      <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-xl text-sm leading-6 text-foreground-muted">
          Continue to location to prepare a secure checkout. An order is only
          created from a server-owned checkout.
        </p>
        <Button type="submit" size="large" className="shrink-0">
          Continue to location
        </Button>
      </div>
    </form>
  );
}

export function DirectVerificationFlow() {
  const [method, setMethod] = useState<DirectMethod>("RECHARGE_ONLINE");
  const [codes, setCodes] = useState(["", "", ""]);
  const [prepared, setPrepared] = useState(false);
  const [location, setLocation] = useState<DeliveryLocation | null>(() =>
    typeof window === "undefined" ? null : loadDeliveryLocation(),
  );
  const [locationSheetOpen, setLocationSheetOpen] = useState(false);
  const [matching, setMatching] = useState(false);
  const [selectedCourier, setSelectedCourier] =
    useState<SimulatedCourierCandidate | null>(null);
  const matchingTimer = useRef<number | null>(null);
  const candidates = useMemo(
    () => (location ? candidateSet(location) : []),
    [location],
  );

  useEffect(() => {
    return () => {
      if (matchingTimer.current !== null) {
        window.clearTimeout(matchingTimer.current);
      }
    };
  }, []);

  function beginMatching() {
    if (matchingTimer.current !== null) {
      window.clearTimeout(matchingTimer.current);
    }
    setSelectedCourier(null);
    setMatching(true);
    matchingTimer.current = window.setTimeout(() => {
      setMatching(false);
      matchingTimer.current = null;
    }, 1_100);
  }

  function applyLocation(next: DeliveryLocation | null) {
    setLocation(next);
    setSelectedCourier(null);
    if (next && prepared) beginMatching();
  }

  function submit(method: DirectMethod, event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (method !== "BITCOIN_DEPOSIT" && codes.some((code) => code.length < 6))
      return;
    setPrepared(true);
    if (!location) {
      setLocationSheetOpen(true);
      return;
    }
    beginMatching();
  }

  return (
    <Tabs
      value={method}
      onValueChange={(value) => setMethod(value as DirectMethod)}
      className="grid gap-6"
    >
      <TabsList
        aria-label="Payment method"
        className="grid min-h-12 grid-cols-3 gap-0 overflow-visible rounded-md border border-border bg-transparent p-0"
      >
        {(Object.keys(methodDetails) as DirectMethod[]).map((id) => (
          <TabsTrigger
            key={id}
            value={id}
            className="min-h-11 rounded-none border-r border-border px-2 text-xs leading-4 whitespace-normal last:border-r-0 data-[state=active]:bg-inverse data-[state=active]:text-inverse-foreground sm:text-sm"
          >
            {id === "RECHARGE_ONLINE"
              ? "Online recharge"
              : id === "RECHARGE_FROM_STORE"
                ? "From store"
                : "Bitcoin"}
          </TabsTrigger>
        ))}
      </TabsList>
      {(Object.keys(methodDetails) as DirectMethod[]).map((id) => (
        <TabsContent key={id} value={id} className="mt-0">
          <VerificationForm
            method={id}
            codes={codes}
            onCodesChange={setCodes}
            onSubmit={submit}
          />
        </TabsContent>
      ))}
      {prepared && (
        <section
          aria-labelledby="delivery-preference-title"
          className="grid gap-5 border-t border-border pt-7"
        >
          <div>
            <p className="text-xs font-bold tracking-[0.12em] text-info uppercase">
              Delivery preference
            </p>
            <h2
              id="delivery-preference-title"
              className="mt-1 text-2xl font-black tracking-[-0.04em]"
            >
              Choose your delivery location
            </h2>
            <p className="mt-2 text-sm leading-6 text-foreground-muted">
              Location is required before a nearby delivery profile can be
              selected.
            </p>
          </div>
          {!location ? (
            <StoreLocationControl
              triggerVariant="text"
              triggerLabel="Activate location"
              open={locationSheetOpen}
              onOpenChange={setLocationSheetOpen}
              onLocationChange={applyLocation}
              className="w-fit text-base font-bold text-info"
            />
          ) : (
            <div className="grid gap-5">
              <div className="flex items-start justify-between gap-3 border-y border-border py-4">
                <div>
                  <p className="text-xs font-bold tracking-[0.1em] text-foreground-subtle uppercase">
                    Confirmed location
                  </p>
                  <p className="mt-1 text-sm font-semibold">
                    {location.formattedAddress}
                  </p>
                </div>
                <StoreLocationControl
                  triggerVariant="text"
                  triggerLabel="Change"
                  open={locationSheetOpen}
                  onOpenChange={setLocationSheetOpen}
                  onLocationChange={applyLocation}
                  className="shrink-0 font-bold text-info"
                />
              </div>
              {matching ? (
                <CourierMatchLoading
                  locationLabel={
                    [location.locality, location.postalCode]
                      .filter(Boolean)
                      .join(" · ") || "Confirmed destination"
                  }
                />
              ) : (
                <>
                  <div>
                    <h3 className="text-xl font-black tracking-tight">
                      Nearby delivery profiles
                    </h3>
                    <p className="mt-1 text-sm text-foreground-muted">
                      Sorted from closest to furthest from your confirmed
                      destination.
                    </p>
                  </div>
                  <CourierCandidateGrid
                    candidates={candidates}
                    selectedCandidateId={selectedCourier?.candidateId}
                    onSelect={setSelectedCourier}
                  />
                </>
              )}
              {selectedCourier && !matching && (
                <div className="grid gap-3 border-t border-border pt-5 sm:grid-cols-[1fr_auto] sm:items-center">
                  <InlineAlert
                    tone="info"
                    title="Delivery profile selected"
                    description="Start secure checkout to protect the order total, send the order email, and activate private tracking access."
                  />
                  <Link
                    href="/checkout"
                    className="inline-flex min-h-11 items-center justify-center rounded-xl bg-foreground px-4 text-sm font-semibold text-background transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-foreground focus-visible:outline-none"
                  >
                    Start secure checkout
                  </Link>
                </div>
              )}
            </div>
          )}
        </section>
      )}
    </Tabs>
  );
}
