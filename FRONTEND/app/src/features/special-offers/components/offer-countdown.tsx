"use client";

import { useEffect, useState } from "react";

function remainingLabel(endsAt: string, now: number) {
  const remaining = Math.max(0, new Date(endsAt).getTime() - now);
  if (remaining === 0) return "Ended";
  const totalMinutes = Math.ceil(remaining / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}h ${minutes}m left` : `${minutes}m left`;
}

export function OfferCountdown({ endsAt }: { endsAt: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  return (
    <span
      suppressHydrationWarning
      aria-label={`Offer ${remainingLabel(endsAt, now)}`}
    >
      {remainingLabel(endsAt, now)}
    </span>
  );
}
