# Phase 25 — Profit-protected bulk special offers

Task 25 adds real, time-limited bulk offers to category branding, product discovery, cart validation, checkout, orders, and the admin workspace. Offers are based only on real active products and price options. No fake product or offer records are seeded.

## Task 25.1 — Approved business contract

- [x] Treat offer quantity as total product weight, not a new fake product.
- [x] Require the minimum qualifying weight to be at least 80 grams.
- [x] Allow category administrators to configure minimum and maximum qualifying weight.
- [x] Express discounts in integer basis points.
- [x] Cap every configured and generated discount at 1,500 basis points, equal to 15%.
- [x] Require a real cost price for every eligible product price option.
- [x] Require a category-level minimum protected profit margin.
- [x] Exclude any offer that cannot preserve cost plus the protected margin.
- [x] Keep GBP, EUR, and USD explicit and prohibit automatic conversion.
- [x] Use integer minor-unit arithmetic for all monetary calculations.
- [x] Limit a campaign to between 1 and 24 hours.
- [x] Generate at most four meaningful weight tiers per price option.
- [x] Keep campaign timestamps server-authoritative and never reset timers per browser.
- [x] Preserve the existing single-currency cart rule.
- [x] Define the category-card arrow as navigation to the category offers view, not immediate order creation.

### Approved defaults

| Rule                      |       Default |       Hard boundary |
| ------------------------- | ------------: | ------------------: |
| Minimum qualifying weight |          80 g |       At least 80 g |
| Maximum qualifying weight |          1 kg |      At most 100 kg |
| Minimum discount          |            3% |     Greater than 0% |
| Maximum discount          |           15% |     Never above 15% |
| Minimum protected margin  | 15% over cost | 0–100% configurable |
| Campaign duration         |      24 hours |          1–24 hours |
| Offers per price option   |             4 |                 1–4 |

Cost price is the real cost of one existing price option. A price option without cost is safe for ordinary catalog sales but is excluded from offer generation.

## Task 25.2 — Database foundation

- [x] Add nullable `costMinor` to `ProductPriceOption` for backward compatibility.
- [x] Add one `CategoryOfferPolicy` per category.
- [x] Store weight bounds, discount bounds, minimum margin, duration, and tier limit.
- [x] Add persisted `SpecialOffer` records with opaque public identifiers.
- [x] Store generation grouping, product, price option, currency, bundle quantity, total weight, original total, discount, final total, status, and timestamps.
- [x] Add nullable offer snapshots to `OrderItem` for historical accuracy.
- [x] Add unique constraints and lookup indexes.
- [x] Add database checks for the 80 g minimum, 15% maximum, 24-hour maximum, positive totals, and safe field ranges.
- [x] Keep all new fields nullable where existing orders or products require compatibility.
- [x] Create the Railway PostgreSQL migration without seed data.
- [x] Apply the migration to Railway PostgreSQL.

## Task 25.3 — Deterministic offer-generation engine

- [x] Create a typed, server-only generator.
- [x] Normalize grams and kilograms without floating-point arithmetic.
- [x] Calculate the first and last eligible bundle quantities from category weight bounds.
- [x] Select at most four evenly distributed, meaningful bulk tiers.
- [x] Increase discount progressively between the configured minimum and maximum weights.
- [x] Cap proposed and actual discounts at 15%.
- [x] Calculate normal totals, discount amounts, and final totals using integer minor units.
- [x] Calculate a safe revenue floor from cost plus the configured minimum margin.
- [x] Reduce a proposed discount when necessary to preserve the margin.
- [x] Exclude offers whose safe discount falls below the configured minimum.
- [x] Exclude missing costs, invalid prices, invalid weights, and non-qualifying weights with typed reasons.
- [x] Keep currencies explicit and never convert them.
- [x] Generate stable opaque offer identifiers from generation, option, and quantity.
- [x] Use one real start time and an expiration no later than 24 hours.
- [x] Add a Prisma-backed source that loads only active, non-archived products and price options.
- [x] Add a reusable service boundary that rejects missing, disabled, inactive, and archived category policies.
- [x] Add focused validation, profitability, determinism, duration, currency, and exclusion tests.

## Task 25.4 — Authorized campaign backend

- [x] Add authorized create and update operations for category offer policies.
- [x] Add authorized cost-price operations for product price options.
- [x] Add campaign preview without publishing.
- [x] Persist a generated campaign atomically.
- [x] Activate, cancel, expire, and regenerate campaigns.
- [x] Prevent overlapping active campaigns for the same category and price option.
- [x] Add cache invalidation and structured logging.
- [x] Add authorization and transaction tests.

## Task 25.5 — Admin interfaces

- [x] Add the special-offer section to category create and edit forms.
- [x] Add cost price to product price-option editing.
- [x] Build profitability-safe offer previews.
- [x] Show excluded products and typed exclusion reasons.
- [x] Build active, scheduled, expired, and cancelled campaign management.
- [x] Add activation and cancellation confirmations.

## Task 25.6 — Storefront category branding

- [x] Display the strongest real active offer on the category branding card.
- [x] Use large bold discount typography, qualifying weight, and real countdown.
- [x] Keep category imagery and text readable on mobile.
- [x] Route the card arrow to the selected category’s offers view.
- [x] Remove expired offer branding automatically.

## Task 25.7 — Storefront offer discovery

- [x] Add reusable `Products` and `Get offers` tabs.
- [x] Synchronize the view with URL parameters.
- [x] Query only active, non-expired, server-generated offers.
- [x] Build reusable offer cards and details.
- [x] Add loading, empty, expired, and error states.

## Task 25.8 — Cart, checkout, and order integration

- [x] Extend cart-line identity with an optional special-offer ID.
- [x] Persist only identifiers and quantity in the browser.
- [x] Revalidate offer status, expiration, currency, price, product, and margin on the server.
- [x] Reject changed or expired offers safely.
- [x] Snapshot the accepted offer into `OrderItem` in the order transaction.
- [x] Preserve ordinary product purchases and the single-currency rule.

## Task 25.9 — Final verification

- [x] Run strict TypeScript, ESLint, formatting, and the full test suite.
- [x] Run storefront and admin production builds.
- [x] Verify Railway database health.
- [x] Validate 360px, 390px, 430px, tablet, and desktop layouts.
- [x] Test server-authoritative expiration and forged browser discounts.

## Tasks 25.1–25.3 verification

- [x] Prisma client generation and schema validation pass.
- [x] Railway migration `20260824120000_special_offer_foundation` is applied.
- [x] Railway PostgreSQL health verification passes.
- [x] ESLint, strict TypeScript, and formatting checks pass.
- [x] All 232 automated tests pass.
- [x] Storefront and admin production builds pass.

## Tasks 25.4–25.6 verification

- [x] Authorized campaign and cost actions are enforced before service access.
- [x] Draft persistence, activation overlap protection, and regeneration use serializable transactions.
- [x] Server logs and cache invalidation are active without exposing private costs.
- [x] Admin policy, cost, preview, exclusion, lifecycle, and confirmation interfaces are connected to real data.
- [x] Storefront branding uses only the strongest real active, non-expired offer.
- [x] Strict TypeScript, ESLint, formatting, all 240 tests, both production builds, and Railway database health pass.

## Tasks 25.7–25.9 verification

- [x] The dedicated Products and Get offers views use URL-synchronized reusable tabs.
- [x] Public offer discovery returns only active, started, non-expired offers backed by active categories, products, and price options.
- [x] Offer cards use real product records, exact currencies, server-generated totals, and server-authoritative countdown timestamps.
- [x] Browser storage contains only product, price-option, optional opaque offer identifiers, and quantity.
- [x] Server validation rejects expired, forged, changed-price, disabled-policy, and margin-unsafe offers.
- [x] Checkout revalidates offers inside the order transaction and stores immutable offer snapshots on `OrderItem`.
- [x] Ordinary product purchases and the single-currency cart rule remain operational.
- [x] Strict TypeScript, ESLint, formatting, all 246 tests, storefront and admin production builds, Railway database health, and live Railway-backed responsive checks pass.

## Task 25.10 — Admin operations gap closure

- [x] Add the optional private cost price to the normal reusable product price editor.
- [x] Persist cost prices through normal single-product and bulk-product writes.
- [x] Reject a configured cost that is not below its selling price.
- [x] Display immutable special-offer snapshots in authorized admin order details.
- [x] Show the accepted discount, bundle quantity, original total, and saving.
- [x] Add a database-backed `/admin/offers` campaign workspace.
- [x] Add campaign search, status filtering, metrics, pagination, and real empty states.
- [x] Link each campaign to its category's existing authorized lifecycle controls.
- [x] Add Special offers to reusable desktop and mobile admin navigation.
- [x] Replace the obsolete admin foundation dashboard with live PostgreSQL metrics.
- [x] Display the five newest real orders on the admin overview.
- [x] Add campaign-query and cost-validation regression tests.

**Verification:** ESLint, strict TypeScript, formatting, all 258 tests, and both storefront and admin production builds pass. No migration was required because this closes UI and operational gaps over the existing Task 25 schema.

## Current boundary

Task 25 is complete. MOB GREENS now supports profit-protected, administrator-controlled bulk campaigns from generation and category branding through public discovery, cart validation, transactional checkout, historical order snapshots, and centralized admin monitoring. Offers never trust browser prices, never convert currencies, expire using server timestamps, and cannot bypass the configured cost-plus-margin floor. No fake product, offer, cart, or order records were added.
