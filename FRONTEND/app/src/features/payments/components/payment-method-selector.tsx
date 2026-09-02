"use client";

import { Bitcoin } from "lucide-react";
import { InlineAlert, RadioGroup, RadioOption } from "@/components/ui";
import type { PaymentMethodId } from "@/features/payments/payment-method";

type PaymentMethodSelectorProps = {
  value: PaymentMethodId;
  bitcoinAvailable: boolean;
  onChange: (value: PaymentMethodId) => void;
};

export function PaymentMethodSelector({
  value,
  bitcoinAvailable,
  onChange,
}: PaymentMethodSelectorProps) {
  return (
    <>
      <RadioGroup
        name="paymentMethod"
        legend="Choose how you want to pay"
        orientation="horizontal"
      >
        <RadioOption
          value="RECHARGE_FROM_STORE"
          label="Recharge from store"
          description="Use a code purchased from a physical store."
          checked={value === "RECHARGE_FROM_STORE"}
          onChange={() => onChange("RECHARGE_FROM_STORE")}
        />
        <RadioOption
          value="RECHARGE_ONLINE"
          label="Recharge online"
          description="Purchase from one of the external partner websites."
          checked={value === "RECHARGE_ONLINE"}
          onChange={() => onChange("RECHARGE_ONLINE")}
        />
        <RadioOption
          value="BITCOIN_DEPOSIT"
          label={
            <span className="inline-flex items-center gap-2">
              <Bitcoin aria-hidden="true" className="size-4" />
              Bitcoin — 50% deposit
            </span>
          }
          description={
            bitcoinAvailable
              ? "50% now, rest cash."
              : "Secure invoice setup pending."
          }
          checked={value === "BITCOIN_DEPOSIT"}
          onChange={() => onChange("BITCOIN_DEPOSIT")}
          disabled={!bitcoinAvailable}
        />
      </RadioGroup>

      {value === "BITCOIN_DEPOSIT" && (
        <InlineAlert
          tone="info"
          title="Pay half to confirm"
          description="Pay 50% of the confirmed order total in Bitcoin. The remaining balance is collected in cash at delivery."
        />
      )}
    </>
  );
}
