import type { SupportedCurrency } from "@/config/commerce";

interface MoneyProps {
  amountMinor: number;
  currency: SupportedCurrency;
  locale?: string;
  className?: string;
}

export function formatMoney(
  amountMinor: number,
  currency: SupportedCurrency,
  locale = "en",
) {
  const formatter = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  });
  const fractionDigits = formatter.resolvedOptions().maximumFractionDigits ?? 2;
  return formatter.format(amountMinor / 10 ** fractionDigits);
}

export function Money({
  amountMinor,
  currency,
  locale,
  className,
}: MoneyProps) {
  return (
    <span className={className} data-currency={currency}>
      {formatMoney(amountMinor, currency, locale)}
    </span>
  );
}
