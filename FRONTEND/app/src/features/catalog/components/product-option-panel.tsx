"use client";

import { LoaderCircle, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { Money } from "@/components/commerce/money";
import { WeightPriceSelector } from "@/components/commerce/weight-price-selector";
import { Badge, Button, Card } from "@/components/ui";
import { useCart } from "@/features/cart/cart-provider";
import type { CatalogProductDetailViewModel } from "@/features/catalog/types";

export function ProductOptionPanel({
  productId,
  options,
}: {
  productId: string;
  options: CatalogProductDetailViewModel["priceOptions"];
}) {
  const { addItem } = useCart();
  const [selectedId, setSelectedId] = useState(options[0]?.id);
  const [pending, setPending] = useState(false);
  const selected =
    options.find((option) => option.id === selectedId) ?? options[0];

  if (!selected) {
    return (
      <Card className="p-5">
        <p className="text-sm text-foreground-muted">
          This product is currently unavailable.
        </p>
      </Card>
    );
  }

  const addSelected = async () => {
    setPending(true);
    try {
      await addItem(productId, selected.id);
    } finally {
      setPending(false);
    }
  };

  return (
    <Card className="grid gap-5 p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.1em] text-foreground-subtle uppercase">
            Selected price
          </p>
          <Money
            amountMinor={selected.priceMinor}
            currency={selected.currency}
            className="mt-1 block font-mono text-2xl font-semibold tracking-[-0.03em]"
          />
        </div>
        <Badge tone="success">Available</Badge>
      </div>
      <WeightPriceSelector
        options={options}
        selectedId={selected.id}
        onSelectionChange={setSelectedId}
      />
      <Button
        size="large"
        className="w-full"
        disabled={pending}
        onClick={addSelected}
      >
        {pending ? (
          <LoaderCircle
            aria-hidden="true"
            className="size-4 animate-spin motion-reduce:animate-none"
          />
        ) : (
          <ShoppingBag aria-hidden="true" className="size-4" />
        )}
        {pending ? "Confirming availability…" : "Add to cart"}
      </Button>
      <p className="text-xs leading-5 text-foreground-muted">
        The store confirms the current price and availability before this item
        is saved. Prices stay in their original currency.
      </p>
    </Card>
  );
}
