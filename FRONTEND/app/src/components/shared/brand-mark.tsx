import Image from "next/image";
import Link from "next/link";
import { brandLogoSrc } from "@/config/brand";
import { cn } from "@/lib/utils";

export function BrandLogo({
  alt = "",
  className,
  priority = false,
  sizes = "48px",
}: {
  alt?: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
}) {
  return (
    <Image
      src={brandLogoSrc}
      alt={alt}
      width={96}
      height={96}
      priority={priority}
      sizes={sizes}
      className={cn("object-cover", className)}
    />
  );
}

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
        className="relative grid size-8 shrink-0 place-items-center overflow-hidden rounded-md bg-inverse"
      >
        <BrandLogo priority sizes="32px" className="size-full" />
      </span>
      {!compact && <span className="text-[0.9375rem]">MOB GREENS</span>}
    </Link>
  );
}
