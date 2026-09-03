"use client";

import { useState, type FormEvent } from "react";
import {
  Eye,
  EyeOff,
  LoaderCircle,
  Plus,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import {
  Button,
  FieldDescription,
  FieldError,
  FormField,
  IconButton,
  InlineAlert,
  Label,
  TextArea,
  TextField,
} from "@/components/ui";

type FieldErrors = Record<string, string[] | undefined>;

export function RechargeCodeConfirmation({
  intentId,
  customerEmail,
  eligible,
  onCompleted,
}: {
  intentId: string;
  customerEmail: string;
  eligible: boolean;
  onCompleted: (reference: string) => void;
}) {
  const [codes, setCodes] = useState(["", "", ""]);
  const [visible, setVisible] = useState<Set<number>>(new Set());
  const [pending, setPending] = useState(false);
  const [serverError, setServerError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  function updateCode(index: number, value: string) {
    setCodes((current) =>
      current.map((code, position) =>
        position === index ? value.replace(/\D/g, "").slice(0, 64) : code,
      ),
    );
  }

  function addCode() {
    setCodes((current) => (current.length < 10 ? [...current, ""] : current));
  }

  function removeCode(index: number) {
    setCodes((current) => current.filter((_, position) => position !== index));
    setVisible((current) => {
      const next = new Set<number>();
      current.forEach((position) => {
        if (position < index) next.add(position);
        if (position > index) next.add(position - 1);
      });
      return next;
    });
  }

  function toggleVisible(index: number) {
    setVisible((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || !eligible) return;
    setPending(true);
    setServerError("");
    setFieldErrors({});
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch(
        `/api/checkout/intents/${encodeURIComponent(intentId)}/submit`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            verificationCodes: codes,
            customerNote: String(data.get("customerNote") ?? ""),
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
          result.error ?? "The recharge codes could not be submitted.",
        );
        return;
      }
      onCompleted(result.order.reference);
    } catch {
      setServerError(
        "The store could not be reached. Check your connection and retry.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-6">
      {serverError && (
        <InlineAlert
          tone="danger"
          title="Confirmation not submitted"
          description={serverError}
        />
      )}
      <section
        aria-labelledby="checkout-recharge-codes"
        className="border-y border-border py-6"
      >
        <div>
          <p className="text-xs font-bold tracking-[0.12em] text-info uppercase">
            Secure verification
          </p>
          <h2
            id="checkout-recharge-codes"
            className="mt-1 text-2xl font-black tracking-[-0.035em]"
          >
            Add recharge codes
          </h2>
          <p className="mt-2 text-sm leading-6 text-foreground-muted">
            Add each recharge separately. Three fields are ready.
          </p>
        </div>
        <div className="mt-5 grid gap-4">
          {codes.map((code, index) => (
            <FormField
              key={index}
              invalid={Boolean(fieldErrors.verificationCodes)}
              hasError={Boolean(fieldErrors.verificationCodes)}
            >
              <Label required>Recharge code {index + 1}</Label>
              <div className="grid grid-cols-[minmax(0,1fr)_2.75rem_auto] gap-2">
                <TextField
                  name="verificationCodes"
                  type={visible.has(index) ? "text" : "password"}
                  value={
                    visible.has(index)
                      ? code.replace(/(\d{4})(?=\d)/g, "$1 ")
                      : code
                  }
                  onChange={(event) => updateCode(index, event.target.value)}
                  inputMode="numeric"
                  autoComplete="off"
                  pattern="[0-9]+"
                  minLength={6}
                  maxLength={79}
                  required
                  aria-label={`Recharge code ${index + 1}`}
                />
                <IconButton
                  type="button"
                  aria-label={
                    visible.has(index)
                      ? `Hide recharge code ${index + 1}`
                      : `Show recharge code ${index + 1}`
                  }
                  onClick={() => toggleVisible(index)}
                >
                  {visible.has(index) ? (
                    <EyeOff aria-hidden="true" />
                  ) : (
                    <Eye aria-hidden="true" />
                  )}
                </IconButton>
                {codes.length > 3 && (
                  <IconButton
                    type="button"
                    aria-label={`Remove recharge code ${index + 1}`}
                    onClick={() => removeCode(index)}
                  >
                    <Trash2 aria-hidden="true" />
                  </IconButton>
                )}
              </div>
            </FormField>
          ))}
        </div>
        <FieldError className="mt-3">
          {fieldErrors.verificationCodes?.[0]}
        </FieldError>
        <Button
          type="button"
          variant="secondary"
          size="small"
          className="mt-4"
          aria-label="Add another recharge code"
          onClick={addCode}
          disabled={codes.length >= 10}
        >
          <Plus aria-hidden="true" className="size-4" />
          Add another code
        </Button>
      </section>

      <section className="grid gap-4 border-b border-border pb-6">
        <FormField hasDescription>
          <Label optional>Order note</Label>
          <TextArea name="customerNote" maxLength={1000} rows={3} />
          <FieldDescription>
            Updates are associated with {customerEmail}.
          </FieldDescription>
        </FormField>
        <Button
          type="submit"
          size="large"
          disabled={
            pending || !eligible || codes.some((code) => code.length < 6)
          }
        >
          {pending ? (
            <LoaderCircle
              aria-hidden="true"
              className="size-4 animate-spin motion-reduce:animate-none"
            />
          ) : (
            <ShieldCheck aria-hidden="true" className="size-4" />
          )}
          {pending ? "Securing codes..." : "Submit for review"}
        </Button>
      </section>
    </form>
  );
}
