export const CATEGORY_DISPLAY_TONES = [
  "LIGHT",
  "MIST",
  "STONE",
  "CHARCOAL",
  "INK",
] as const;

export type CategoryDisplayTone = (typeof CATEGORY_DISPLAY_TONES)[number];

export interface CategoryDisplayToneOption {
  value: CategoryDisplayTone;
  label: string;
  description: string;
  surfaceClassName: string;
  surfaceColor: string;
  foregroundColor: string;
  mutedClassName: string;
}

export const CATEGORY_DISPLAY_TONE_OPTIONS: readonly CategoryDisplayToneOption[] =
  [
    {
      value: "LIGHT",
      label: "Light",
      description: "Clean white surface with dark text.",
      surfaceClassName: "border-black/10 bg-white text-[#121212]",
      surfaceColor: "#ffffff",
      foregroundColor: "#121212",
      mutedClassName: "text-[#5f5f5b]",
    },
    {
      value: "MIST",
      label: "Mist",
      description: "Soft off-white surface with dark text.",
      surfaceClassName: "border-black/10 bg-[#ececea] text-[#121212]",
      surfaceColor: "#ececea",
      foregroundColor: "#121212",
      mutedClassName: "text-[#5f5f5b]",
    },
    {
      value: "STONE",
      label: "Stone",
      description: "Warm grey surface with dark text.",
      surfaceClassName: "border-black/10 bg-[#cfcdc8] text-[#121212]",
      surfaceColor: "#cfcdc8",
      foregroundColor: "#121212",
      mutedClassName: "text-[#52514e]",
    },
    {
      value: "CHARCOAL",
      label: "Charcoal",
      description: "Deep grey surface with light text.",
      surfaceClassName: "border-white/15 bg-[#343432] text-white",
      surfaceColor: "#343432",
      foregroundColor: "#ffffff",
      mutedClassName: "text-white/72",
    },
    {
      value: "INK",
      label: "Ink",
      description: "Black surface with crisp white text.",
      surfaceClassName: "border-white/15 bg-[#121212] text-white",
      surfaceColor: "#121212",
      foregroundColor: "#ffffff",
      mutedClassName: "text-white/72",
    },
  ];

export function getCategoryDisplayTone(tone: CategoryDisplayTone) {
  return (
    CATEGORY_DISPLAY_TONE_OPTIONS.find((option) => option.value === tone) ??
    CATEGORY_DISPLAY_TONE_OPTIONS[1]!
  );
}
