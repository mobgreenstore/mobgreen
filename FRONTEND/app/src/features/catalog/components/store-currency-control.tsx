"use client";

import { Check, ChevronDown, LoaderCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui";
import {
  SUPPORTED_CURRENCIES,
  type SupportedCurrency,
} from "@/config/commerce";
import {
  currencyForCountry,
  STOREFRONT_CURRENCY_COOKIE,
} from "@/features/catalog/currency-preference";
import { loadDeliveryLocation } from "@/features/location/storage";
import { cn } from "@/lib/utils";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

function saveCurrency(currency: SupportedCurrency) {
  document.cookie = `${STOREFRONT_CURRENCY_COOKIE}=${currency}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax`;
  window.dispatchEvent(new CustomEvent("mob-greens-currency-change"));
}

function browserCountry() {
  for (const language of navigator.languages) {
    const region = language.split("-")[1];
    if (region?.length === 2) return region;
  }
  return null;
}

export function StoreCurrencyControl({
  currency,
  hasPreference = true,
  className,
}: {
  currency: SupportedCurrency;
  hasPreference?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const initialized = useRef(false);
  const [changing, setChanging] = useState(false);

  useEffect(() => {
    if (initialized.current || hasPreference) return;
    initialized.current = true;
    const location = loadDeliveryLocation();
    const detected = location
      ? currencyForCountry(location.countryCode)
      : currencyForCountry(browserCountry());
    saveCurrency(detected);
    if (detected !== currency) {
      router.refresh();
    }
  }, [currency, hasPreference, router]);

  function selectCurrency(next: SupportedCurrency) {
    if (next === currency || changing) return;
    setChanging(true);
    saveCurrency(next);
    router.refresh();
  }

  const selected =
    SUPPORTED_CURRENCIES.find((option) => option.code === currency) ??
    SUPPORTED_CURRENCIES[2];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={
            changing
              ? "Updating prices for your selected currency"
              : `Display currency, currently ${selected.label}`
          }
          aria-busy={changing}
          disabled={changing}
          className={cn(
            "inline-flex min-h-11 items-center gap-2 rounded-full bg-surface-subtle px-3 text-sm font-semibold text-foreground transition-colors hover:bg-border focus-visible:ring-2 focus-visible:ring-foreground/35 focus-visible:outline-none",
            className,
          )}
        >
          {changing ? (
            <>
              <LoaderCircle
                aria-hidden="true"
                className="size-4 animate-spin motion-reduce:animate-none"
              />
              <span>Updating prices</span>
            </>
          ) : (
            <>
              <span className="font-mono">{selected.symbol}</span>
              <span>{selected.code}</span>
              <ChevronDown
                aria-hidden="true"
                className="size-4 text-foreground-muted"
              />
            </>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="min-w-52">
        {SUPPORTED_CURRENCIES.map((option) => (
          <DropdownMenuItem
            key={option.code}
            onSelect={() => selectCurrency(option.code)}
            className="min-h-11 justify-between"
          >
            <span>
              <span className="mr-2 inline-block w-5 font-mono">
                {option.symbol}
              </span>
              {option.label}
            </span>
            {option.code === currency ? (
              <Check aria-hidden="true" className="size-4" />
            ) : (
              <span className="text-xs text-foreground-subtle">
                {option.code}
              </span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
