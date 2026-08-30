import { BadgeCheck, Clock3, ShieldCheck } from "lucide-react";
import { ResponsiveImage } from "@/components/commerce";
import { Badge } from "@/components/ui";
import type { CheckoutConfirmationView } from "@/features/delivery-matching/types";

function methodLabel(intent: CheckoutConfirmationView) {
  if (intent.paymentMethod === "RECHARGE_FROM_STORE")
    return "Recharge from store";
  return intent.rechargeProvider
    ? `Recharge online · ${intent.rechargeProvider}`
    : "Recharge online";
}

export function VerificationHero({
  intent,
}: {
  intent: CheckoutConfirmationView;
}) {
  const image = intent.lines.find((line) => line.image)?.image ?? null;
  return (
    <section className="relative overflow-hidden rounded-xl bg-inverse text-inverse-foreground shadow-sm">
      <div className="grid min-h-[18rem] md:grid-cols-[minmax(0,1.15fr)_minmax(15rem,0.85fr)]">
        <div className="relative z-10 flex flex-col justify-between gap-8 p-6 sm:p-8 lg:p-10">
          <div>
            <Badge className="border-white/15 bg-white/10 text-white">
              Final secure step
            </Badge>
            <h1 className="mt-5 max-w-xl text-4xl leading-[0.98] font-black tracking-[-0.055em] text-balance sm:text-5xl">
              Confirm your recharge. Start your order.
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-6 text-white/70 sm:text-base">
              Submit the numeric code you received. MOB GREENS will review it
              before your order moves into processing.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-3 text-xs font-semibold text-white/75 sm:text-sm">
            <span className="inline-flex items-center gap-2">
              <ShieldCheck
                aria-hidden="true"
                className="size-4 text-blue-300"
              />
              Encrypted before storage
            </span>
            <span className="inline-flex items-center gap-2">
              <Clock3 aria-hidden="true" className="size-4 text-blue-300" />
              Administrator review required
            </span>
            <span className="inline-flex items-center gap-2">
              <BadgeCheck aria-hidden="true" className="size-4 text-blue-300" />
              {methodLabel(intent)}
            </span>
          </div>
        </div>
        <div className="relative min-h-56 md:min-h-full">
          <ResponsiveImage
            image={image}
            sizes="(max-width: 767px) 100vw, 38vw"
            priority
            aspect="landscape"
            className="absolute inset-0 h-full w-full rounded-none"
            imageClassName="object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent md:bg-gradient-to-r md:from-black/55 md:to-transparent" />
          <div className="absolute right-4 bottom-4 left-4 rounded-lg border border-white/15 bg-black/45 p-3 backdrop-blur-md">
            <p className="text-xs font-semibold text-white/65">Order for</p>
            <p className="mt-1 truncate text-sm font-bold text-white">
              {intent.customer.name}
            </p>
            <p className="mt-0.5 truncate text-xs text-white/65">
              {intent.itemCount} item{intent.itemCount === 1 ? "" : "s"} ·{" "}
              {intent.fulfillmentType.toLowerCase()}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
