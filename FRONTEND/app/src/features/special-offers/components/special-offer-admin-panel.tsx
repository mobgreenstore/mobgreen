"use client";

import { useActionState, useState, useTransition } from "react";
import {
  BadgePercent,
  CircleDollarSign,
  Clock3,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { ConfirmationDialog } from "@/components/admin";
import { Money } from "@/components/commerce/money";
import {
  Badge,
  Button,
  Card,
  FieldDescription,
  FieldError,
  FormField,
  InlineAlert,
  Label,
  Switch,
  TextField,
} from "@/components/ui";
import {
  initialSpecialOfferActionState,
  type SpecialOfferActionState,
} from "@/features/special-offers/server/action-state";
import {
  activateCampaignAction,
  cancelCampaignAction,
  previewCampaignAction,
  regenerateCampaignAction,
  saveCampaignDraftAction,
  saveOfferPolicyAction,
  savePriceOptionCostAction,
} from "@/features/special-offers/server/actions";
import { OFFER_EXCLUSION_LABELS } from "@/features/special-offers/exclusions";

type Currency = "GBP" | "EUR" | "USD";

export interface OfferAdminModel {
  id: string;
  policy: {
    enabled: boolean;
    minimumWeightGrams: number;
    maximumWeightGrams: number;
    minimumDiscountBps: number;
    maximumDiscountBps: number;
    minimumMarginBps: number;
    durationMinutes: number;
    maxOffersPerPriceOption: number;
  };
  products: Array<{
    id: string;
    name: string;
    status: string;
    priceOptions: Array<{
      id: string;
      weightValue: string;
      weightUnit: "G" | "KG";
      currency: Currency;
      priceMinor: string;
      costMinor: string | null;
      isActive: boolean;
    }>;
  }>;
  campaigns: Array<{
    generationKey: string;
    status: "DRAFT" | "ACTIVE" | "EXPIRED" | "CANCELLED";
    startsAt: string;
    endsAt: string;
    offers: Array<{
      publicId: string;
      productName: string;
      discountBps: number;
      bundleQuantity: number;
      totalWeightGrams: string;
      currency: Currency;
      originalTotalMinor: string;
      offerTotalMinor: string;
    }>;
  }>;
}

function majorAmount(minor: string | null) {
  if (!minor) return "";
  const value = BigInt(minor);
  return `${value / 100n}.${(value % 100n).toString().padStart(2, "0")}`;
}

export function OfferCostForm({
  categoryId,
  option,
}: {
  categoryId: string;
  option: OfferAdminModel["products"][number]["priceOptions"][number];
}) {
  const action = savePriceOptionCostAction.bind(null, categoryId, option.id);
  const [state, formAction, pending] = useActionState(
    action,
    initialSpecialOfferActionState,
  );
  return (
    <form action={formAction} className="grid gap-2 sm:grid-cols-[1fr_auto]">
      <FormField id={`cost-${option.id}`} hasDescription>
        <Label optional>Unit cost ({option.currency})</Label>
        <TextField
          name="costMajor"
          type="number"
          min="0.01"
          step="0.01"
          inputMode="decimal"
          defaultValue={majorAmount(option.costMinor)}
          placeholder="Not configured"
        />
        <FieldDescription>
          Selling price:{" "}
          <Money
            amountMinor={Number(option.priceMinor)}
            currency={option.currency}
          />
        </FieldDescription>
      </FormField>
      <Button
        type="submit"
        variant="secondary"
        size="small"
        disabled={pending}
        className="self-end"
      >
        {pending ? "Saving…" : "Save cost"}
      </Button>
      {state.message && (
        <p
          className={`text-xs sm:col-span-2 ${state.status === "error" ? "text-danger" : "text-success"}`}
          aria-live="polite"
        >
          {state.message}
        </p>
      )}
    </form>
  );
}

function statusTone(status: OfferAdminModel["campaigns"][number]["status"]) {
  if (status === "ACTIVE") return "success" as const;
  if (status === "CANCELLED") return "danger" as const;
  if (status === "DRAFT") return "info" as const;
  return "neutral" as const;
}

export function SpecialOfferAdminPanel({ model }: { model: OfferAdminModel }) {
  const policyAction = saveOfferPolicyAction.bind(null, model.id);
  const [policyState, policyFormAction, policyPending] = useActionState(
    policyAction,
    initialSpecialOfferActionState,
  );
  const [preview, setPreview] = useState<SpecialOfferActionState["preview"]>();
  const [feedback, setFeedback] = useState<SpecialOfferActionState>();
  const [working, startTransition] = useTransition();
  const optionNames = new Map(
    model.products.flatMap((product) =>
      product.priceOptions.map((option) => [
        option.id,
        `${product.name} · ${option.weightValue}${option.weightUnit.toLowerCase()} · ${option.currency}`,
      ]),
    ),
  );

  function run(operation: () => Promise<SpecialOfferActionState>) {
    startTransition(async () => {
      const result = await operation();
      setFeedback(result);
      if (result.preview) setPreview(result.preview);
    });
  }

  return (
    <section
      className="mt-6 grid gap-6"
      aria-labelledby="special-offers-heading"
    >
      <div>
        <div className="flex items-center gap-2">
          <BadgePercent aria-hidden="true" className="size-5" />
          <h2
            id="special-offers-heading"
            className="text-xl font-bold tracking-[-0.03em]"
          >
            Special offers
          </h2>
        </div>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-foreground-muted">
          Configure safe bulk discounts. Preview calculations never publish;
          activation always needs confirmation.
        </p>
      </div>

      <form action={policyFormAction}>
        <Card className="grid gap-5 p-5 sm:p-7">
          <Switch
            name="enabled"
            defaultChecked={model.policy.enabled}
            label="Enable generated offers for this category"
            description="Only active products with a real cost below their selling price qualify."
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <FormField id="minimumWeightGrams" hasDescription>
              <Label required>Starts at (g)</Label>
              <TextField
                name="minimumWeightGrams"
                type="number"
                min="80"
                max="99999"
                defaultValue={model.policy.minimumWeightGrams}
                required
              />
              <FieldDescription>Minimum 80 grams.</FieldDescription>
              <FieldError>
                {policyState.fieldErrors?.minimumWeightGrams?.[0]}
              </FieldError>
            </FormField>
            <FormField id="maximumWeightGrams" hasDescription>
              <Label required>Ends at (g)</Label>
              <TextField
                name="maximumWeightGrams"
                type="number"
                min="81"
                max="100000"
                defaultValue={model.policy.maximumWeightGrams}
                required
              />
              <FieldDescription>Maximum 100 kg.</FieldDescription>
              <FieldError>
                {policyState.fieldErrors?.maximumWeightGrams?.[0]}
              </FieldError>
            </FormField>
            <FormField id="minimumDiscountBps" hasDescription>
              <Label required>Starting discount (bps)</Label>
              <TextField
                name="minimumDiscountBps"
                type="number"
                min="1"
                max="1500"
                defaultValue={model.policy.minimumDiscountBps}
                required
              />
              <FieldDescription>300 equals 3%.</FieldDescription>
            </FormField>
            <FormField id="maximumDiscountBps" hasDescription>
              <Label required>Maximum discount (bps)</Label>
              <TextField
                name="maximumDiscountBps"
                type="number"
                min="1"
                max="1500"
                defaultValue={model.policy.maximumDiscountBps}
                required
              />
              <FieldDescription>Never above 1500 / 15%.</FieldDescription>
            </FormField>
            <FormField id="minimumMarginBps" hasDescription>
              <Label required>Protected margin (bps)</Label>
              <TextField
                name="minimumMarginBps"
                type="number"
                min="0"
                max="10000"
                defaultValue={model.policy.minimumMarginBps}
                required
              />
              <FieldDescription>Applied over unit cost.</FieldDescription>
            </FormField>
            <FormField id="durationMinutes" hasDescription>
              <Label required>Duration (minutes)</Label>
              <TextField
                name="durationMinutes"
                type="number"
                min="60"
                max="1440"
                defaultValue={model.policy.durationMinutes}
                required
              />
              <FieldDescription>Between 1 and 24 hours.</FieldDescription>
            </FormField>
            <FormField id="maxOffersPerPriceOption" hasDescription>
              <Label required>Offer tiers per option</Label>
              <TextField
                name="maxOffersPerPriceOption"
                type="number"
                min="1"
                max="4"
                defaultValue={model.policy.maxOffersPerPriceOption}
                required
              />
              <FieldDescription>Maximum four.</FieldDescription>
            </FormField>
          </div>
          {policyState.message && (
            <InlineAlert
              tone={policyState.status === "error" ? "danger" : "success"}
              title={
                policyState.status === "error"
                  ? "Policy not saved"
                  : "Policy saved"
              }
              description={policyState.message}
            />
          )}
          <div className="flex justify-end">
            <Button type="submit" disabled={policyPending}>
              <ShieldCheck aria-hidden="true" className="size-4" />
              {policyPending ? "Saving policy…" : "Save offer policy"}
            </Button>
          </div>
        </Card>
      </form>

      <Card className="grid gap-5 p-5 sm:p-7">
        <div>
          <h3 className="font-semibold">Profit inputs</h3>
          <p className="mt-1 text-sm text-foreground-muted">
            Costs remain private and are used only to protect profitability.
          </p>
        </div>
        {model.products.length ? (
          <div className="grid gap-5">
            {model.products.map((product) => (
              <section
                key={product.id}
                className="grid gap-3 rounded-lg bg-surface-subtle p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <h4 className="font-semibold">{product.name}</h4>
                  <Badge
                    tone={product.status === "ACTIVE" ? "success" : "neutral"}
                  >
                    {product.status.toLowerCase()}
                  </Badge>
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  {product.priceOptions.map((option) => (
                    <OfferCostForm
                      key={option.id}
                      categoryId={model.id}
                      option={option}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <p className="rounded-lg bg-surface-subtle p-5 text-sm text-foreground-muted">
            Create products and price options before generating offers.
          </p>
        )}
      </Card>

      <Card className="grid gap-5 p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="font-semibold">Safe campaign preview</h3>
            <p className="mt-1 text-sm text-foreground-muted">
              Calculations use current database prices, costs and policy.
            </p>
          </div>
          <Button
            disabled={working}
            onClick={() => run(() => previewCampaignAction(model.id))}
          >
            <Sparkles aria-hidden="true" className="size-4" />
            {working ? "Calculating…" : "Generate preview"}
          </Button>
        </div>
        {feedback?.message && (
          <InlineAlert
            tone={feedback.status === "error" ? "danger" : "success"}
            title={
              feedback.status === "error"
                ? "Offer action failed"
                : "Offer action complete"
            }
            description={feedback.message}
          />
        )}
        {preview && (
          <div className="grid gap-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {preview.offers.map((offer) => (
                <article
                  key={offer.publicId}
                  className="rounded-lg border border-border p-4"
                >
                  <p className="text-xs font-semibold text-foreground-muted">
                    {optionNames.get(offer.priceOptionId) ?? "Price option"}
                  </p>
                  <p className="mt-2 text-3xl font-black tracking-[-0.05em]">
                    {(offer.discountBps / 100).toFixed(0)}% off
                  </p>
                  <p className="mt-2 text-sm">
                    {offer.totalWeightGrams}g · {offer.bundleQuantity} units
                  </p>
                  <p className="mt-1 font-semibold">
                    <Money
                      amountMinor={Number(offer.offerTotalMinor)}
                      currency={offer.currency}
                    />
                  </p>
                </article>
              ))}
            </div>
            {preview.exclusions.length > 0 && (
              <div className="rounded-lg bg-surface-subtle p-4">
                <p className="text-sm font-semibold">Excluded options</p>
                <ul className="mt-2 grid gap-1 text-sm text-foreground-muted">
                  {preview.exclusions.map((item, index) => (
                    <li
                      key={`${item.priceOptionId}-${item.bundleQuantity ?? "option"}-${index}`}
                    >
                      {optionNames.get(item.priceOptionId) ?? "Price option"}:{" "}
                      {OFFER_EXCLUSION_LABELS[
                        item.code as keyof typeof OFFER_EXCLUSION_LABELS
                      ] ?? item.code}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {preview.offers.length > 0 && (
              <div className="flex justify-end">
                <ConfirmationDialog
                  trigger={
                    <Button disabled={working}>Save campaign draft</Button>
                  }
                  title="Save this campaign draft?"
                  description="The offers remain invisible to customers until you activate the campaign."
                  confirmLabel="Save draft"
                  pending={working}
                  onConfirm={() =>
                    run(() =>
                      saveCampaignDraftAction(model.id, preview.generationKey),
                    )
                  }
                />
              </div>
            )}
          </div>
        )}
      </Card>

      <Card className="grid gap-5 p-5 sm:p-7">
        <div>
          <h3 className="font-semibold">Campaign history</h3>
          <p className="mt-1 text-sm text-foreground-muted">
            Manage drafts and live campaigns without resetting customer timers.
          </p>
        </div>
        {model.campaigns.length ? (
          <div className="grid gap-3">
            {model.campaigns.map((campaign) => (
              <article
                key={campaign.generationKey}
                className="rounded-lg border border-border p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge tone={statusTone(campaign.status)}>
                        {campaign.status.toLowerCase()}
                      </Badge>
                      <span className="text-xs text-foreground-muted">
                        {campaign.offers.length} offers
                      </span>
                    </div>
                    <p className="mt-2 flex items-center gap-1.5 text-sm text-foreground-muted">
                      <Clock3 aria-hidden="true" className="size-4" /> Ends{" "}
                      {new Date(campaign.endsAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {campaign.status === "DRAFT" && (
                      <ConfirmationDialog
                        trigger={
                          <Button size="small" disabled={working}>
                            Activate
                          </Button>
                        }
                        title="Activate this campaign?"
                        description="Customers will immediately see every non-expired offer in this campaign."
                        confirmLabel="Activate offers"
                        pending={working}
                        onConfirm={() =>
                          run(() =>
                            activateCampaignAction(
                              model.id,
                              campaign.generationKey,
                            ),
                          )
                        }
                      />
                    )}
                    {(campaign.status === "DRAFT" ||
                      campaign.status === "ACTIVE") && (
                      <ConfirmationDialog
                        destructive
                        trigger={
                          <Button
                            variant="secondary"
                            size="small"
                            disabled={working}
                          >
                            Cancel
                          </Button>
                        }
                        title="Cancel this campaign?"
                        description="Its offers will stop appearing in the storefront immediately."
                        confirmLabel="Cancel campaign"
                        pending={working}
                        onConfirm={() =>
                          run(() =>
                            cancelCampaignAction(
                              model.id,
                              campaign.generationKey,
                            ),
                          )
                        }
                      />
                    )}
                    <Button
                      variant="secondary"
                      size="small"
                      disabled={working}
                      onClick={() =>
                        run(() =>
                          regenerateCampaignAction(
                            model.id,
                            campaign.generationKey,
                          ),
                        )
                      }
                    >
                      <RefreshCw aria-hidden="true" className="size-4" />{" "}
                      Regenerate
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-lg bg-surface-subtle p-5 text-sm text-foreground-muted">
            <CircleDollarSign aria-hidden="true" className="size-5" /> No
            campaigns have been generated.
          </div>
        )}
      </Card>
    </section>
  );
}
