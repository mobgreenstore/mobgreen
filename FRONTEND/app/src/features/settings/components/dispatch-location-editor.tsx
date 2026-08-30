"use client";

import { LoaderCircle, MapPin, Search } from "lucide-react";
import { useActionState, useState, type FormEvent } from "react";
import { Button, InlineAlert, TextField } from "@/components/ui";
import type { LocationCandidate } from "@/features/location/schema";
import {
  initialDispatchLocationState,
  updateDispatchLocationAction,
} from "@/features/settings/server/actions";
import { cn } from "@/lib/utils";

export function DispatchLocationEditor({
  currentAddress,
}: {
  currentAddress: string | null;
}) {
  const [state, action, pending] = useActionState(
    updateDispatchLocationAction,
    initialDispatchLocationState,
  );
  const [suggestions, setSuggestions] = useState<LocationCandidate[]>([]);
  const [selected, setSelected] = useState<LocationCandidate | null>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");

  async function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = String(
      new FormData(event.currentTarget).get("postalCode") ?? "",
    );
    setSearching(true);
    setError("");
    setSelected(null);
    try {
      const response = await fetch("/api/location/search", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mode: "POSTAL_CODE", query }),
      });
      const result = (await response.json()) as {
        suggestions?: LocationCandidate[];
        error?: string;
      };
      if (!response.ok) throw new Error(result.error);
      setSuggestions(result.suggestions ?? []);
      if (!result.suggestions?.length) setError("No exact location was found.");
    } catch (reason) {
      setError(
        reason instanceof Error && reason.message
          ? reason.message
          : "Location search failed.",
      );
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="grid gap-5">
      {currentAddress && (
        <div className="rounded-xl bg-surface-subtle p-4">
          <p className="text-xs font-semibold tracking-[0.08em] text-foreground-subtle uppercase">
            Current private origin
          </p>
          <p className="mt-2 text-sm font-semibold">{currentAddress}</p>
        </div>
      )}
      {(error || state.status === "error") && (
        <InlineAlert
          tone="danger"
          title="Dispatch location not saved"
          description={error || state.message}
        />
      )}
      {state.status === "success" && (
        <InlineAlert
          tone="success"
          title="Dispatch location saved"
          description={state.message}
        />
      )}
      <form onSubmit={search} className="flex items-end gap-2">
        <label className="min-w-0 flex-1 text-sm font-semibold">
          Dispatch postal code or place
          <TextField
            name="postalCode"
            className="mt-2"
            required
            maxLength={32}
          />
        </label>
        <Button type="submit" disabled={searching}>
          {searching ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <Search className="size-4" />
          )}
          Search
        </Button>
      </form>
      {suggestions.length > 0 && (
        <div className="grid gap-2">
          {suggestions.map((item) => (
            <button
              key={item.verificationToken}
              type="button"
              onClick={() => setSelected(item)}
              className={cn(
                "rounded-lg border p-3 text-left",
                selected?.verificationToken === item.verificationToken
                  ? "border-foreground bg-surface-subtle ring-1 ring-foreground"
                  : "border-border",
              )}
            >
              <span className="block text-sm font-semibold">
                {item.formattedAddress}
              </span>
              <span className="mt-1 block text-xs text-foreground-muted">
                {[item.locality, item.region, item.country]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </button>
          ))}
        </div>
      )}
      <form action={action}>
        <input
          type="hidden"
          name="verificationToken"
          value={selected?.verificationToken ?? ""}
        />
        <Button
          type="submit"
          disabled={!selected || pending}
          className="w-full"
        >
          <MapPin className="size-4" />
          {pending ? "Saving…" : "Use as private dispatch origin"}
        </Button>
      </form>
      <p className="text-xs leading-5 text-foreground-subtle">
        This location is used to calculate delivery routes. It is not presented
        as a public pickup address.
      </p>
    </div>
  );
}
