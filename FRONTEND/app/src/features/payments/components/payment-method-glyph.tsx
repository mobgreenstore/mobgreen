import { Bitcoin, Globe2, Store } from "lucide-react";
import type { PaymentMethodId } from "@/features/payments/payment-method";
import { cn } from "@/lib/utils";

const glyphs = {
  RECHARGE_FROM_STORE: Store,
  RECHARGE_ONLINE: Globe2,
  BITCOIN_DEPOSIT: Bitcoin,
} as const;

export function PaymentMethodGlyph({
  method,
  className,
}: {
  method: PaymentMethodId;
  className?: string;
}) {
  const Glyph = glyphs[method];
  return (
    <Glyph
      aria-hidden="true"
      className={cn("size-6", className)}
      strokeWidth={1.7}
    />
  );
}
