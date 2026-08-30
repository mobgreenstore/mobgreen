"use client";

import { useEffect, useState } from "react";
import { Clock3 } from "lucide-react";

function timeLeft(endsAt: string, now: number) {
  const milliseconds = Math.max(0, new Date(endsAt).getTime() - now);
  const minutes = Math.ceil(milliseconds / 60_000);
  if (minutes <= 0) return null;
  const hours = Math.floor(minutes / 60);
  return hours ? `${hours}h ${minutes % 60}m left` : `${minutes}m left`;
}

export function CategoryOfferBranding({
  discountBps,
  totalWeightGrams,
  endsAt,
}: {
  discountBps: number;
  totalWeightGrams: string;
  endsAt: string;
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  const remaining = timeLeft(endsAt, now);
  if (!remaining) return null;
  const discount = discountBps / 100;
  return (
    <div className="mb-4" aria-label={`${discount}% special offer`}>
      <p className="text-xs font-bold tracking-[0.16em] uppercase opacity-90">
        Special offer
      </p>
      <p className="mt-1 text-[3.65rem] leading-[0.82] font-black tracking-[-0.08em] sm:text-[4.4rem]">
        {Number.isInteger(discount) ? discount : discount.toFixed(1)}%
        <span className="ml-2 text-xl tracking-[-0.04em] sm:text-2xl">off</span>
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold">
        <span>From {totalWeightGrams}g</span>
        <span className="inline-flex items-center gap-1.5">
          <Clock3 aria-hidden="true" className="size-3.5" /> {remaining}
        </span>
      </div>
    </div>
  );
}
