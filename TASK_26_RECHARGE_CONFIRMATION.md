# Phase 26 — Recharge confirmation and mail foundation

## Task 26.1 — Confirmation workflow contract

- [x] Keep confirmation bound to the authenticated guest checkout intent.
- [x] Load customer, fulfillment, recharge method, provider, location, courier, currency, and total from the server-owned intent.
- [x] Revalidate stored cart identifiers through the authoritative cart service.
- [x] Return typed confirmation lines instead of raw Prisma records.
- [x] Prevent submission when a product, price, currency, or offer changed.
- [x] Keep submitted orders and payments pending administrator review.
- [x] Preserve encrypted verification-code storage, rate limiting, and idempotency.
- [x] Never claim that a voucher balance was automatically checked.

## Task 26.2 — Reusable confirmation presentation

- [x] Create reusable `CheckoutPageShell`.
- [x] Create reusable `VerificationHero`.
- [x] Create reusable `CheckoutProgress`.
- [x] Create reusable `VerificationOrderSummary`.
- [x] Use the first real ordered product image as the hero artwork when available.
- [x] Provide a restrained no-image state instead of fake artwork.
- [x] Display real customer, items, weights, quantities, offer indicators, location, and total.
- [x] Use the existing design tokens, Lucide icons, safe spacing, and responsive layouts.
- [x] Keep the route page a thin composition boundary.
- [x] Avoid fake testimonials, balances, counters, certifications, and promotional claims.

## Task 26.3 — Secure verification submission

- [x] Keep the API payload limited to the numeric code and optional customer note.
- [x] Format the code visually in four-digit groups while submitting only normalized digits.
- [x] Enforce the existing server-side digits-only, length, intent-ownership, and rate-limit validation.
- [x] Encrypt the code before order persistence.
- [x] Prevent double submission and preserve retry/error behavior.
- [x] Keep the code out of local storage and public customer APIs.
- [x] Redirect successful submissions to the real order-success flow.
- [x] Keep order and payment statuses `PENDING` after submission.

## Task 26.4 — Google SMTP foundation

- [x] Install Nodemailer and its TypeScript declarations.
- [x] Create a server-only validated SMTP environment contract.
- [x] Create a reusable TLS-capable mail transport with controlled timeouts.
- [x] Add `npm run mail:health`.
- [x] Add private `.env` slots for Gmail SMTP and the notification recipient.
- [x] Keep missing SMTP credentials from breaking normal builds.
- [x] Keep SMTP secrets out of client bundles and logs.
- [x] Add the real Gmail sender, Google App Password, sender address, and destination address.
- [x] Run the live SMTP health check and send a harmless delivery-test email.

**Current boundary:** Phase 26 is implemented end to end. New orders remain pending until an authorized Owner or Manager reviews the recharge code.

**Verification:** Railway migration deployed; Gmail authentication and real delivery accepted; ESLint, strict TypeScript, formatting, all 271 tests across 86 files, and both storefront and admin production builds pass.

## Task 26.5 — Reliable administrator notification

- [x] Create the notification outbox and unique idempotency boundary.
- [x] Queue notification records in the same transaction as each order.
- [x] Deliver after commit without rolling back a valid order on mail failure.
- [x] Add safe retries, stale-claim recovery, attempt counts, and provider status.
- [x] Connect both supported public order-creation paths.

## Task 26.6 — Safe order email

- [x] Include customer, products, weights, quantities, currency, total, recharge method, fulfillment, location, courier, timestamp, and admin deep link.
- [x] Escape dynamic HTML.
- [x] Mask the recharge code and never email its full redeemable value.
- [x] Keep transport errors and secrets out of customer responses and logs.

## Task 26.7 — Authorized verification operations

- [x] Add the dedicated `payments.verify` RBAC permission for Owner and Manager.
- [x] Remove automatic code decryption from ordinary order reads.
- [x] Add explicit audited code reveal.
- [x] Add atomic approval that changes payment to `PAID` and order to `CONFIRMED`.
- [x] Add rejection that changes payment to `UNPAID` without falsely completing the order.
- [x] Add notification status and safe retry controls to the real admin order page.
- [x] Add pending-verification visibility to the real admin overview.

## Task 26.8 — Honest customer completion

- [x] Confirm that the order was placed while clearly stating verification is pending.
- [x] Display the real public reference.
- [x] Link securely to the guest-owned order details page.
- [x] Never claim payment or delivery completion before administrator approval and fulfillment.

## Task 26.9 — Security, database, and delivery verification

- [x] Add notification and verification-access audit models.
- [x] Deploy the migration to Railway PostgreSQL.
- [x] Test code masking, HTML escaping, reveal auditing, RBAC, atomic approval, and stale-state rejection.
- [x] Verify Gmail authentication and send one data-free delivery-test message.
- [x] Run the full quality suite and both production builds.
