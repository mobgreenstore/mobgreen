"use client";

import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  LoaderCircle,
  Plus,
  Trash2,
} from "lucide-react";
import { useState, type FormEvent } from "react";
import { SUPPORTED_CURRENCIES } from "@/config/commerce";
import {
  Button,
  FieldDescription,
  FormField,
  IconButton,
  Label,
  Select,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  TextField,
} from "@/components/ui";
import { RECHARGE_PARTNERS } from "@/config/recharge";
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

function VerificationCodes({
  codes,
  onChange,
}: {
  codes: string[];
  onChange: (next: string[]) => void;
}) {
  const [visible, setVisible] = useState<Set<number>>(new Set([0]));
  const [checkingCode, setCheckingCode] = useState<number | null>(null);
  const [readyCodes, setReadyCodes] = useState<Set<number>>(new Set());

  function update(index: number, value: string) {
    const normalized = value.replace(/\D/g, "").slice(0, 16);
    onChange(
      codes.map((code, position) => (position === index ? normalized : code)),
    );
    setReadyCodes((current) => {
      const next = new Set(current);
      next.delete(index);
      return next;
    });
    if (normalized.length >= 16) {
      setCheckingCode(index);
      window.setTimeout(() => {
        setCheckingCode((current) => (current === index ? null : current));
        setReadyCodes((current) => new Set(current).add(index));
      }, 5000);
    } else if (checkingCode === index) {
      setCheckingCode(null);
    }
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
    <section aria-labelledby="recharge-codes-title" className="py-6">
      <div className="mt-5 grid gap-4">
        {codes.map((code, index) => {
          const isVisible = visible.has(index);
          return (
            <FormField key={index}>
              <Label required={index === 0}>
                {index === 0 ? "Recharge code" : "Additional code (optional)"}
              </Label>
              <div className="grid grid-cols-[minmax(0,1fr)_2.75rem_auto] gap-2">
                <TextField
                  value={code.replace(/(\d{4})(?=\d)/g, "$1-")}
                  onChange={(event) => update(index, event.target.value)}
                  type={isVisible ? "text" : "password"}
                  autoComplete="off"
                  inputMode="numeric"
                  placeholder="0000-0000-0000-0000"
                  pattern="[0-9-]+"
                  minLength={19}
                  maxLength={19}
                  required={index === 0}
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
                {codes.length > 1 && (
                  <IconButton
                    type="button"
                    aria-label={`Remove recharge code ${index + 1}`}
                    onClick={() => remove(index)}
                  >
                    <Trash2 aria-hidden="true" />
                  </IconButton>
                )}
              </div>
              {checkingCode === index && (
                <p className="mt-2 flex items-center gap-2 text-xs font-medium text-info">
                  <LoaderCircle
                    aria-hidden="true"
                    className="size-3.5 animate-spin motion-reduce:animate-none"
                  />
                  Verifying code authenticity…
                </p>
              )}
              {readyCodes.has(index) && checkingCode !== index && (
                <p className="mt-2 flex items-center gap-2 text-xs font-medium text-success">
                  <CheckCircle2 aria-hidden="true" className="size-3.5" />
                  Verified code
                </p>
              )}
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
  pending,
}: {
  method: DirectMethod;
  codes: string[];
  onCodesChange: (codes: string[]) => void;
  onSubmit: (
    method: DirectMethod,
    event: FormEvent<HTMLFormElement>,
  ) => Promise<void>;
  pending: boolean;
}) {
  return (
    <form onSubmit={(event) => onSubmit(method, event)} className="grid gap-7">
      <section className="grid gap-5">
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
            <Label required>Currency</Label>
            <Select name="currency" required defaultValue="EUR">
              {SUPPORTED_CURRENCIES.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.label} ({currency.symbol})
                </option>
              ))}
            </Select>
            <FieldDescription>
              Select the currency for your order.
            </FieldDescription>
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
            <Label required>Voucher recharge partner</Label>
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
      <div className="flex justify-end">
        <Button
          type="submit"
          size="large"
          className="shrink-0 bg-blue-600 text-white hover:bg-blue-700"
          disabled={pending}
        >
          {pending ? "Submitting..." : "Place order"}
        </Button>
      </div>
    </form>
  );
}

export function DirectVerificationFlow() {
  const router = useRouter();
  const [method, setMethod] = useState<DirectMethod>("RECHARGE_ONLINE");
  const [codes, setCodes] = useState([""]);
  const [pending, setPending] = useState(false);

  async function submit(
    method: DirectMethod,
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    if (method !== "BITCOIN_DEPOSIT" && (!codes[0] || codes[0].length !== 16))
      return;

    const form = event.currentTarget;
    const formData = new FormData(form);
    const customerName = formData.get("name") as string;
    const customerEmail = formData.get("email") as string;
    const orderAmount = formData.get("amount") as string;
    const currency = formData.get("currency") as string;
    const partner = formData.get("partner") as string;

    setPending(true);
    try {
      const response = await fetch("/api/direct-verification", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          customerName,
          customerEmail,
          orderAmount,
          currency,
          paymentMethod: method,
          rechargeProvider: partner || null,
          verificationCodes: codes.filter(Boolean),
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.order) {
        alert(result.error || "Could not submit order. Please try again.");
        setPending(false);
        return;
      }

      router.push(
        `/direct-order-success?reference=${encodeURIComponent(result.order.reference)}`,
      );
    } catch {
      alert("Could not connect to server. Please try again.");
      setPending(false);
    }
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
            pending={pending}
          />
        </TabsContent>
      ))}
    </Tabs>
  );
}
