# MOB GREENS — Implementation Task List

## Delivery rule

MOB GREENS will not use mock catalog, product, customer, or order data in application pages.

Reusable components may be developed without business records because they receive typed props and expose visual/interaction states. Business pages are connected only after their real database queries and mutations exist. Automated tests may create isolated temporary test records, but those records never appear as application demo data or production seed data.

The project will be delivered as vertical slices:

`database model -> validation -> repository -> service -> server action/API -> reusable UI -> page -> tests`

A page is not considered implemented when it only displays a static imitation of future data.

---

## Classification of the remaining work

### Reusable frontend components

- Category tabs
- Product card
- Product image gallery
- Weight-price selector
- Currency select
- Quantity stepper
- Cart item
- Checkout fields
- Pickup/delivery selector
- Recharge-method selector
- Data table
- Order status badge
- Order timeline
- Pagination
- Upload controls
- Form controls and feedback states

### Full-stack features

- Customer catalog
- Product details
- Shopping cart
- Checkout and order creation
- Admin authentication
- Category management
- Product management
- Cloudinary image management
- Admin orders list
- Order details
- Order status management
- Pickup/delivery behavior
- Recharge payment behavior

### Backend and infrastructure

- PostgreSQL database
- Prisma schema and migrations
- Repositories and business services
- Server Actions and Route Handlers
- Authorization and validation
- Railway deployment
- GitHub connection

---

## Phase 1 — Reusable component design system

These components contain no database records and can be implemented first.

### Task 1.1 — Complete form foundations

- [x] Create `Label`.
- [x] Create `FormField` with label, hint, required marker, and error association.
- [x] Create `TextField`.
- [x] Create `TextArea`.
- [x] Create `Select`.
- [x] Create `Checkbox`.
- [x] Create `RadioGroup`.
- [x] Create `Switch`.
- [x] Create `FieldError`.
- [x] Support disabled, read-only, invalid, required, and loading states.
- [x] Use a minimum 44px interactive height.
- [x] Support light and dark themes.
- [x] Add keyboard and accessibility tests.

**Completion:** every future admin and checkout form can use the same field API without recreating labels, spacing, or error styling.

### Task 1.2 — Interaction primitives

- [x] Create `IconButton` with a mandatory accessible label.
- [x] Create `Tabs`.
- [x] Create `DropdownMenu`.
- [x] Create `Dialog`.
- [x] Create `Drawer`.
- [x] Create mobile `BottomSheet` behavior.
- [x] Create `Tooltip`.
- [x] Create `Toast` feedback system.
- [x] Add focus trapping, escape handling, focus restoration, and reduced-motion support.

**Completion:** menus, filters, confirmations, image management, and mobile panels use shared accessible behavior.

### Task 1.3 — Feedback and data-display primitives

- [x] Create `Spinner`.
- [x] Create `Skeleton`.
- [x] Create `InlineAlert`.
- [x] Create `EmptyState`.
- [x] Create `ErrorState`.
- [x] Extend `Badge` into typed `StatusBadge` variants.
- [x] Create `Pagination`.
- [x] Create responsive `DataTable` primitives.

**Completion:** every page has consistent loading, empty, error, status, and pagination presentation.

### Task 1.4 — Commerce primitives

- [x] Create `Money` using `Intl.NumberFormat`.
- [x] Create `CurrencySelect` from the central supported-currency configuration.
- [x] Create `WeightDisplay` for grams and kilograms.
- [x] Create `WeightPriceOption` type.
- [x] Create `WeightPriceSelector`.
- [x] Create `QuantityStepper`.
- [x] Create `ResponsiveImage`.
- [x] Create `ImageGallery` shell that accepts real image records later.
- [x] Create `ProductCard` interface and visual component.
- [x] Create `ProductGrid` layout.
- [x] Create `CartItem`.
- [x] Create `OrderSummary`.

The components must accept typed data through props, but no fake product collection will be added to the storefront.

**Completion:** commerce presentation is ready to receive real database-backed view models.

### Task 1.5 — Admin composition components

- [x] Create `PageHeader`.
- [x] Create `MetricCard`.
- [x] Create `FilterBar`.
- [x] Create `AdminTableToolbar`.
- [x] Create `ConfirmationDialog`.
- [x] Create `ArchiveDialog`.
- [x] Create `ImageUploader` interface.
- [x] Create `ImageReorderGrid` interface.
- [x] Create `WeightPriceEditor` interface.
- [x] Create `OrderStatusTimeline`.

**Completion:** admin feature pages can compose shared operational patterns rather than implementing one-off interfaces.

---

## Phase 2 — Real database foundation

No public product page should be built before this phase is connected.

### Task 2.1 — PostgreSQL and Prisma

- [x] Install Prisma dependencies.
- [x] Configure the PostgreSQL connection through environment variables.
- [x] Add Prisma client generation.
- [x] Create the initial migration.
- [x] Add database health verification.
- [x] Do not create fake product or order seed data.

### Task 2.2 — Database models

- [x] Create `AdminUser`.
- [x] Create `Category`.
- [x] Create `Product`.
- [x] Create `ProductImage`.
- [x] Create `ProductPriceOption` with weight, unit, currency, and integer minor price.
- [x] Create `Order`.
- [x] Create `OrderItem` snapshots.
- [x] Create `OrderStatusEvent`.
- [x] Create `StoreSettings`.
- [x] Add timestamps, unique constraints, indexes, and archive/status fields.

### Task 2.3 — Server boundaries

- [x] Create a server-only database client.
- [x] Create repository interfaces and Prisma implementations.
- [x] Create service result/error types.
- [x] Create Zod schemas for every write boundary.
- [x] Add transaction helpers.
- [x] Add structured server logging without exposing secrets.
- [x] Ensure UI components never import Prisma.

**Completion:** the application can store real business data through tested service boundaries.

---

## Phase 3 — Real admin authentication

### Task 3.1 — Authentication backend

- [x] Select and install the approved session implementation.
- [x] Implement secure password hashing.
- [x] Create a one-time real admin bootstrap command.
- [x] Implement sign-in and sign-out.
- [x] Use secure, HTTP-only, same-site cookies.
- [x] Add login rate limiting.
- [x] Return generic authentication errors.

**Completion:** the authentication backend is active, and the permanent Railway `OWNER` administrator has been bootstrapped and verified.

### Task 3.2 — Authorization

- [x] Protect `/admin` workspace routes.
- [x] Authorize every admin Server Action and Route Handler.
- [x] Redirect unauthenticated requests to `/admin/login`.
- [x] Prevent open redirects.
- [x] Test unauthorized reads and writes.
- [x] Add RBAC roles and centralized permission checks.

### Task 3.3 — Authentication frontend

- [x] Connect the existing admin login shell to the real sign-in action.
- [x] Add validation, pending, error, and success behavior.
- [x] Add an admin account menu and sign-out action.

**Completion:** Tasks 3.1–3.3 are complete; only an authenticated administrator with the required RBAC permission can access or change business data.

---

## Phase 4 — Real category management

### Task 4.1 — Category backend

- [x] Implement category validation.
- [x] Implement unique slug generation.
- [x] Implement create, list, get, update, reorder, activate, and archive services.
- [x] Prevent unsafe deletion of referenced categories.
- [x] Add authorization and tests.

### Task 4.2 — Category frontend

- [x] Build the real admin categories list.
- [x] Add search and status filtering.
- [x] Build the create-category form.
- [x] Build the edit-category form.
- [x] Add activation/archive confirmation.
- [x] Add loading, empty, validation, and error states.
- [x] Use real database categories only.

**Completion:** the administrator can create the first real categories that later appear in the storefront.

---

## Phase 5 — Cloudinary image management

### Task 5.1 — Secure upload backend

- [x] Install the Cloudinary SDK only in this phase.
- [x] Validate Cloudinary environment variables.
- [x] Create authenticated upload signatures or a controlled server upload route.
- [x] Restrict file formats, sizes, and dimensions.
- [x] Generate safe storage keys/folders.
- [x] Store Cloudinary public ID, URL, dimensions, alt text, position, and cover state.
- [x] Handle replacement and cleanup safely.

### Task 5.2 — Upload frontend

- [x] Connect `ImageUploader` to the real upload workflow.
- [x] Add file validation before upload.
- [x] Add progress, retry, replace, remove, and error states.
- [x] Build image reordering.
- [x] Build cover-image selection.
- [x] Require useful alternative text.
- [x] Test phone image selection and upload.

### Task 5.3 — Upload authentication regression

- [x] Scope the HTTP-only admin session cookie to both admin pages and protected admin APIs.
- [x] Migrate existing valid `/admin` cookies to the root path on the next admin page refresh.
- [x] Clear both current and legacy cookie paths during sign-out.
- [x] Keep `catalog.write` RBAC authorization on image upload and removal.
- [x] Send credentials explicitly for upload and removal requests.
- [x] Return actionable session-expiry feedback instead of a raw unauthorized error.
- [x] Verify category and product uploaders share the corrected authenticated workflow.
- [x] Verify all Cloudinary environment variables without exposing their values.
- [x] Pass a real authenticated Cloudinary API ping.
- [x] Pass a real Cloudinary upload and immediate cleanup verification.
- [x] Add cookie migration, route authorization, upload, and client regression tests.

**Completion:** categories and products can use real Cloudinary images with secure server authorization. Image uploads are limited to 50 MB and JPEG, PNG, WebP, or AVIF files.

---

## Phase 6 — Real product management

### Task 6.1 — Product backend

- [x] Implement product schemas and services.
- [x] Implement product create, list, get, update, activate, draft, and archive operations.
- [x] Validate category relationships.
- [x] Validate at least one weight-price option before activation.
- [x] Store prices as integer minor units.
- [x] Store currency explicitly on every price option.
- [x] Prevent automatic cross-currency conversion.
- [x] Add real image relationships.
- [x] Add transactions and tests.

### Task 6.2 — Product admin frontend

- [x] Build the real products table/list.
- [x] Add search, category, currency, and status filters.
- [x] Build the product form.
- [x] Connect the category selector to real categories.
- [x] Connect Cloudinary image management.
- [x] Connect the reusable `WeightPriceEditor`.
- [x] Support grams and kilograms only.
- [x] Provide GBP, EUR, and USD through the reusable currency dropdown.
- [x] Add product preview using the current unsaved form values, not fake stored data.
- [x] Add loading, empty, validation, error, and success states.

### Task 6.3  Server Action boundary hardening

- [x] Keep top-level `"use server"` modules limited to exported async functions.
- [x] Move category, product, order, and authentication action-state values into ordinary typed modules.
- [x] Verify category, single-product, and bulk-product forms import state without crossing the Server Action boundary.
- [x] Audit every Server Action module for non-function runtime exports.
- [x] Pass the production admin build and the complete automated test suite.

**Completion:** admin can enter the first real products, images, weights, currencies, and prices. The Railway products table remains empty until the administrator submits the first real product.

---

## Phase 7 — Real customer catalog

### Task 7.1 — Catalog backend

- [x] Query active categories only.
- [x] Query active products and active price options only.
- [x] Implement category filtering.
- [x] Implement normalized product search.
- [x] Implement whitelisted sorting.
- [x] Implement server pagination.
- [x] Implement public product lookup by slug.
- [x] Return dedicated typed view models, not raw database records.
- [x] Add cache rules and invalidation after admin changes.

### Task 7.2 — Catalog frontend

- [x] Replace the foundation catalog shell with real database results.
- [x] Build real category tabs from active categories.
- [x] Keep `All goods` as the first tab.
- [x] Synchronize category, search, sort, and page with URL parameters.
- [x] Build real product cards.
- [x] Format each price with its actual currency.
- [x] Add product result count.
- [x] Add loading, empty-category, no-search-result, and error states.
- [x] Validate 360px, 390px, 430px, tablet, and desktop layouts.

### Task 7.3 — Product details

- [x] Build the real image gallery.
- [x] Display category, name, description, and availability.
- [x] Connect the real weight-price selector.
- [x] Show the selected option's exact currency and price.
- [x] Add structured metadata and correct page metadata.
- [x] Handle inactive or missing products with a real not-found response.

**Completion:** customers browse only real products entered by the administrator. No catalog seed or mock product data was added.
---

## Phase 8 — Real shopping cart

### Task 8.1 — Cart domain

- [x] Define the cart line identity as product plus price-option ID.
- [x] Create add, update quantity, remove, and clear operations.
- [x] Persist only product IDs, price-option IDs, and quantities locally.
- [x] Never trust locally stored prices.
- [x] Revalidate current product availability and prices on the server.
- [x] Define the single-currency cart rule before enabling checkout.

### Task 8.2 — Cart frontend

- [x] Connect `Add to cart` to the selected real price option.
- [x] Build the cart page using reusable components.
- [x] Add quantity controls and removal confirmation.
- [x] Display current server-confirmed prices.
- [x] Warn when a product, price, or availability changed.
- [x] Add empty, loading, error, and recovery states.
- [x] Add accessible cart-count announcements.

**Completion:** the cart contains real catalog selections and never treats browser prices as authoritative. Checkout remains intentionally disabled until its own implementation phase.
---

## Phase 9 — Checkout and real order creation

### Task 9.1 — Confirmed business behavior

- [x] Define Pickup behavior: customer selects Pickup; detailed collection instructions are deferred and coordinated after verification.
- [x] Define Delivery behavior: Delivery is available without an added fee or automatic area calculation; detailed coordination is deferred.
- [x] Define `Recharge from store`: customer buys a PaysafeCard code from a physical store and enters the numeric code during checkout.
- [x] Define `Recharge online`: customer opens Startselect, Dundle, Recharge.com, or VidaPlayer in a new tab, buys a code, returns, selects the partner, and submits the code.
- [x] Keep one currency per order with no automatic conversion.
- [x] Define customer confirmation: show a success page and public order reference with payment verification clearly marked pending.
- [x] Keep checkout anonymous; only full name and email are required and no account is created.
- [x] Keep delivery fees at zero because the product price is the complete customer-facing amount.
- [x] Accept digits-only verification codes; stricter length rules are deferred.

### Task 9.2 — Order backend

- [x] Validate guest customer details.
- [x] Validate fulfillment and payment method.
- [x] Load authoritative products and prices.
- [x] Calculate totals with integer arithmetic.
- [x] Reject mixed currencies.
- [x] Generate a safe public order reference.
- [x] Create the order and item snapshots in one transaction.
- [x] Add idempotency to prevent duplicate submissions.
- [x] Add persistent rate limiting.
- [x] Record the initial order-status event.
- [x] Encrypt the recharge verification code at rest.
- [x] Add integration and boundary tests.

### Task 9.3 — Checkout frontend

- [x] Build the guest checkout form from reusable fields.
- [x] Build Pickup/Delivery selection from approved behavior.
- [x] Build Recharge-method selection from approved behavior.
- [x] Display the authoritative order summary.
- [x] Add pending, field-error, server-error, and retry states.
- [x] Prevent double submission.
- [x] Build the real order-success page with the returned reference.
- [x] Connect the four approved external recharge partner links.

**Completion:** an anonymous customer can create a valid, non-duplicate real order. New orders and payments remain `PENDING` until an administrator verifies the recharge code. Administrator order-management screens and outbound email delivery are deferred to their dedicated implementation phase.

---

## Phase 10 — Real admin order operations

### Task 10.1 — Orders backend

- [x] Implement paginated order listing.
- [x] Search by reference, customer name, and phone.
- [x] Filter by order status, payment status, payment method, fulfillment, currency, and date.
- [x] Whitelist sorting fields.
- [x] Implement order details.
- [x] Define and enforce valid status transitions.
- [x] Create a status event for every order-status change and a dedicated audit event for every payment-status change.
- [x] Authorize all read and write operations through RBAC permissions.
- [x] Add filter, authorization, transition, concurrency, and audit-event tests.

### Task 10.2 — Orders frontend

- [x] Replace the admin order shell with the real database-backed orders table.
- [x] Build the mobile order-card alternative.
- [x] Add real search, filters, sorting, and pagination.
- [x] Add currency-aware totals.
- [x] Add typed order and payment status badges.
- [x] Build the order details page.
- [x] Build the combined order and payment status timeline.
- [x] Build the authorized status-change actions.
- [x] Add loading, empty, no-result, error, and success states.
- [x] Validate the authenticated orders page at 360px, 390px, 430px, tablet, and desktop widths.

**Completion:** the administrator can find, inspect, verify payment for, and process every real order. Payment must be marked paid before an order can be confirmed; pickup and delivery follow their own valid transitions. All changes are transactional and auditable.

---

## Phase 11 — Mobile storefront discovery redesign

No mock categories, promotional banners, or product collections may be added.

### Task 11.1 — Real category presentation data

- [x] Add the restricted `CategoryDisplayTone` database field.
- [x] Add a safe `MIST` default for existing categories.
- [x] Apply the real Railway PostgreSQL migration.
- [x] Extend category validation, repository, services, and Server Actions.
- [x] Add the display-tone selector to the reusable admin category form.
- [x] Add a live category-card preview driven by current form values.
- [x] Continue using real Cloudinary category images and useful alternative text.
- [x] Return only active, non-archived categories to the storefront.
- [x] Return typed category image, tone, description, order, and real active-product count data.
- [x] Add configuration, validation, service, and catalog-query tests.

**Completion:** the administrator controls the real category image and approved neutral presentation tone, and the public catalog receives a typed database-backed category showcase model.

### Task 11.2 — Reusable storefront top bar

- [x] Replace the desktop-oriented `StoreHeader` implementation.
- [x] Create reusable `StoreDiscoveryHeader`.
- [x] Create reusable `StoreSearchBar`.
- [x] Use the existing accessible `IconButton`.
- [x] Add Lucide menu and map-pin icons.
- [x] Preserve real cart access and accessible cart count.
- [x] Keep camera and microphone controls absent.
- [x] Connect search to the real server catalog search.
- [x] Preserve category and sort URL parameters during search.
- [x] Make the header sticky and respect phone safe areas.
- [x] Support light and dark themes.
- [x] Apply the active category's controlled neutral surface tone.
- [x] Leave menu and map controls disabled until their behavior is defined.
- [x] Remove the old marketing hero from the storefront.

**Completion:** customers immediately see real search and essential controls without a marketing hero.

### Task 11.3 — Reusable category tab rail

- [x] Extract category links into reusable `CategoryTabRail`.
- [x] Preserve `All goods` as the first tab.
- [x] Use only real active, non-archived database categories.
- [x] Add horizontal touch and trackpad scrolling.
- [x] Add CSS scroll snapping and keep tabs on one line.
- [x] Hide visual scrollbars without disabling scrolling.
- [x] Add responsive edge fades when more tabs are available.
- [x] Add Arrow, Home, and End keyboard navigation.
- [x] Scroll the active category into view automatically.
- [x] Preserve category, search, and sort URL parameters.
- [x] Use at least 44px touch targets.
- [x] Add focused URL and keyboard interaction tests.

**Completion:** category navigation works naturally with thumbs, mouse, trackpad, and keyboard.

### Task 11.4 — Real category showcase rail

- [x] Create typed `CategoryShowcaseCard`.
- [x] Create reusable `CategoryShowcaseRail`.
- [x] Display each category's real Cloudinary image.
- [x] Display the real category name and optional description.
- [x] Place the category name and description inside the image-led composition with a readable overlay.
- [x] Reuse the same category visual in the admin live preview and public storefront.
- [x] Keep repeated platform branding out of category cards.
- [x] Display the real active-product count when available.
- [x] Use the administrator-selected display tone.
- [x] Give cards a large mobile visual ratio and leave the next card partially visible.
- [x] Add horizontal swipe, scroll snapping, and desktop previous/next controls.
- [x] Synchronize the focused card with the category tab, URL, header tone, and discovery surface.
- [x] Use a subtle active-tab surface and indicator derived from the focused category tone.
- [x] Make the entire card a clear category navigation target.
- [x] Jump category-card navigation to the filtered real product-results anchor.
- [x] Avoid autoplay, mock imagery, mock headings, and promotional copy.
- [x] Render a real empty state when no active categories exist.

**Completion:** every large card represents a real category created by the administrator.

### Task 11.5 — Product-results section

- [x] Keep the body driven by the selected category.
- [x] Move sorting into a compact reusable results toolbar.
- [x] Replace the native storefront sort popup with an anchored accessible dropdown that stays inside the phone viewport.
- [x] Display the selected category name and real result count.
- [x] Keep server-side search, category filtering, whitelisted sorting, and pagination.
- [x] Redesign reusable `ProductCard` for the denser storefront.
- [x] Use a two-column mobile, three-column tablet, and four-column desktop grid.
- [x] Preserve real weight, currency, price, product links, and server data.
- [x] Preserve loading, empty, no-result, and error states.
- [x] Keep product-card markup out of the storefront page.

**Completion:** the product body shows only real results matching the selected tab, search, and sort.

### Task 11.6 — Mobile specifications

- [x] Validate 360px, 390px, 430px, tablet, and desktop widths.
- [x] Validate phone safe-area insets and prevent page-level horizontal overflow.
- [x] Ensure only intended rails scroll horizontally.
- [x] Use 12–16px mobile gutters and 44–48px interactive header controls.
- [x] Keep the search field usable at 360px.
- [x] Keep the next showcase card partially visible when real categories exist.
- [x] Prevent product cards from becoming too narrow.
- [x] Test long category names, missing optional descriptions, and varied image ratios.
- [x] Test light and dark themes.
- [x] Test reduced motion.
- [x] Test keyboard behavior and screen-reader labels.

**Phase completion:** the storefront opens directly into real search, category discovery, and filtered products with a reusable mobile-first interface controlled by the administrator.

---

## Phase 12 — Bulk product creation

### Task 12.1 — Authorized atomic bulk backend

- [x] Accept between 1 and 10 products per bulk request.
- [x] Authorize the bulk action with `catalog.write`.
- [x] Validate every product through the existing product write schema.
- [x] Validate real category relationships and activation rules.
- [x] Convert every entered price to integer minor units.
- [x] Preserve explicit GBP, EUR, and USD values without conversion.
- [x] Generate unique slugs across existing records and the current batch.
- [x] Create the complete batch through one Prisma transaction.
- [x] Revalidate the admin product list and public catalog after success.
- [x] Report the real number of products created.

### Task 12.2 — Reusable bulk product frontend

- [x] Replace new-product creation with a reusable `BulkProductForm`.
- [x] Select one real category for the complete batch.
- [x] Add and remove independently editable product panels.
- [x] Enforce a maximum of 10 product panels.
- [x] Keep single-product editing unchanged.
- [x] Give every product independent details, publication status, images, and weight-price options.
- [x] Show real per-product Cloudinary upload progress.
- [x] Preserve image validation, retry, reordering, cover selection, removal, and alternative text.
- [x] Prevent submission while any product upload is running.
- [x] Open the first invalid product and show a clear validation message.
- [x] Display ready, incomplete, uploading, and failed states with real Lucide icons.
- [x] Use unique accessible relationships for repeated weight-price editors.
- [x] Add responsive, reduced-motion-aware progress presentation.

### Task 12.3 — Verification

- [x] Test the 10-product ceiling.
- [x] Test per-product upload progress and submission locking.
- [x] Test incomplete-product validation.
- [x] Test server-side bulk limits.
- [x] Test duplicate-name slug generation.
- [x] Test authorization and integer price conversion.
- [x] Pass ESLint and strict TypeScript.
- [x] Pass all 161 automated tests.
- [x] Pass the isolated admin production build while development servers remain active.

**Completion:** the administrator can create up to 10 real products for one category in a single authorized, atomic workflow with independent Cloudinary upload progress and no mock catalog data.

---

## Phase 13 — Storefront menu

### Task 13.1 — Activate the menu control

- [x] Enable the existing storefront menu button.
- [x] Use the reusable accessible `Drawer`.
- [x] Open the drawer from the left side.
- [x] Make the drawer full-height on phones.
- [x] Respect top and bottom phone safe areas.
- [x] Add backdrop dimming and subtle blur.
- [x] Lock page scrolling while open.
- [x] Trap keyboard focus.
- [x] Support Escape and backdrop closing.
- [x] Restore focus to the menu button after closing.
- [x] Respect reduced-motion preferences.

### Task 13.2 — Text-only navigation

- [x] Keep menu navigation text-only without decorative icons.
- [x] Add the `Menu` heading.
- [x] Add expandable `Get Recharge` navigation with a small animated chevron.
- [x] Add comfortably padded indented recharge options.
- [x] Display `Recharge from store` as dimmed, unavailable, and non-navigable.
- [x] Add accessible unavailable text.
- [x] Route `Recharge online` to `/recharge-online`.
- [x] Route `Track orders` to `/orders`.
- [x] Highlight the current route subtly.
- [x] Keep emojis and decorative stickers absent.

### Task 13.3 — Recharge Online page

- [x] Build `/recharge-online`.
- [x] Reuse the approved recharge-partner configuration.
- [x] Display Startselect, Dundle, Recharge.com, and VidaPlayer.
- [x] Explain the external partner handoff.
- [x] Explain that MOB GREENS does not receive or store card details.
- [x] Explain that customers must return with the verification code.
- [x] Open partner websites safely in a new tab with `noopener noreferrer`.
- [x] Provide a clear return-to-checkout action.
- [x] Keep `Recharge from store` navigation unavailable.
- [x] Add focused accessibility, route, external-link, and content tests.

**Completion:** the storefront menu provides clean text-only navigation with a controlled recharge submenu, and customers can safely reach approved online recharge partners before returning to checkout.

---

## Phase 14 — Delivery-location foundation

### Task 14.1 — Location provider configuration

- [ ] Create the owner-controlled Mapbox account and restricted public token. External account action required.
- [x] Add `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` to the local environment contract.
- [x] Add server-only `MAPBOX_ACCESS_TOKEN` support for proxied provider requests.
- [ ] Restrict the public token to the final deployed MOB GREENS domains. Requires the deployed domains and Mapbox account.
- [x] Validate optional Mapbox variables through the existing Zod environment schema.
- [x] Add required Mapbox API, image, worker, and connection sources to Content Security Policy.
- [ ] Configure Railway Mapbox values during deployment, as explicitly deferred.
- [x] Keep private Mapbox credentials out of all client components and bundles.

### Task 14.2 — Dependencies

- [x] Install `react-map-gl`, `mapbox-gl`, and `@mapbox/search-js-react`.
- [x] Add Mapbox GL CSS through the application stylesheet.
- [x] Add a dynamically imported full tracking-map foundation.
- [x] Use `navigator.geolocation` without another package.

### Task 14.3 — Typed location model

- [x] Add the complete typed location contract and versioned stored-location contract.
- [x] Keep provider candidates separate from confirmed delivery locations.

### Task 14.4 — Location validation

- [x] Validate coordinate ranges and postal-code length.
- [x] Normalize postal-code casing and whitespace.
- [x] Require a real selected provider result.
- [x] Sign provider results on the server and reject client-authored or tampered addresses.
- [x] Rate-limit geocoding through PostgreSQL.
- [x] Return generic errors and prevent arbitrary provider proxying.
- [x] Require selection of one exact returned place.

**Implementation status:** the typed and secured location foundation is complete. Live Mapbox requests require owner-supplied tokens.

---

## Phase 15 — Location bottom sheet

### Task 15.1 — Activate the map-pin control

- [x] Enable the map-pin with the reusable accessible `BottomSheet`.
- [x] Add the rounded phone sheet, drag indicator, blurred backdrop, and safe-area padding.
- [x] Support touch dragging, swipe closing, keyboard access, screen readers, focus restoration, and reduced motion.

### Task 15.2 — First-use location interface

- [x] Add postal search with real proxied Mapbox suggestions.
- [x] Show locality, region, and country and require exact selection.
- [x] Add explicit current-location permission, loading, and reverse geocoding.
- [x] Display the resolved address before `Use this location`.
- [x] Add permission-denied, unavailable, timeout, retry, no-result, and provider-error guidance.
- [x] Avoid automatic geolocation requests.

### Task 15.3 — Returning-customer sheet

- [x] Display the current location with change and clear controls.
- [x] Load real orders belonging only to the current guest session.
- [x] Display reference, status, currency-aware total, and estimated delivery when available.
- [x] Add functional order list, detail, and tracking routes.
- [x] Show tracking only for out-for-delivery delivery orders.
- [x] Separate pending-verification and paid confirmed orders.

### Task 15.4 — Local persistence

- [x] Persist and validate the versioned selected location.
- [x] Recover from malformed storage and add clear saved location.
- [x] Keep verification codes out of local location storage.
- [x] Explain browser/device-only persistence.

**Completion:** first-use and returning customers have a reusable, secure, phone-first location sheet backed by real APIs.

---

## Phase 16 — Secure guest-order access

### Task 16.1 — Guest session

- [x] Add the real `GuestSession` PostgreSQL model.
- [x] Generate a cryptographically secure 256-bit identifier and store only its HMAC hash.
- [x] Use an HTTP-only, SameSite=Lax cookie, Secure in production, with a controlled 90-day lifetime.
- [x] Rotate invalid sessions and support multiple orders without creating accounts.

### Task 16.2 — Connect orders to guest sessions

- [x] Link the guest session and new order in the same transaction.
- [x] Preserve idempotency and reject cross-session retries.
- [x] Prevent cross-session reads, email-only access, and sequential-ID exposure.
- [x] Continue using safe public order references.

### Task 16.3 — Existing order compatibility

- [x] Keep pre-session orders available to administrators but private publicly.
- [x] Defer optional secure reference-plus-verified-email claiming.
- [x] Require database-backed rate limiting for future claims.

### Task 16.4 — Public order endpoints

- [x] Add paginated `GET /api/customer/orders`.
- [x] Add `GET /api/customer/orders/[reference]`.
- [x] Add `GET /api/customer/orders/[reference]/tracking`.
- [x] Return typed public view models without encrypted codes, administrator notes, hashes, or database IDs.
- [x] Add private no-store headers, PostgreSQL rate limiting, and secret-safe logging.
- [x] Apply the migration to Railway PostgreSQL.
- [x] Pass ESLint, strict TypeScript, all 175 tests, database health, and the storefront production build.

**Completion:** guest orders are securely available only to the device session that created them, without customer accounts.

---

## Phase 17 — Order image snapshots

### Task 17.1 — Database changes

- [x] Add nullable product image URL, alternative-text, and Cloudinary public-ID snapshots to `OrderItem`.
- [x] Create and apply the Railway PostgreSQL migration without altering existing orders.

### Task 17.2 — Checkout integration

- [x] Load the authoritative product cover image during checkout.
- [x] Copy its URL, useful alternative text, and public ID into immutable order-item snapshots.
- [x] Reject browser authority over image data and support products without images.
- [x] Add checkout snapshot tests.

**Completion:** new orders preserve the product imagery that existed when the order was created.

---

## Phase 18 — Customer orders pages

### Task 18.1 — Orders page

- [x] Build `/orders` with guest-session ownership, URL-synchronized Active, Completed, Cancelled, and Pending tabs.
- [x] Add newest-first server pagination and loading, empty, error, and retry states.
- [x] Use mobile order cards and a denser responsive desktop layout.

### Task 18.2 — Reusable customer order card

- [x] Display the first snapshot image, additional-item count, reference, fulfillment, statuses, exact total, and date.
- [x] Add order and eligible tracking links with accessible status announcements.

### Task 18.3 — Order details page

- [x] Build `/orders/[reference]` with server-side guest-session ownership verification.
- [x] Display safe delivery, item snapshot, total, payment, and status-timeline information.
- [x] Hide private fields and return the same not-found response for missing and unauthorized orders.

**Completion:** customers can securely browse real orders belonging to their current guest device session.

---

## Phase 19 — Delivery destination integration

### Task 19.1 — Checkout delivery location

- [x] Require a server-signed confirmed location for delivery and no location for pickup.
- [x] Revalidate the Mapbox place, coordinates, and formatted address server-side.
- [x] Store immutable address, postal-code, country, coordinate, and place-ID snapshots in the order transaction.
- [x] Keep delivery fees at zero and product prices authoritative.

### Task 19.2 — Private dispatch location

- [x] Extend `StoreSettings` with private validated dispatch address and coordinates.
- [x] Add an authorized administrator dispatch-location editor at `/admin/settings`.
- [x] Keep private dispatch details out of customer APIs.
- [x] Block `OUT_FOR_DELIVERY` unless both dispatch and destination coordinates exist.

**Completion:** delivery orders have immutable destinations and the administrator can configure the private routing origin.

**Verification:** Railway migration applied, database health passed, ESLint and strict TypeScript passed, all 177 tests passed, and storefront/admin production builds passed.

---

## Phase 20 - Real-route tracking simulation

### Task 20.1 - Tracking model

- [x] Add one nullable-safe `DeliveryTracking` relation per delivery order.
- [x] Persist origin/destination coordinates, GeoJSON geometry, distance, duration, dispatch/arrival timestamps, provider identifier, route kind, tracking state, safe provider error, timestamps, and indexes.
- [x] Reject tracking creation for pickup orders.
- [x] Apply the tracking migration to Railway PostgreSQL.

### Task 20.2 - Route generation

- [x] Generate tracking when an authorized transition moves a delivery order to `OUT_FOR_DELIVERY`.
- [x] Use the validated private dispatch origin and immutable customer destination.
- [x] Request Mapbox driving GeoJSON server-side with two validated coordinates.
- [x] Validate response shape and bound returned geometry coordinates.
- [x] Apply an eight-second timeout and three bounded transient retries.
- [x] Complete external provider work before opening the database transaction.
- [x] Commit the status, tracking record, and timeline event transactionally.

### Task 20.3 - Temporal courier simulation

- [x] Calculate deterministic progress from server time, dispatch time, and provider duration.
- [x] Interpolate the courier along persisted geometry without randomness.
- [x] Freeze paused/cancelled tracking and place completed tracking at the destination.
- [x] Return distance/time remaining and an authoritative server timestamp.
- [x] Clearly identify all courier movement as simulated.

### Task 20.4 - Worldwide fallback

- [x] Detect `NoRoute`, unsupported/invalid responses, timeouts, and provider failure.
- [x] Persist a clearly labelled direct trajectory fallback.
- [x] Keep origin, destination, order timeline, and destination zone available.
- [x] Never describe the direct fallback as a road route.

**Completion:** persistent delivery tracking uses real Mapbox road geometry where supported and a clearly identified direct simulation everywhere else.

---

## Phase 21 - Tracking map frontend

### Task 21.1 - Tracking page

- [x] Build the server-protected `/orders/[reference]/tracking` page.
- [x] Verify guest-session ownership before rendering or returning route data.
- [x] Dynamically load Mapbox and render route, dispatch, simulated courier, and recipient markers.
- [x] Fit bounds, add zoom controls, safe touch gestures, safe-area spacing, and light/dark styles.

### Task 21.2 - Recipient location zone

- [x] Render a zoom-responsive recipient zone around the exact confirmed destination.
- [x] Display the customer-safe address, locality, and postal code without visible coordinate text.
- [x] Keep coordinates restricted to authorized guest/admin responses.

### Task 21.3 - Tracking information panel

- [x] Display status, simulation disclosure, ETA, remaining distance/time, destination, reference, and timeline.
- [x] Add order-detail navigation and loading, offline, provider-fallback, error, and retry states.

### Task 21.4 - Progress updates

- [x] Poll approximately every 15 seconds while active.
- [x] Pause hidden-tab polling, resume on visibility, and stop for completed/cancelled tracking.
- [x] Animate between server positions and disable interpolation for reduced motion.
- [x] Use HTTP polling only and announce important status changes accessibly.

**Completion:** authorized customers receive a modern real-route map with clearly simulated temporal courier movement.

---

## Phase 22 - Administrator tracking controls

- [x] Display delivery location, coordinate readiness, and a compact route preview in order details.
- [x] Show specific missing private-origin and customer-destination errors before dispatch.
- [x] Generate tracking during the authorized `OUT_FOR_DELIVERY` transition.
- [x] Display route distance, ETA, and direct-fallback disclosure.
- [x] Allow safe authorized route regeneration.
- [x] Prevent pickup tracking.
- [x] Mark tracking completed/cancelled with terminal order states.
- [x] Record dispatch and regeneration activity in the order timeline.
- [x] Protect every mutation with `orders.write`.

---

## Phase 23 - Testing and quality

### Backend

- [x] Cover guest-session isolation, unauthorized tracking reads, expired-session behavior, and rate limiting.
- [x] Cover signed delivery-location validation, required delivery coordinates, and coordinate-free pickup.
- [x] Cover provider failures, `NoRoute`, invalid Mapbox responses, timeouts/retries, and fallback behavior.
- [x] Cover deterministic interpolation and paused, completed, and cancelled tracking.
- [x] Verify public responses exclude verification codes, provider errors, administrator data, and private identifiers.

### Frontend

- [x] Retain menu focus, Escape restoration, recharge keyboard/disabled-option tests.
- [x] Add location permission-denial, postal suggestion, current-location resolution, and returning-order tests.
- [x] Add map fallback, loading, offline recovery, timeline, and screen-reader-label tests.
- [x] Validate no horizontal overflow at 360px, 390px, 430px, tablet, and desktop.
- [x] Preserve reduced-motion behavior and responsive light/dark map support.

### Deployment

- [ ] Add both Mapbox variables to the future Railway application service; they are absent from the currently linked PostgreSQL service.
- [ ] Restrict the production public token to the final deployed MOB GREENS domains.
- [x] Apply both PostgreSQL tracking migrations and verify database health.
- [ ] Verify Railway HTTPS geolocation after the application service is deployed.
- [x] Verify Mapbox CSP directives and private, uncached tracking responses.
- [x] Log safe provider fallback reasons for monitoring without secrets or coordinates.
- [ ] Validate live production routes after deployment without exposing credentials.

**Verification:** ESLint, strict TypeScript, 196 tests, Railway database health, storefront/admin production builds, and responsive overflow checks pass. Deployment-only checks remain intentionally open until the application service and final domains exist.

---

## Phase 24 — Simulated nearby-delivery matching

This phase adds the required delivery-matching step before recharge-code confirmation. Courier discovery is a transparent simulation for the customer experience; it must never be presented as a live courier marketplace or real courier GPS availability.

### Task 24.1 — Define the checkout-stage flow

- [x] Split delivery checkout into clear stages: order details, recharge method, nearby-delivery matching, then recharge-code confirmation.
- [x] Keep pickup orders outside the delivery-matching flow.
- [x] Require a valid cart, one currency, customer details, delivery fulfillment, recharge method, and a server-verified delivery location before matching starts.
- [x] Preserve the current guest-session and idempotency protections throughout the staged flow.
- [x] Prevent customers from opening the matching route directly without a valid in-progress checkout.
- [x] Redirect a completed driver selection to the existing confirmation page contract.
- [x] Defer redesigning the confirmation page itself.

### Task 24.2 — Simulated courier profile catalogue

- [x] Create a typed, server-owned catalogue of exactly 30 simulated courier profiles.
- [x] Give every profile a stable non-sequential identifier and a European-style display name/handle such as `Maxime97` or `Gustavo874`.
- [x] Use a real Lucide person/courier icon in the interface instead of profile photographs, emojis, or stickers.
- [x] Keep profile data outside page components and expose only a customer-safe view model.
- [x] Mark the catalogue and matching result clearly as simulated.
- [x] Do not describe profiles as employees, live couriers, or currently GPS-tracked people.

### Task 24.3 — Deterministic nearby-courier matching service

- [x] Implement the matching algorithm on the server.
- [x] Generate a stable matching seed from the guest session, verified destination, and checkout intent.
- [x] Select between five and seven unique courier candidates from the 30-profile catalogue.
- [x] Generate plausible simulated candidate distance in kilometres and estimated delivery time.
- [x] Sort candidates by distance and then estimated time.
- [x] Keep results stable across page refreshes and retries for the same checkout intent.
- [x] Never accept browser-provided distance, duration, profile identity, or ranking as authoritative.
- [x] Avoid exposing the seed, guest token, exact coordinates, or internal identifiers.
- [x] Add bounded execution, generic errors, rate limiting, and structured logging without private location data.

### Task 24.4 — Checkout-intent persistence

- [x] Add a server-side checkout-intent model linked to the current guest session.
- [x] Store only authoritative cart identifiers, customer details, fulfillment, payment selection, verified destination, selected simulated courier, and lifecycle timestamps.
- [x] Add `DRAFT`, `MATCHING`, `DRIVER_SELECTED`, `SUBMITTED`, and `EXPIRED` intent states.
- [x] Set a controlled expiration time and reject expired intents safely.
- [x] Persist the generated candidate set or its deterministic version so matching remains stable.
- [x] Persist the selected courier snapshot, simulated distance, and estimated duration.
- [x] Prevent one guest session from reading or changing another guest’s checkout intent.
- [x] Use opaque public intent identifiers rather than sequential database IDs.
- [x] Add the PostgreSQL migration without fake product or order seed data.

### Task 24.5 — Location prerequisite and reuse

- [x] Reuse the existing `StoreLocationControl` and accessible location `BottomSheet`.
- [x] Display a concise message when delivery location is missing.
- [x] Add a prominent blue text action labelled `Activate location` or `Choose location`.
- [x] Open the existing location bottom sheet from that action.
- [x] Require the customer to confirm a real Mapbox result before matching begins.
- [x] Revalidate the signed location on the server before generating candidates.
- [x] Support changing the location and regenerating the matching result deliberately.
- [x] Invalidate a previous courier selection when the confirmed destination changes.
- [x] Never request geolocation automatically on page load.

### Task 24.6 — Delivery-search experience

- [x] Build a dedicated mobile-first delivery-matching page within checkout.
- [x] Add a restrained three-dot or delivery-icon loading animation using existing UI primitives and Lucide icons.
- [x] Explain briefly that MOB GREENS is finding simulated delivery options near the confirmed destination.
- [x] Display the confirmed locality and postal code without exposing coordinates.
- [x] Add loading, slow-response, offline, provider-error, empty, retry, and expired-intent states.
- [x] Respect reduced-motion preferences by replacing movement with a static progress indicator.
- [x] Prevent double requests while matching is already in progress.
- [x] Keep the page usable at 360px, 390px, 430px, tablet, and desktop widths.

### Task 24.7 — Reusable courier candidate grid

- [x] Create a typed reusable `CourierCandidateCard`.
- [x] Create a reusable `CourierCandidateGrid`.
- [x] Display a Lucide person icon, courier handle, simulated distance, and estimated delivery time on every card.
- [x] Use a three-column mobile grid only where cards preserve readable content and 44px touch targets.
- [x] Fall back to two columns on narrower phones if a three-column layout would become cramped.
- [x] Provide a clear selected state using the established monochrome design tokens and blue only as an interaction indicator.
- [x] Add keyboard selection, visible focus, screen-reader labels, and an accessible selected announcement.
- [x] Keep card markup out of the route page.
- [x] Avoid profile images, fake ratings, fake reviews, and promotional claims.

### Task 24.8 — Courier selection and confirmation handoff

- [x] Validate the selected opaque candidate ID against the server-generated candidate set.
- [x] Persist one selected courier snapshot for the checkout intent.
- [x] Show a compact selection summary with name, simulated distance, and estimated delivery time.
- [x] Allow the customer to change the selected courier before continuing.
- [x] Disable continuation until a valid courier is selected.
- [x] Redirect to the recharge-code confirmation page after successful selection.
- [x] Carry only the opaque checkout-intent reference in the URL; keep personal, cart, location, and courier data server-side.
- [x] On final order creation, revalidate products and prices and copy the selected courier snapshot into the order transaction.
- [x] Mark the checkout intent `SUBMITTED` in the same transaction as order creation.
- [x] Preserve duplicate-submission protection and clear the cart only after real order creation succeeds.

### Task 24.9 — Tracking-boundary integration

- [x] Store the simulated courier assignment separately from the real `DeliveryTracking` route record.
- [x] Show the selected courier in customer order details only after successful order submission.
- [x] Show the selected courier in authorized admin order details.
- [x] Keep delivery tracking unavailable while payment verification is pending.
- [x] Activate the existing Mapbox tracking lifecycle only through the approved admin transition to `OUT_FOR_DELIVERY`.
- [x] Do not use the simulated candidate distance as the authoritative Mapbox dispatch-route distance.
- [x] Keep customer-facing copy clear that matching and courier movement are simulated.

### Task 24.10 — Security, accessibility, and tests

- [x] Test guest-session isolation for checkout intents and candidate selection.
- [x] Test direct-route access, expired intents, altered candidate IDs, altered distances, and changed locations.
- [x] Test deterministic five-to-seven candidate generation and uniqueness from the 30-profile catalogue.
- [x] Test candidate ordering and stable refresh behavior.
- [x] Test pickup bypass and delivery location requirements.
- [x] Test the confirmation redirect and final transactional order snapshot.
- [x] Test rate limiting, offline recovery, retry behavior, and double-click prevention.
- [x] Test keyboard navigation, focus visibility, screen-reader announcements, and reduced motion.
- [x] Validate no horizontal overflow at 360px, 390px, 430px, tablet, and desktop widths.
- [x] Run ESLint, strict TypeScript, the full test suite, storefront/admin production builds, database health, and responsive checks.

**Completion:** a delivery customer with a valid cart, recharge choice, and server-verified location receives a stable set of five to seven clearly simulated nearby courier options, selects one securely, and continues to recharge-code confirmation. Pickup checkout remains unchanged, tracking does not begin before administrator dispatch, and no browser-supplied assignment data is trusted.

**Verification:** Prisma schema and Railway migration, database health, ESLint, strict TypeScript, 220 tests, storefront and admin production builds, and responsive overflow checks at 360px, 390px, 430px, tablet, and desktop pass.

### Task 24.11 — Administrator delivery operations

- [x] Add a dedicated database-backed `/admin/deliveries` workspace.
- [x] Add real open-delivery, out-for-delivery, active-tracking, and missing-courier metrics.
- [x] Add search by order reference, customer, and delivery locality.
- [x] Add order-status, tracking-state, and courier filters.
- [x] Add whitelisted newest, oldest, nearest-courier, and earliest-arrival sorting.
- [x] Add server pagination, mobile delivery cards, and the responsive desktop table.
- [x] Show the complete preserved five-to-seven candidate set in authorized order details.
- [x] Allow `orders.write` administrators to reassign only among the preserved server-generated candidates.
- [x] Lock reassignment after dispatch, completion, or cancellation.
- [x] Update order and checkout-intent courier snapshots atomically.
- [x] Record every administrator reassignment in the order timeline and structured server log.
- [x] Reject forged candidate identifiers and orders without a preserved candidate set.
- [x] Reuse one candidate-set validation contract across customer checkout and admin operations.
- [x] Add the Deliveries entry to desktop and mobile admin navigation.
- [x] Preserve the exact 30-profile server-owned simulation catalogue; do not present simulated identities as real employees or provide misleading courier CRUD.

**Completion:** authorized administrators can now find and monitor every delivery, inspect the customer checkout candidate set, safely adjust the simulated assignment before dispatch, and continue into the existing Mapbox tracking workflow. The simulation contract remains explicit and no fake courier database records were created.

**Verification:** strict TypeScript, ESLint, formatting, all 254 tests, and both storefront and admin production builds pass. No database migration was required because the implementation reuses the existing authoritative checkout-intent candidate set, order courier snapshots, and audit timeline.

### Task 24.12 — Courier identity security hardening

- [x] Keep the 30 stable simulated profile identifiers in server-only catalogue and persistence boundaries.
- [x] Generate a cryptographically random opaque candidate ID for every candidate in each checkout set.
- [x] Return only candidate IDs, display names, simulated distance, and estimated duration to customer and admin interfaces.
- [x] Prevent public checkout and authorized admin views from serializing stable courier profile IDs.
- [x] Resolve the selected candidate ID to its stable profile ID only inside server services and transactions.
- [x] Bind customer selection to the owning guest session, opaque checkout intent, persisted candidate set, and expiration time.
- [x] Reject forged candidate IDs, cross-session access, expired candidate sets, and reuse after order submission.
- [x] Preserve compatibility for existing candidate sets by deriving non-reversible legacy candidate IDs server-side.
- [x] Validate candidate-ID length and character set at every customer and administrator write boundary.
- [x] Keep courier identities out of environment variables; environment files remain for credentials and deployment configuration only.

**Completion:** stable simulated courier identity never crosses a browser or API view boundary. Browsers operate only on temporary opaque candidate IDs, while authoritative order and checkout snapshots remain server-owned.

**Verification:** ESLint passes without warnings, strict TypeScript and formatting pass, all 274 tests pass, and both storefront and admin production builds compile successfully.

---

## Phase 25 — Profit-protected bulk special offers

Tasks 25.1–25.10 are implemented and verified. The dedicated offer-results view, offer-aware cart identity, server-authoritative offer validation, transactional checkout snapshots, responsive layouts, ordinary-purchase compatibility, private cost editing, admin order snapshots, and centralized campaign monitoring are complete.

### Task 25.10 — Admin operations gap closure

- [x] Add private cost editing to normal single and bulk product workflows.
- [x] Display immutable accepted-offer details in authorized admin order views.
- [x] Add the real `/admin/offers` campaign workspace and navigation entry.
- [x] Add campaign metrics, search, status filtering, pagination, and empty states.
- [x] Replace stale admin overview placeholders with real PostgreSQL metrics and orders.
- [x] Preserve existing authorized category lifecycle controls as the single write boundary.
- [x] Add regression coverage for campaign grouping and cost validation.

**Verification:** ESLint, strict TypeScript, formatting, all 258 tests, and storefront and admin production builds pass.

See [Task 25 — Special offers](./TASK_25_SPECIAL_OFFERS.md) for the complete business contract, implementation checklist, security rules, and final verification record.

---

## Phase 26 — Recharge confirmation and mail foundation

Tasks 26.1–26.9 are implemented and verified.

- [x] Build a typed, server-authoritative confirmation view from the guest checkout intent.
- [x] Revalidate real cart products, prices, currencies, and offers before enabling submission.
- [x] Build reusable mobile-first confirmation shell, hero, progress, and order-summary components.
- [x] Use real ordered product imagery without mock or stock content.
- [x] Preserve numeric validation, encryption, rate limiting, idempotency, and pending statuses.
- [x] Install Nodemailer and add a server-only validated Gmail SMTP transport.
- [x] Add private SMTP environment slots and the `mail:health` verification command.
- [x] Configure the Gmail sender, App Password, sender address, and notification destination.
- [x] Verify live Gmail delivery and implement reliable idempotent order notifications.
- [x] Add masked order emails with complete operational details and secure admin deep links.
- [x] Add Owner/Manager-only audited code reveal and atomic payment approval.
- [x] Add notification retry status and pending-verification dashboard visibility.
- [x] Preserve honest customer pending status and secure real-order navigation.

**Verification:** Railway migration deployed; Gmail delivery accepted; ESLint, strict TypeScript, formatting, all 271 tests, and storefront and admin production builds pass.

See [Phase 26 — Recharge confirmation](./TASK_26_RECHARGE_CONFIRMATION.md) for the complete implementation and verification record.
