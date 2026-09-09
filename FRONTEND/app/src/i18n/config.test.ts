import { describe, expect, it } from "vitest";
import {
  DEFAULT_LOCALE,
  localeFromAcceptLanguage,
  localeFromValue,
} from "@/i18n/config";

describe("storefront locale selection", () => {
  it.each([
    ["fr-CM,fr;q=0.9,en;q=0.8", "fr"],
    ["lv-LV,ru;q=0.8", "lv"],
    ["lt-LT,lt;q=0.9", "lt"],
    ["de-DE,de;q=0.9,en;q=0.8", "de"],
    ["ru-RU,ru;q=0.9", "ru"],
  ] as const)("matches %s to %s", (header, locale) => {
    expect(localeFromAcceptLanguage(header)).toBe(locale);
  });

  it("honours the browser preference order", () => {
    expect(localeFromAcceptLanguage("en;q=0.4, de-DE;q=0.9")).toBe("de");
  });

  it("falls back safely when no supported language is present", () => {
    expect(localeFromAcceptLanguage("es-ES,es;q=0.9")).toBe(DEFAULT_LOCALE);
    expect(localeFromAcceptLanguage(null)).toBe(DEFAULT_LOCALE);
    expect(localeFromValue("pl")).toBe(DEFAULT_LOCALE);
  });
});
