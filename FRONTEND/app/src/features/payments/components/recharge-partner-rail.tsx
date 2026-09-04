import Image from "next/image";
import { RECHARGE_PARTNERS } from "@/config/recharge";
import { cn } from "@/lib/utils";

const additionalPartners = [
  {
    id: "BITREFILL",
    name: "Bitrefill",
    url: "https://www.bitrefill.com/",
    logoSrc: "/images/partners/bitrefill.ico",
  },
  {
    id: "COINSBEE",
    name: "Coinsbee",
    url: "https://www.coinsbee.com/",
    logoSrc: "/images/partners/coinsbee.png",
  },
  {
    id: "OFFGAMERS",
    name: "OffGamers",
    url: "https://off-gamers.com/",
    logoSrc: "/images/partners/offgamers.png",
  },
  {
    id: "G2A",
    name: "G2A",
    url: "https://www.g2a.com/",
    logoSrc: "/images/partners/g2a.ico",
  },
  {
    id: "GAMESEAL",
    name: "Gameseal",
    url: "https://gameseal.com/",
    logoSrc: "/images/partners/gameseal.ico",
  },
] as const;

export const RECHARGE_PARTNER_DIRECTORY = [
  ...RECHARGE_PARTNERS.map((partner) => ({
    ...partner,
    logoSrc: partner.iconUrl,
  })),
  ...additionalPartners,
] as const;

export function RechargePartnerRail({
  className,
  title = "Recharge partners",
  description = "Buy a code, then return here to verify.",
}: {
  className?: string;
  title?: string;
  description?: string;
}) {
  const repeated = [
    ...RECHARGE_PARTNER_DIRECTORY,
    ...RECHARGE_PARTNER_DIRECTORY,
  ];

  return (
    <section
      aria-label={title}
      className={cn(
        "overflow-hidden border-b border-border bg-surface-subtle/45 py-4",
        className,
      )}
    >
      <div className="flex items-baseline justify-between gap-4 px-5 sm:px-8">
        <p className="text-xs font-bold tracking-[0.12em] text-foreground-subtle uppercase">
          {title}
        </p>
        <p className="hidden text-xs text-foreground-muted sm:block">
          {description}
        </p>
      </div>
      <div className="mt-3 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_7%,black_93%,transparent)]">
        <div className="verification-partner-marquee flex w-max items-center gap-1 px-4 focus-within:[animation-play-state:paused] hover:[animation-play-state:paused] motion-reduce:animate-none">
          {repeated.map((partner, index) => (
            <a
              key={`${partner.id}-${index}`}
              href={partner.url}
              target="_blank"
              rel="noreferrer noopener"
              aria-hidden={
                index >= RECHARGE_PARTNER_DIRECTORY.length ? true : undefined
              }
              tabIndex={
                index >= RECHARGE_PARTNER_DIRECTORY.length ? -1 : undefined
              }
              className="flex h-11 shrink-0 items-center gap-2 rounded-md px-3 transition-colors hover:bg-surface focus-visible:ring-2 focus-visible:ring-foreground focus-visible:outline-none"
            >
              <Image
                src={partner.logoSrc}
                width={26}
                height={26}
                alt=""
                sizes="24px"
                className="size-6 object-contain"
              />
              <span className="text-sm font-semibold whitespace-nowrap">
                {partner.name}
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
