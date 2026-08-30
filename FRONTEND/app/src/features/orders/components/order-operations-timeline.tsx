import {
  OrderStatusBadge,
  PaymentStatusBadge,
} from "@/features/orders/components/status-badges";
import type { AdminOrderDetail } from "@/features/orders/types";

export function OrderOperationsTimeline({
  events,
}: {
  events: AdminOrderDetail["timeline"];
}) {
  if (!events.length) {
    return (
      <p className="text-sm text-foreground-muted">No history recorded.</p>
    );
  }
  const formatter = new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  return (
    <ol className="grid" aria-label="Order and payment history">
      {events.map((event, index) => (
        <li
          key={event.id}
          className="relative grid grid-cols-[1.25rem_1fr] gap-3 pb-6 last:pb-0"
        >
          {index < events.length - 1 && (
            <span
              aria-hidden="true"
              className="absolute top-5 bottom-0 left-[0.59375rem] w-px bg-border"
            />
          )}
          <span
            aria-hidden="true"
            className="relative z-10 mt-1 size-5 rounded-full border-4 border-surface bg-foreground"
          />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              {event.kind === "ORDER" ? (
                <OrderStatusBadge
                  status={event.toStatus as AdminOrderDetail["status"]}
                />
              ) : (
                <PaymentStatusBadge
                  status={event.toStatus as AdminOrderDetail["paymentStatus"]}
                />
              )}
              <span className="text-xs font-semibold text-foreground-subtle">
                {event.kind === "ORDER" ? "Order" : "Payment"}
              </span>
              <time className="text-xs text-foreground-muted">
                {formatter.format(new Date(event.occurredAt))}
              </time>
            </div>
            {event.note && (
              <p className="mt-2 text-sm leading-6 text-foreground-muted">
                {event.note}
              </p>
            )}
            {event.changedBy && (
              <p className="mt-1 text-xs text-foreground-subtle">
                Changed by {event.changedBy}
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
