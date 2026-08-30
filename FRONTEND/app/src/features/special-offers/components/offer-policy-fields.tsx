"use client";

import { BadgePercent } from "lucide-react";
import {
  FieldDescription,
  FormField,
  Label,
  Switch,
  TextField,
} from "@/components/ui";
import { DEFAULT_CATEGORY_OFFER_POLICY } from "@/features/special-offers/contract";

export function OfferPolicyFields() {
  const policy = DEFAULT_CATEGORY_OFFER_POLICY;
  return (
    <section className="grid gap-5 border-t border-border pt-5">
      <input type="hidden" name="offerPolicyPresent" value="true" />
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-surface-subtle">
          <BadgePercent aria-hidden="true" className="size-4" />
        </span>
        <div>
          <h2 className="text-base font-semibold tracking-[-0.02em]">
            Special offers
          </h2>
          <p className="mt-1 text-sm leading-6 text-foreground-muted">
            Start with safe defaults. Product costs and campaign preview become
            available after the category is created.
          </p>
        </div>
      </div>
      <Switch
        name="offerEnabled"
        defaultChecked={false}
        label="Activate special-offer generation"
        description="This enables the policy only. No offer is published automatically."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="offerMinimumWeightGrams" hasDescription>
          <Label required>Minimum weight (g)</Label>
          <TextField
            name="offerMinimumWeightGrams"
            type="number"
            min="80"
            max="99999"
            defaultValue={policy.minimumWeightGrams}
            required
          />
          <FieldDescription>
            Offers start at 80 grams or above.
          </FieldDescription>
        </FormField>
        <FormField id="offerMaximumWeightGrams" hasDescription>
          <Label required>Maximum weight (g)</Label>
          <TextField
            name="offerMaximumWeightGrams"
            type="number"
            min="81"
            max="100000"
            defaultValue={policy.maximumWeightGrams}
            required
          />
          <FieldDescription>Default: 1 kilogram.</FieldDescription>
        </FormField>
        <FormField id="offerMinimumDiscountBps" hasDescription>
          <Label required>Starting discount (bps)</Label>
          <TextField
            name="offerMinimumDiscountBps"
            type="number"
            min="1"
            max="1500"
            defaultValue={policy.minimumDiscountBps}
            required
          />
          <FieldDescription>300 equals 3%.</FieldDescription>
        </FormField>
        <FormField id="offerMaximumDiscountBps" hasDescription>
          <Label required>Maximum discount (bps)</Label>
          <TextField
            name="offerMaximumDiscountBps"
            type="number"
            min="1"
            max="1500"
            defaultValue={policy.maximumDiscountBps}
            required
          />
          <FieldDescription>Hard limit: 15%.</FieldDescription>
        </FormField>
        <FormField id="offerMinimumMarginBps" hasDescription>
          <Label required>Protected margin (bps)</Label>
          <TextField
            name="offerMinimumMarginBps"
            type="number"
            min="0"
            max="10000"
            defaultValue={policy.minimumMarginBps}
            required
          />
          <FieldDescription>Default: 15% over cost.</FieldDescription>
        </FormField>
        <FormField id="offerDurationMinutes" hasDescription>
          <Label required>Duration (minutes)</Label>
          <TextField
            name="offerDurationMinutes"
            type="number"
            min="60"
            max="1440"
            defaultValue={policy.durationMinutes}
            required
          />
          <FieldDescription>Maximum 24 hours.</FieldDescription>
        </FormField>
        <FormField id="offerMaxOffersPerPriceOption" hasDescription>
          <Label required>Offer tiers per option</Label>
          <TextField
            name="offerMaxOffersPerPriceOption"
            type="number"
            min="1"
            max="4"
            defaultValue={policy.maxOffersPerPriceOption}
            required
          />
          <FieldDescription>Between one and four.</FieldDescription>
        </FormField>
      </div>
    </section>
  );
}
