"use client";

import { forwardRef, type ComponentPropsWithoutRef } from "react";
import { Select } from "@/components/ui/select";
import { SUPPORTED_CURRENCIES } from "@/config/commerce";

export const CurrencySelect = forwardRef<
  HTMLSelectElement,
  Omit<ComponentPropsWithoutRef<typeof Select>, "children">
>((props, ref) => (
  <Select ref={ref} {...props}>
    {SUPPORTED_CURRENCIES.map(({ code, label, symbol }) => (
      <option key={code} value={code}>
        {code} — {label} ({symbol})
      </option>
    ))}
  </Select>
));
CurrencySelect.displayName = "CurrencySelect";
