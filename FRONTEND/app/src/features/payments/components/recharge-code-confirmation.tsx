"use client";

import { useRef, useState, type FormEvent } from "react";
import { LoaderCircle, Plus, ShieldCheck, Trash2 } from "lucide-react";
import {
  Button,
  FieldError,
  FormField,
  IconButton,
  InlineAlert,
  Label,
  TextField,
} from "@/components/ui";

type FieldErrors = Record<string, string[] | undefined>;

export function RechargeCodeConfirmation({
  intentId,
  eligible,
  onCompleted,
}: {
  intentId: string;
  eligible: boolean;
  onCompleted: (reference: string) => void;
}) {
  const [codes, setCodes] = useState([""]);
  const codesRef = useRef(codes);
  const [checkingCode, setCheckingCode] = useState<number | null>(null);
  const [readyCodes, setReadyCodes] = useState<Set<number>>(new Set());
  const [pending, setPending] = useState(false);
  const [serverError, setServerError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  function updateCode(index: number, value: string) {
    const normalized = value.replace(/\D/g, "").slice(0, 16);
    setCodes((current) => {
      const next = current.map((code, position) =>
        position === index ? normalized : code,
      );
      codesRef.current = next;
      return next;
    });
    setReadyCodes((current) => {
      const next = new Set(current);
      next.delete(index);
      return next;
    });
    if (normalized.length >= 16) {
      setCheckingCode(index);
      window.setTimeout(() => {
        setCheckingCode((current) => (current === index ? null : current));
        if (codesRef.current[index]?.length === 16) {
          setReadyCodes((current) => new Set(current).add(index));
        }
      }, 450);
    } else if (checkingCode === index) {
      setCheckingCode(null);
    }
  }

  function addCode() {
    setCodes((current) => {
      const next = current.length < 10 ? [...current, ""] : current;
      codesRef.current = next;
      return next;
    });
  }

  function removeCode(index: number) {
    setCodes((current) => {
      const next = current.filter((_, position) => position !== index);
      codesRef.current = next;
      return next;
    });
    setReadyCodes((current) => {
      const next = new Set<number>();
      current.forEach((position) => {
        if (position < index) next.add(position);
        if (position > index) next.add(position - 1);
      });
      return next;
    });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || !eligible) return;
    setPending(true);
    setServerError("");
    setFieldErrors({});
    try {
      const response = await fetch(
        `/api/checkout/intents/${encodeURIComponent(intentId)}/submit`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            verificationCodes: codes.filter(Boolean),
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
            Enter one code to place your order. Add another only when needed.
          </p>
        </div>
        <div className="mt-5 grid gap-4">
          {codes.map((code, index) => (
            <FormField
              key={index}
              invalid={Boolean(fieldErrors.verificationCodes)}
              hasError={Boolean(fieldErrors.verificationCodes)}
            >
              <Label required={index === 0}>
                {index === 0 ? "Recharge code" : "Additional code (optional)"}
              </Label>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                <TextField
                  name="verificationCodes"
                  type="text"
                  value={code.replace(/(\d{4})(?=\d)/g, "$1-")}
                  onChange={(event) => updateCode(index, event.target.value)}
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="0000-0000-0000-0000"
                  pattern="[0-9-]+"
                  minLength={19}
                  maxLength={19}
                  required={index === 0}
                  aria-label={`Recharge code ${index + 1}`}
                />
                {index > 0 && (
                  <IconButton
                    type="button"
                    aria-label={`Remove recharge code ${index + 1}`}
                    onClick={() => removeCode(index)}
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
                  Verifying code…
                </p>
              )}
              {readyCodes.has(index) && checkingCode !== index && (
                <p className="mt-2 text-xs font-medium text-success">
                  Code format ready
                </p>
              )}
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

      <div className="border-t border-border pt-5">
        <Button
          type="submit"
          size="large"
          className="w-full"
          disabled={
            pending ||
            !eligible ||
            !codes.some((code) => code.length === 16) ||
            codes.some((code) => code.length > 0 && code.length !== 16)
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
          {pending ? "Confirming order…" : "Confirm order"}
        </Button>
      </div>
    </form>
  );
}
