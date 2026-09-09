export const SUPPORTED_LOCALES = ["en", "fr", "lv", "lt", "de", "ru"] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: SupportedLocale = "en";
export const STOREFRONT_LOCALE_COOKIE = "mob-greens-locale";
export const STOREFRONT_LOCALE_HEADER = "x-mob-greens-locale";

export const LOCALE_OPTIONS: ReadonlyArray<{
  code: SupportedLocale;
  label: string;
}> = [
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "lv", label: "Latviešu" },
  { code: "lt", label: "Lietuvių" },
  { code: "de", label: "Deutsch" },
  { code: "ru", label: "Русский" },
];

export function isSupportedLocale(
  value: string | null | undefined,
): value is SupportedLocale {
  return Boolean(value) && SUPPORTED_LOCALES.includes(value as SupportedLocale);
}

function preferredLanguages(acceptLanguage: string | null) {
  if (!acceptLanguage) return [];

  return acceptLanguage
    .split(",")
    .map((part, index) => {
      const [language = "", ...parameters] = part.trim().split(";");
      const quality = parameters.find((parameter) =>
        parameter.trim().startsWith("q="),
      );
      const priority = quality ? Number(quality.trim().slice(2)) : 1;

      return {
        language: language.toLowerCase(),
        priority: Number.isFinite(priority) ? priority : 0,
        index,
      };
    })
    .filter(({ language }) => language.length > 0)
    .sort(
      (left, right) =>
        right.priority - left.priority || left.index - right.index,
    )
    .map(({ language }) => language);
}

export function localeFromAcceptLanguage(
  acceptLanguage: string | null,
): SupportedLocale {
  for (const language of preferredLanguages(acceptLanguage)) {
    const primaryLanguage = language.split(/[-_]/)[0];
    if (isSupportedLocale(primaryLanguage)) return primaryLanguage;
  }

  return DEFAULT_LOCALE;
}

export function localeFromValue(
  value: string | null | undefined,
): SupportedLocale {
  return isSupportedLocale(value) ? value : DEFAULT_LOCALE;
}
