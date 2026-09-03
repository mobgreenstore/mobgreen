"use client";

import { Eye, EyeOff, Plus, Trash2 } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
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
import type { SimulatedCourierCandidate } from "@/features/delivery-matching/types";
import { StoreLocationControl } from "@/features/location/components/store-location-control";
import type { DeliveryLocation } from "@/features/location/schema";

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

const partners = [
  {
    id: "STARTSELECT",
    name: "Startselect",
    url: "https://startselect.com/",
    logoSrc: "/images/partners/startselect.png",
  },
  {
    id: "DUNDLE",
    name: "Dundle",
    url: "https://dundle.com/",
    logoSrc: "/images/partners/dundle.png",
  },
  {
    id: "RECHARGE_COM",
    name: "Recharge.com",
    url: "https://recharge.com/",
    logoSrc: "/images/partners/recharge-com.ico",
  },
  {
    id: "VIDAPLAYER",
    name: "VidaPlayer",
    url: "https://www.vidaplayer.com/",
    logoSrc: "/images/partners/vidaplayer.ico",
  },
  {
    id: "BITREFILL",
    name: "Bitrefill",
    url: "https://www.bitrefill.com/",
    logoSrc: "/images/partners/bitrefill.ico",
  },
  {
    id: "COINSBEE",
    name: "Coinsbee",
    url: "https://www.coinsbee.com/",
    logoSrc: "/images/partners/coinsbee.png",
  },
  {
    id: "OFFGAMERS",
    name: "OffGamers",
    url: "https://off-gamers.com/",
    logoSrc: "/images/partners/offgamers.png",
  },
  {
    id: "G2A",
    name: "G2A",
    url: "https://www.g2a.com/",
    logoSrc: "/images/partners/g2a.ico",
  },
  {
    id: "GAMESEAL",
    name: "Gameseal",
    url: "https://gameseal.com/",
    logoSrc: "/images/partners/gameseal.ico",
  },
] as const;

function candidateSet(location: DeliveryLocation): SimulatedCourierCandidate[] {
  const seed = Math.abs(
    Math.round(location.latitude * 1000) +
      Math.round(location.longitude * 1000),
  );
  return profileNames.map((displayName, index) => ({
    candidateId: `direct-${index}-${(seed + index * 37).toString(36)}`,
    displayName,
    distanceMeters: 700 + ((seed + index * 619) % 4300),
    estimatedDurationSeconds: 13 * 60 + ((seed + index * 241) % (29 * 60)),
  }));
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
  const repeated = [...partners, ...partners];
  return (
    <section
      aria-label="Recharge partners"
      className="overflow-hidden border-b border-border bg-surface-subtle/45 py-4"
    >
      <div className="flex items-baseline justify-between gap-4 px-5 sm:px-8">
        <p className="text-xs font-bold tracking-[0.12em] text-foreground-subtle uppercase">
          Recharge partners
        </p>
        <p className="hidden text-xs text-foreground-muted sm:block">
          Buy a code, then return here to verify.
        </p>
      </div>
      <div className="mt-3 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_7%,black_93%,transparent)]">
        <div className="verification-partner-marquee flex w-max items-center gap-1 px-4 focus-within:[animation-play-state:paused] hover:[animation-play-state:paused] motion-reduce:animate-none">
          {repeated.map((partner, index) => (
            <a
              key={`${partner.id}-${index}`}
              href={partner.url}
              target="_blank"
              rel="noreferrer noopener"
              aria-hidden={index >= partners.length ? true : undefined}
              tabIndex={index >= partners.length ? -1 : undefined}
              className="flex h-11 shrink-0 items-center gap-2 rounded-md px-3 transition-colors hover:bg-surface focus-visible:ring-2 focus-visible:ring-foreground focus-visible:outline-none"
            >
              <img
                src={partner.logoSrc}
                width="26"
                height="26"
                alt=""
                className="size-6 object-contain"
              />
              <span className="text-sm font-semibold whitespace-nowrap">
                {partner.name}
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
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
          <FormField>
            <Label required>Phone number</Label>
            <TextField
              name="phone"
              type="tel"
              autoComplete="tel"
              minLength={7}
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
          Payment remains pending until the server verifies it.
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
  const [location, setLocation] = useState<DeliveryLocation | null>(null);
  const [locationSheetOpen, setLocationSheetOpen] = useState(false);
  const [selectedCourier, setSelectedCourier] =
    useState<SimulatedCourierCandidate | null>(null);
  const candidates = useMemo(
    () => (location ? candidateSet(location) : []),
    [location],
  );

  function applyLocation(next: DeliveryLocation | null) {
    setLocation(next);
    setSelectedCourier(null);
  }

  function submit(method: DirectMethod, event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (method !== "BITCOIN_DEPOSIT" && codes.some((code) => code.length < 6))
      return;
    setPrepared(true);
    setLocationSheetOpen(true);
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
              <div>
                <h3 className="text-xl font-black tracking-tight">
                  Nearby delivery profiles
                </h3>
                <p className="mt-1 text-sm text-foreground-muted">
                  Estimated from the confirmed destination.
                </p>
              </div>
              <CourierCandidateGrid
                candidates={candidates}
                selectedCandidateId={selectedCourier?.candidateId}
                onSelect={setSelectedCourier}
              />
              {selectedCourier && (
                <InlineAlert
                  tone="info"
                  title="Delivery preference saved"
                  description="It is revalidated after the order payment is confirmed."
                />
              )}
            </div>
          )}
        </section>
      )}
    </Tabs>
  );
}
