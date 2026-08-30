import { StatusBadge, type Status } from "@/components/ui/status-badge";

export interface OrderStatusEventViewModel {
  id: string;
  status: Status;
  occurredAt: Date | string;
  note?: string;
}

export function OrderStatusTimeline({
  events,
  locale = "en",
}: {
  events: readonly OrderStatusEventViewModel[];
  locale?: string;
}) {
  if (!events.length)
    return (
      <p className="text-sm text-foreground-muted">
        No status history is available.
      </p>
    );
  const formatter = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  });
  return (
    <ol className="grid gap-0" aria-label="Order status history">
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
              <StatusBadge status={event.status} />
              <time
                dateTime={new Date(event.occurredAt).toISOString()}
                className="text-xs text-foreground-muted"
              >
                {formatter.format(new Date(event.occurredAt))}
              </time>
            </div>
            {event.note && (
              <p className="mt-2 text-sm leading-6 text-foreground-muted">
                {event.note}
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
