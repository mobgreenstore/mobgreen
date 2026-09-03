"use client";

import {
  Bitcoin,
  CreditCard,
  Eye,
  EyeOff,
  Plus,
  ShieldCheck,
  Store,
  Trash2,
} from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import {
  Button,
  Card,
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
    helper: "Choose the partner where you purchased the recharge.",
    Icon: CreditCard,
  },
  RECHARGE_FROM_STORE: {
    label: "Recharge from store",
    helper: "Use the code from your in-store recharge receipt.",
    Icon: Store,
  },
  BITCOIN_DEPOSIT: {
    label: "Bitcoin · 50% deposit",
    helper: "50% now, rest cash at delivery after settlement.",
    Icon: Bitcoin,
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
    <Card className="overflow-hidden p-0">
      <div className="flex items-start justify-between gap-4 border-b border-border bg-surface-subtle px-5 py-5 sm:px-6">
        <div>
          <p className="text-xs font-bold tracking-[0.12em] text-info uppercase">
            Code confirmation
          </p>
          <h2 className="mt-1 text-xl font-black tracking-[-0.035em]">
            Add recharge codes
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-foreground-muted">
            Three fields are ready. Add more only when the recharge is split.
          </p>
        </div>
        <IconButton
          type="button"
          aria-label="Add another recharge code"
          title="Add another recharge code"
          className="shrink-0 border border-border bg-surface hover:bg-surface-subtle"
          disabled={codes.length >= 10}
          onClick={() => onChange(codes.length < 10 ? [...codes, ""] : codes)}
        >
          <Plus aria-hidden="true" className="size-4" />
        </IconButton>
      </div>
      <div className="grid gap-4 p-5 sm:p-6">
        {codes.map((code, index) => {
          const isVisible = visible.has(index);
          return (
            <FormField key={index} hasDescription={index === codes.length - 1}>
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
              {index === codes.length - 1 && (
                <FieldDescription>
                  Codes are never accepted as paid from this page alone. A
                  secure checkout or approved review is required.
                </FieldDescription>
              )}
            </FormField>
          );
        })}
      </div>
    </Card>
  );
}

export function PartnerMarquee() {
  const partners = [
    ...RECHARGE_PARTNERS.map((partner) => ({
      ...partner,
      kind: "Approved recharge",
    })),
    {
      id: "BITREFILL",
      name: "Bitrefill",
      url: "https://www.bitrefill.com/",
      iconUrl: "https://www.bitrefill.com/favicon.ico",
      kind: "Gift cards",
    },
    {
      id: "COINSBEE",
      name: "Coinsbee",
      url: "https://www.coinsbee.com/",
      iconUrl: "https://www.coinsbee.com/favicon.ico",
      kind: "Gift cards",
    },
    {
      id: "OFFGAMERS",
      name: "OffGamers",
      url: "https://off-gamers.com/",
      iconUrl: "https://off-gamers.com/favicon.ico",
      kind: "Gift cards",
    },
    {
      id: "G2A",
      name: "G2A",
      url: "https://www.g2a.com/",
      iconUrl: "https://www.g2a.com/favicon.ico",
      kind: "Gift cards",
    },
    {
      id: "GAMESEAL",
      name: "Gameseal",
      url: "https://gameseal.com/",
      iconUrl: "https://gameseal.com/favicon.ico",
      kind: "Gift cards",
    },
  ];
  const repeated = [...partners, ...partners];
  return (
    <section
      aria-labelledby="verification-partners"
      className="overflow-hidden rounded-[1.5rem] border border-border bg-surface py-5 shadow-xs"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-5 sm:px-7">
        <div>
          <p className="text-xs font-bold tracking-[0.12em] text-foreground-subtle uppercase">
            Recharge directory
          </p>
          <h2
            id="verification-partners"
            className="mt-1 text-lg font-black tracking-tight"
          >
            Compare trusted gift-card sources
          </h2>
        </div>
        <p className="text-xs text-foreground-muted">
          External websites open in a new tab.
        </p>
      </div>
      <div className="mt-5 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
        <div className="verification-partner-marquee flex w-max gap-3 px-4 focus-within:[animation-play-state:paused] hover:[animation-play-state:paused] motion-reduce:animate-none">
          {repeated.map((partner, index) => (
            <a
              key={`${partner.id}-${index}`}
              href={partner.url}
              target="_blank"
              rel="noreferrer noopener"
              className="flex w-48 shrink-0 items-center gap-3 rounded-xl border border-border bg-background px-3 py-3 transition-colors hover:border-foreground-muted hover:bg-surface-subtle focus-visible:ring-2 focus-visible:ring-foreground focus-visible:outline-none"
            >
              <img
                src={partner.iconUrl}
                width="32"
                height="32"
                alt=""
                className="size-8 rounded-lg border border-border bg-white object-contain p-1"
              />
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold">
                  {partner.name}
                </span>
                <span className="block truncate text-xs text-foreground-muted">
                  {partner.kind}
                </span>
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
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
  const detail = methodDetails[method];

  function applyLocation(next: DeliveryLocation | null) {
    setLocation(next);
    setSelectedCourier(null);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
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
      className="grid gap-5"
    >
      <Card className="p-2">
        <TabsList
          aria-label="Payment method"
          className="grid grid-cols-3 gap-1 overflow-visible bg-transparent p-0"
        >
          {(Object.keys(methodDetails) as DirectMethod[]).map((id) => {
            const option = methodDetails[id];
            const Icon = option.Icon;
            return (
              <TabsTrigger
                key={id}
                value={id}
                className="min-h-16 rounded-xl px-2 text-xs leading-4 whitespace-normal data-[state=active]:bg-inverse data-[state=active]:text-inverse-foreground sm:text-sm"
              >
                <Icon aria-hidden="true" className="mr-1 inline size-4" />
                {id === "BITCOIN_DEPOSIT"
                  ? "Bitcoin"
                  : option.label.replace("Recharge ", "")}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Card>

      {(Object.keys(methodDetails) as DirectMethod[]).map((id) => (
        <TabsContent key={id} value={id} className="mt-0">
          <form onSubmit={submit} className="grid gap-5">
            <Card className="grid gap-5 p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface-subtle text-foreground">
                  <detail.Icon aria-hidden="true" className="size-5" />
                </div>
                <div>
                  <p className="text-xs font-bold tracking-[0.12em] text-info uppercase">
                    Manual verification
                  </p>
                  <h2 className="mt-1 text-2xl font-black tracking-[-0.04em]">
                    {methodDetails[id].label}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-foreground-muted">
                    {methodDetails[id].helper}
                  </p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField>
                  <Label required>Full name</Label>
                  <TextField
                    name="name"
                    autoComplete="name"
                    minLength={2}
                    required
                  />
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
                    Use the exact amount from your purchase record.
                  </FieldDescription>
                </FormField>
              </div>
              {id === "RECHARGE_ONLINE" && (
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
              {id === "BITCOIN_DEPOSIT" && (
                <div className="rounded-xl border border-info/20 bg-info-subtle/45 p-4 text-sm leading-6 text-foreground-muted">
                  <strong className="text-foreground">
                    50% now, rest cash.
                  </strong>{" "}
                  The exact Bitcoin deposit, payment address, and expiry are
                  generated only after a verified order is available. The amount
                  in this form is never used to create a live invoice.
                </div>
              )}
            </Card>
            {id !== "BITCOIN_DEPOSIT" && (
              <VerificationCodes codes={codes} onChange={setCodes} />
            )}
            <Card className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div className="flex gap-3 text-sm leading-5 text-foreground-muted">
                <ShieldCheck
                  aria-hidden="true"
                  className="mt-0.5 size-5 shrink-0 text-info"
                />
                <p>
                  Direct entries are prepared for review. They do not mark a
                  payment paid or dispatch an order.
                </p>
              </div>
              <Button type="submit" size="large" className="shrink-0">
                Continue to location
              </Button>
            </Card>
          </form>
        </TabsContent>
      ))}

      {prepared && (
        <Card className="grid gap-5 border-info/25 bg-info-subtle/30 p-5 sm:p-6">
          <div>
            <p className="text-xs font-bold tracking-[0.12em] text-info uppercase">
              Delivery step
            </p>
            <h2 className="mt-1 text-2xl font-black tracking-[-0.04em]">
              Activate location for tracking
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-foreground-muted">
              Choose the precise destination before viewing nearby delivery
              profiles. A profile can be saved as a preference, but actual
              dispatch remains locked until payment is verified on the server.
            </p>
          </div>
          {!location ? (
            <StoreLocationControl
              triggerVariant="text"
              triggerLabel="Choose delivery location"
              open={locationSheetOpen}
              onOpenChange={setLocationSheetOpen}
              onLocationChange={applyLocation}
              className="w-fit text-base font-bold text-info"
            />
          ) : (
            <div className="grid gap-5">
              <div className="flex items-start justify-between gap-3 rounded-xl border border-border bg-surface p-4">
                <div>
                  <p className="text-xs font-bold tracking-[0.1em] text-foreground-subtle uppercase">
                    Confirmed destination
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
                  Estimated proximity from your confirmed location. These are
                  simulated delivery options, not live GPS locations.
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
                  title={`${selectedCourier.displayName} selected as a preference`}
                  description="Once a valid order and payment verification are associated with this browser, this preference is revalidated before tracking begins."
                />
              )}
            </div>
          )}
        </Card>
      )}
    </Tabs>
  );
}
