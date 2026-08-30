# Phase 24 — Simulated nearby-delivery matching

Phase 24 inserts a secure, guest-owned delivery-matching stage between checkout details and recharge-code confirmation. The candidates and estimates are simulations; they are not live couriers, employees, or GPS positions.

## Customer flow

```text
Cart
  → Checkout details and recharge method
  → Delivery only: confirmed Mapbox location
  → Simulated nearby-delivery matching
  → Courier selection
  → Recharge-code confirmation
  → Pending order
```

Pickup orders bypass delivery matching and go from checkout details directly to recharge-code confirmation.

## Storefront routes

- `/checkout` validates the real cart, customer details, fulfillment, and recharge method, then creates a server-owned checkout intent.
- `/checkout/delivery?intent=...` is available only to the guest session that owns an unexpired delivery intent.
- `/checkout/confirmation?intent=...` accepts only an owned intent. Delivery intents must already contain a valid server-selected courier.
- `/order-success?reference=...` is reached only after the order transaction succeeds.

Only the opaque checkout-intent reference is carried in the URL. Customer details, cart selections, destination data, candidate rankings, and courier snapshots stay server-side.

## Matching rules

- The server owns exactly 30 typed simulated courier profiles.
- A deterministic SHA-256 seed combines the guest boundary, checkout intent, and verified Mapbox place.
- Each intent receives five to seven unique candidates.
- Candidates contain a simulated distance and estimated duration and are sorted by distance, then duration.
- The candidate set is stored on the checkout intent so refreshes and retries remain stable.
- The browser submits only a candidate profile ID. The server reloads the stored candidate and copies its authoritative name, distance, and duration.
- Changing the confirmed destination regenerates the candidate set and removes the previous selection.

## Persistence and order creation

`CheckoutIntent` supports `DRAFT`, `MATCHING`, `DRIVER_SELECTED`, `SUBMITTED`, and `EXPIRED`. Intents expire after a controlled interval and belong to one hashed guest session.

Final submission performs one transaction that:

1. Revalidates the guest-owned intent and selected courier.
2. Reloads current products and price options from PostgreSQL.
3. Enforces one currency and recalculates integer minor-unit totals.
4. Copies product, image, weight, price, destination, and simulated courier snapshots into the order.
5. Creates the initial order-status event.
6. Marks the checkout intent `SUBMITTED`.

The cart is cleared in the browser only after this transaction returns a real order reference. Existing idempotency protection prevents duplicate orders.

## Location reuse

The matching screen reuses `StoreLocationControl` and the shared accessible `BottomSheet`. A previously confirmed device location can be applied through **Use this location**. A new postal/current-location result is confirmed through the existing Mapbox server boundary before matching begins.

No geolocation permission is requested automatically.

## Tracking boundary

The simulated courier assignment is stored separately from `DeliveryTracking`. Its checkout distance is never used as the authoritative dispatch route.

Real Mapbox route preparation remains controlled by the authorized administrator transition to `OUT_FOR_DELIVERY`. Customer tracking stays unavailable while recharge verification is pending.

## API boundaries

- `POST /api/checkout/intents`
- `GET /api/checkout/intents/[intentId]`
- `PATCH /api/checkout/intents/[intentId]/location`
- `POST /api/checkout/intents/[intentId]/courier`
- `POST /api/checkout/intents/[intentId]/submit`

All responses are private and uncached. Write routes validate with Zod, enforce guest ownership, use generic errors, and reuse checkout rate limiting. Secrets, session tokens, matching seeds, and exact coordinates are not logged or returned in public view models.

## Reusable components

```text
src/features/delivery-matching/components/
├── checkout-confirmation-form.tsx
├── courier-assignment-card.tsx
├── courier-candidate-card.tsx
├── courier-candidate-grid.tsx
└── delivery-matching-flow.tsx
```

The route pages compose these components; card and matching markup is not duplicated in pages. `CourierAssignmentCard` is reused by customer and authorized admin order details.

## Verification

- Prisma migration applied to Railway PostgreSQL.
- Railway database health passed.
- Strict TypeScript passed.
- ESLint passed.
- 220 tests passed.
- Storefront and admin production builds passed.
- No horizontal overflow at 360px, 390px, 430px, tablet, or desktop widths on the validated storefront routes.

The complete checklist is recorded in [IMPLEMENTATION_TASKS.md](./IMPLEMENTATION_TASKS.md#phase-24--simulated-nearby-delivery-matching).
