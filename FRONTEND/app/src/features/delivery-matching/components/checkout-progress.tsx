import { Check, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const steps = [
  { label: "Details secured", state: "complete" },
  { label: "Payment submitted", state: "current" },
  { label: "Order received", state: "upcoming" },
] as const;

export function CheckoutProgress() {
  return (
    <ol
      aria-label="Order confirmation progress"
      className="grid grid-cols-3 gap-2"
    >
      {steps.map((step, index) => (
        <li
          key={step.label}
          aria-current={step.state === "current" ? "step" : undefined}
        >
          <div
            className={cn(
              "h-1 rounded-full",
              step.state === "upcoming" ? "bg-border" : "bg-info",
            )}
          />
          <div className="mt-2 flex items-start gap-1.5">
            <span
              className={cn(
                "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full",
                step.state === "upcoming"
                  ? "bg-surface-subtle text-foreground-subtle"
                  : "bg-info-subtle text-info",
              )}
            >
              {step.state === "complete" ? (
                <Check
                  aria-hidden="true"
                  className="size-3"
                  strokeWidth={2.5}
                />
              ) : step.state === "current" ? (
                <ShieldCheck aria-hidden="true" className="size-3" />
              ) : (
                <span aria-hidden="true" className="text-[0.625rem] font-bold">
                  {index + 1}
                </span>
              )}
            </span>
            <span
              className={cn(
                "text-[0.6875rem] leading-4 font-semibold sm:text-xs",
                step.state === "upcoming"
                  ? "text-foreground-subtle"
                  : "text-foreground",
              )}
            >
              {step.label}
            </span>
          </div>
        </li>
      ))}
    </ol>
  );
}
