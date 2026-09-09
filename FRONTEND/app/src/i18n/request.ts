import { headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import {
  DEFAULT_LOCALE,
  localeFromValue,
  STOREFRONT_LOCALE_HEADER,
} from "@/i18n/config";

export default getRequestConfig(async () => {
  const requestHeaders = await headers();
  const locale = localeFromValue(
    requestHeaders.get(STOREFRONT_LOCALE_HEADER) ?? DEFAULT_LOCALE,
  );

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
