import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function CatalogLoading({ className }: { className?: string }) {
  return (
    <div className={cn("flex min-h-[20rem] flex-col items-center justify-center", className)}>
      <Loader2 
        aria-hidden="true" 
        className="size-8 animate-spin text-foreground-muted" 
        strokeWidth={1.8}
      />
      <p className="mt-4 text-sm font-medium text-foreground-muted">
        Loading products...
      </p>
    </div>
  );
}
