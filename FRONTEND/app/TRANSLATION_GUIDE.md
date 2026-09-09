# Translation Guide for MOB GREENS Storefront

This guide explains how to add translations for new content in the MOB GREENS storefront.

## Overview

The storefront uses `next-intl` for internationalization. Supported languages:
- English (en) - Default
- French (fr)
- German (de)
- Latvian (lv)
- Lithuanian (lt)
- Russian (ru)

## Adding New Translations

### Step 1: Add Translation Keys to All Language Files

Add your new translation keys to all 6 message files in `/app/messages/`:
- `en.json` (English - source of truth)
- `fr.json` (French)
- `de.json` (German)
- `lv.json` (Latvian)
- `lt.json` (Lithuanian)
- `ru.json` (Russian)

**Example:**
```json
// en.json
{
  "NewSection": {
    "title": "New Feature",
    "description": "This is a new feature description"
  }
}
```

Add the corresponding translations to each language file.

### Step 2: Use Translations in Your Component

Import and use the `useTranslations` hook:

```typescript
import { useTranslations } from "next-intl";

export default function MyComponent() {
  const t = useTranslations("NewSection");
  
  return (
    <div>
      <h1>{t("title")}</h1>
      <p>{t("description")}</p>
    </div>
  );
}
```

### Step 3: For New Content with Incomplete Translations

If you're adding new content but translations for all languages aren't ready yet, use the translation helper:

```typescript
import { useTranslationWithFallback } from "@/lib/translation-helper";

export default function MyComponent() {
  const t = useTranslationWithFallback("NewSection");
  
  return (
    <div>
      <h1>{t("title", {}, "New Feature")}</h1>
      <p>{t("description", {}, "This is a new feature description")}</p>
    </div>
  );
}
```

The third parameter is the fallback text (English) that will be shown if the translation key is missing.

## Translation File Structure

Each message file is organized by namespaces:

```json
{
  "LanguageControl": { ... },
  "Navigation": { ... },
  "Catalog": { ... },
  "Cart": { ... },
  "Checkout": { ... },
  "Orders": { ... },
  "Product": { ... },
  "Verification": { ... },
  "Recharge": { ... },
  "OrderSuccess": { ... },
  "OrderTracking": { ... },
  "HowToOrder": { ... },
  "Common": { ... }
}
```

## Best Practices

1. **Always add translations to ALL 6 language files** - Don't leave any language incomplete
2. **Use descriptive keys** - Keys should clearly describe what they translate
3. **Group related translations** - Use namespaces to organize translations by feature/page
4. **Use interpolation for dynamic content**:
   ```typescript
   t("greeting", { name: userName })
   // In JSON: "greeting": "Hello, {name}"
   ```
5. **Test language switching** - Verify translations work correctly when switching languages

## Checking for Missing Translations

To check if a translation key exists:

```typescript
import { useHasTranslation } from "@/lib/translation-helper";

export default function MyComponent() {
  const hasTranslation = useHasTranslation("NewSection");
  
  if (hasTranslation("title")) {
    return <h1>{t("title")}</h1>;
  }
  return <h1>Fallback Title</h1>;
}
```

## Common Issues

### Issue: Translation shows the key name instead of translated text
**Cause:** The translation key is missing from the message file for the current language.
**Solution:** Add the missing translation to the appropriate language file.

### Issue: Language switch doesn't work
**Cause:** The component is not using `useTranslations` hook.
**Solution:** Ensure the component imports and uses `useTranslations` for all text content.

## Adding New Languages

To add a new language:

1. Add the language code to `/app/src/i18n/config.ts` in `SUPPORTED_LOCALES` and `LOCALE_OPTIONS`
2. Create a new message file `/app/messages/{locale}.json` with translations
3. The language selector will automatically include the new option

## Need Help?

For questions about translations, refer to the `next-intl` documentation: https://next-intl-docs.vercel.app/
