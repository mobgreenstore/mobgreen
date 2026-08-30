import type { WeightUnit } from "@/config/commerce";
import { WEIGHT_UNITS } from "@/config/commerce";

export function formatWeight(value: number, unit: WeightUnit, locale = "en") {
  const unitLabel =
    WEIGHT_UNITS.find((item) => item.value === unit)?.shortLabel ??
    unit.toLowerCase();
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 3 }).format(value)} ${unitLabel}`;
}

export function WeightDisplay({
  value,
  unit,
  locale,
  className,
}: {
  value: number;
  unit: WeightUnit;
  locale?: string;
  className?: string;
}) {
  return <span className={className}>{formatWeight(value, unit, locale)}</span>;
}
