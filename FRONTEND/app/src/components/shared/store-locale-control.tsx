"use client";

import { Check, ChevronDown, Globe2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui";
import {
  LOCALE_OPTIONS,
  localeFromValue,
  STOREFRONT_LOCALE_COOKIE,
  type SupportedLocale,
} from "@/i18n/config";
import { cn } from "@/lib/utils";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

function saveLocalePreference(locale: SupportedLocale) {
  document.cookie =
    STOREFRONT_LOCALE_COOKIE +
    "=" +
    locale +
    "; Path=/; Max-Age=" +
    COOKIE_MAX_AGE +
    "; SameSite=Lax";
}

export function StoreLocaleControl({ className }: { className?: string }) {
  const router = useRouter();
  const t = useTranslations("LanguageControl");
  const locale = localeFromValue(useLocale());
  const selected = LOCALE_OPTIONS.find((option) => option.code === locale) ?? {
    code: locale,
    label: locale.toUpperCase(),
  };

  function selectLocale(nextLocale: SupportedLocale) {
    if (nextLocale === locale) return;
    saveLocalePreference(nextLocale);
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={t("label", { language: selected.label })}
          className={cn(
            "inline-flex min-h-11 items-center gap-1.5 rounded-full px-2.5 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-current/35 focus-visible:outline-none",
            className,
          )}
        >
          <Globe2 aria-hidden="true" className="size-4" />
          <span className="font-mono text-xs uppercase">{locale}</span>
          <ChevronDown aria-hidden="true" className="size-3.5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="min-w-44">
        <DropdownMenuLabel>{t("choose")}</DropdownMenuLabel>
        {LOCALE_OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option.code}
            aria-label={option.label}
            onSelect={() => selectLocale(option.code)}
            className="min-h-11 justify-between"
          >
            <span>{option.label}</span>
            {option.code === locale ? (
              <Check aria-hidden="true" className="size-4" />
            ) : (
              <span className="font-mono text-xs text-foreground-subtle uppercase">
                {option.code}
              </span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
