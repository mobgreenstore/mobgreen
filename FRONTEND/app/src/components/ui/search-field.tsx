import { Search } from "lucide-react";
import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface SearchFieldProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
> {
  label: string;
}

export function SearchField({ label, className, ...props }: SearchFieldProps) {
  return (
    <label className={cn("relative block", className)}>
      <span className="sr-only">{label}</span>
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-foreground-muted"
        strokeWidth={1.8}
      />
      <input
        type="search"
        className="h-12 w-full rounded-md border border-border bg-surface pr-4 pl-11 text-base text-foreground shadow-xs transition-colors placeholder:text-foreground-subtle hover:border-border-strong focus:border-foreground focus:outline-none"
        {...props}
      />
    </label>
  );
}
