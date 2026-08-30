import Link from "next/link";
import { cn } from "@/lib/utils";

interface BrandMarkProps {
  className?: string;
  compact?: boolean;
}

export function BrandMark({ className, compact = false }: BrandMarkProps) {
  return (
    <Link
      href="/"
      className={cn(
        "inline-flex min-h-11 min-w-11 items-center justify-center gap-2.5 rounded-sm font-semibold tracking-[-0.035em]",
        className,
      )}
      aria-label="MOB GREENS home"
    >
      <span
        aria-hidden="true"
        className="grid size-8 place-items-center rounded-md bg-inverse text-xs font-bold text-inverse-foreground"
      >
        MG
      </span>
      {!compact && <span className="text-[0.9375rem]">MOB GREENS</span>}
    </Link>
  );
}
