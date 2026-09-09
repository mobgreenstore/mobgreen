import { useTranslations } from "next-intl";

/**
 * Translation helper that provides fallback to English if translation is missing.
 * This ensures new content added by admins/developers won't break the UI
 * when translations for all languages are not yet available.
 */

/**
 * Get translation with fallback to English if key is missing
 * @param namespace - The translation namespace (e.g., "Common", "Catalog")
 * @param key - The translation key
 * @param params - Optional parameters for interpolation
 * @param fallback - Optional fallback text (defaults to key if not provided)
 * @returns The translated text or fallback
 */
export function useTranslationWithFallback(namespace: string) {
  const t = useTranslations(namespace);
  
  return (key: string, params?: Record<string, string | number>, fallback?: string): string => {
    try {
      const translated = t(key, params);
      if (translated === key && fallback) {
        return fallback;
      }
      return translated;
    } catch (error) {
      return fallback || key;
    }
  };
}

/**
 * Helper to check if a translation key exists
 * Useful for conditional rendering based on translation availability
 */
export function useHasTranslation(namespace: string) {
  const t = useTranslations(namespace);
  
  return (key: string): boolean => {
    try {
      const translated = t(key);
      return translated !== key;
    } catch {
      return false;
    }
  };
}
