import Image from "next/image";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface RechargePartnerCardProps {
  name: string;
  url: string;
  iconUrl: string;
  className?: string;
  selected?: boolean;
  onSelect?: () => void;
}

export function RechargePartnerCard({
  name,
  url,
  iconUrl,
  className,
  selected = false,
  onSelect,
}: RechargePartnerCardProps) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Open ${name} in a new tab`}
      aria-current={selected ? "true" : undefined}
      onClick={onSelect}
      className={cn(
        "group grid min-h-32 overflow-hidden rounded-xl border border-border bg-surface shadow-xs transition-[border-color,transform,box-shadow] hover:-translate-y-0.5 hover:border-border-strong hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground motion-reduce:transform-none motion-reduce:transition-none",
        selected && "border-foreground ring-1 ring-foreground",
        className,
      )}
    >
      <span className="grid min-h-20 place-items-center bg-surface-subtle px-4 py-3">
        <Image
          src={iconUrl}
          alt=""
          width={64}
          height={64}
          unoptimized
          className="size-12 rounded-xl object-contain shadow-xs sm:size-14"
        />
      </span>
      <span className="flex min-h-12 items-center justify-between gap-2 px-3 py-2.5">
        <span className="min-w-0 truncate text-sm font-semibold tracking-[-0.015em]">
          {name}
        </span>
        <ExternalLink
          aria-hidden="true"
          className="size-4 shrink-0 text-foreground-subtle transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transform-none"
          strokeWidth={1.8}
        />
      </span>
    </a>
  );
}
