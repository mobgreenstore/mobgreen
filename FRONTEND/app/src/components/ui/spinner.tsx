import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface SpinnerProps {
  label?: string;
  size?: "small" | "default" | "large";
  className?: string;
}

export function Spinner({
  label = "Loading",
  size = "default",
  className,
}: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn(
        "inline-grid place-items-center text-foreground-muted",
        className,
      )}
    >
      <LoaderCircle
        aria-hidden="true"
        className={cn(
          "animate-spin motion-reduce:animate-none",
          size === "small" && "size-4",
          size === "default" && "size-5",
          size === "large" && "size-7",
        )}
      />
    </span>
  );
}
