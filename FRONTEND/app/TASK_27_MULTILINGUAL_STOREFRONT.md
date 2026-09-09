# Task 27 — Multilingual storefront

## Scope

Translate the customer-facing MOB GREENS storefront into English, French, Latvian, Lithuanian, German, and Russian. The administrator workspace remains English in this phase.

## Locale behaviour

- [x] Define the six supported locale codes: `en`, `fr`, `lv`, `lt`, `de`, and `ru`.
- [x] On a visit without a saved choice, match the browser's `Accept-Language` preferences to a supported locale.
- [x] Use English when no supported browser language is available.
- [x] Keep a visitor's explicit language choice in a first-party cookie.
- [x] Preserve all existing storefront URLs during the rollout; do not disrupt checkout, order-access, or payment links.
- [ ] Add locale-prefixed public URLs and `hreflang` metadata in a later SEO phase, after the translated catalogue is available.

## Foundation

- [x] Install and configure `next-intl` for the Next.js App Router.
- [x] Add one message catalogue per supported language.
- [x] Set the document `lang` value from the resolved locale.
- [x] Add an accessible language control to the shared storefront header.
- [ ] Add a translation test helper for client components.
- [ ] Add proxy coverage for saved-cookie precedence and browser-language detection.

## Customer interface translation

- [ ] Shared navigation, search, location, cart, currency, empty states, dialogs, toasts, and accessibility labels.
- [ ] Catalogue views: categories, filters, sorting, offers, product cards, product detail, and pagination.
- [ ] Cart and checkout: validation, customer details, pickup/delivery, payment/recharge, and totals.
- [ ] Delivery matching and recharge-code confirmation, including loading, retry, and expired states.
- [ ] Order success, order access, order history, tracking, delivery timeline, and status labels.
- [ ] Recharge-online and how-to-order pages.
- [ ] Page metadata, error pages, not-found pages, and client-safe server validation messages.

## Translatable catalogue content

- [ ] Add a migration for translations of categories, products, product media alt text, videos, and public offer copy.
- [ ] Add administrator editing fields and validation for each supported language.
- [ ] Return the selected locale's content with English fallback from catalogue queries.
- [ ] Make customer search and sorting work with translated content.
- [ ] Preserve existing product slugs and order snapshots while translations are introduced.

## Communications and formatting

- [ ] Translate customer order emails and notification templates using the order locale snapshot.
- [ ] Store the resolved locale on new checkout intents/orders for later emails and order views.
- [ ] Use locale-aware number, weight, price, date, time, and plural formatting.
- [ ] Keep currencies independent from language; language selection must not change a user's selected currency.

## Quality gates

- [ ] Test automatic French, Latvian, Lithuanian, German, Russian, and English fallback selection.
- [ ] Test manual language selection, persistence, refresh, keyboard interaction, and screen-reader labels.
- [ ] Test checkout, delivery, payment, order access, tracking, and all error states in every locale.
- [ ] Review translations with fluent speakers before release; do not use unreviewed machine text for payment or delivery instructions.
- [ ] Run ESLint, strict TypeScript, all tests, production builds, and responsive checks at phone/tablet/desktop widths.
