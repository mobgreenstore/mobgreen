import { Clock3, MapPin, UserRound } from "lucide-react";
import { Card } from "@/components/ui";
import { cn } from "@/lib/utils";

export interface CourierAssignmentView {
  displayName: string;
  distanceMeters: number;
  estimatedDurationSeconds: number;
  simulated: true;
}

function distanceLabel(distanceMeters: number) {
  return distanceMeters < 1_000
    ? `${distanceMeters} m`
    : `${(distanceMeters / 1_000).toFixed(1)} km`;
}

function durationLabel(durationSeconds: number) {
  return `${Math.max(1, Math.ceil(durationSeconds / 60))} min`;
}

export function CourierAssignmentCard({
  courier,
  className,
}: {
  courier: CourierAssignmentView;
  className?: string;
}) {
  return (
    <Card className={cn("p-4 sm:p-5", className)}>
      <div className="flex items-center gap-3">
        <div className="grid size-11 shrink-0 place-items-center rounded-full bg-info-subtle text-info">
          <UserRound aria-hidden="true" className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-[0.08em] text-foreground-subtle uppercase">
            Simulated delivery assignment
          </p>
          <p className="mt-1 truncate font-semibold">{courier.displayName}</p>
        </div>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg bg-surface-subtle p-3">
          <dt className="flex items-center gap-1.5 text-xs text-foreground-muted">
            <MapPin aria-hidden="true" className="size-3.5" />
            Matched distance
          </dt>
          <dd className="mt-1 font-semibold">
            {distanceLabel(courier.distanceMeters)}
          </dd>
        </div>
        <div className="rounded-lg bg-surface-subtle p-3">
          <dt className="flex items-center gap-1.5 text-xs text-foreground-muted">
            <Clock3 aria-hidden="true" className="size-3.5" />
            Estimated time
          </dt>
          <dd className="mt-1 font-semibold">
            {durationLabel(courier.estimatedDurationSeconds)}
          </dd>
        </div>
      </dl>
      <p className="mt-3 text-xs leading-5 text-foreground-subtle">
        This is the checkout simulation snapshot. Live route tracking is shown
        separately only after administrator dispatch.
      </p>
    </Card>
  );
}
