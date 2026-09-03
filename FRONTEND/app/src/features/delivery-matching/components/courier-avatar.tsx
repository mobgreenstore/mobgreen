import { cn } from "@/lib/utils";

const PALETTES = [
  ["#EAF2FF", "#2563EB", "#172554"],
  ["#EAF7F1", "#15803D", "#14532D"],
  ["#FFF5E8", "#C2410C", "#7C2D12"],
  ["#F3EEFF", "#7C3AED", "#4C1D95"],
] as const;

function hash(value: string) {
  return [...value].reduce(
    (total, character) => total + character.charCodeAt(0),
    0,
  );
}

export function CourierAvatar({
  seed,
  className,
}: {
  seed: string;
  className?: string;
}) {
  const [surface, accent, ink] = PALETTES[hash(seed) % PALETTES.length]!;

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 64 64"
      className={cn("size-12 shrink-0", className)}
      focusable="false"
    >
      <rect width="64" height="64" rx="18" fill={surface} />
      <path
        d="M20 50c2.1-8.1 7.2-12.2 12-12.2S41.9 41.9 44 50"
        fill={accent}
        opacity="0.92"
      />
      <circle cx="32" cy="25" r="10" fill={accent} />
      <path
        d="M22 23.4c1.4-7 5.1-10.4 10.5-10.4 5.5 0 8.9 3.5 9.7 9.1-3-2.3-6.2-3.4-9.7-3.4-4 0-7.5 1.6-10.5 4.7Z"
        fill={ink}
      />
      <circle cx="28.4" cy="26" r="1.1" fill={surface} />
      <circle cx="35.6" cy="26" r="1.1" fill={surface} />
      <path
        d="M28.8 30.3c1.1 1.1 2.2 1.7 3.3 1.7 1.2 0 2.3-.6 3.3-1.7"
        fill="none"
        stroke={surface}
        strokeLinecap="round"
        strokeWidth="1.4"
      />
    </svg>
  );
}
