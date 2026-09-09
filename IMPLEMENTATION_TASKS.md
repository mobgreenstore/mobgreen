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

- [ ] Install Prisma dependencies.
- [ ] Configure the PostgreSQL connection through environment variables.
- [ ] Add Prisma client generation.
- [ ] Create the initial migration.
- [ ] Add database health verification.
- [ ] Do not create fake product or order seed data.

### Task 2.2 — Database models

- [ ] Create `AdminUser`.
- [ ] Create `Category`.
- [ ] Create `Product`.
- [ ] Create `ProductImage`.
- [ ] Create `ProductPriceOption` with weight, unit, currency, and integer minor price.
- [ ] Create `Order`.
- [ ] Create `OrderItem` snapshots.
- [ ] Create `OrderStatusEvent`.
- [ ] Create `StoreSettings`.
- [ ] Add timestamps, unique constraints, indexes, and archive/status fields.

### Task 2.3 — Server boundaries

- [ ] Create a server-only database client.
- [ ] Create repository interfaces and Prisma implementations.
- [ ] Create service result/error types.
- [ ] Create Zod schemas for every write boundary.
- [ ] Add transaction helpers.
- [ ] Add structured server logging without exposing secrets.
- [ ] Ensure UI components never import Prisma.

**Completion:** the application can store real business data through tested service boundaries.

---

## Phase 3 — Real admin authentication

### Task 3.1 — Authentication backend

- [ ] Select and install the approved session implementation.
- [ ] Implement secure password hashing.
- [ ] Create a one-time real admin bootstrap command.
- [ ] Implement sign-in and sign-out.
- [ ] Use secure, HTTP-only, same-site cookies.
- [ ] Add login rate limiting.
- [ ] Return generic authentication errors.

### Task 3.2 — Authorization

- [ ] Protect `/admin` workspace routes.
- [ ] Authorize every admin Server Action and Route Handler.
- [ ] Redirect unauthenticated requests to `/admin/login`.
- [ ] Prevent open redirects.
- [ ] Test unauthorized reads and writes.

### Task 3.3 — Authentication frontend

- [ ] Connect the existing admin login shell to the real sign-in action.
- [ ] Add validation, pending, error, and success behavior.
- [ ] Add an admin account menu and sign-out action.

**Completion:** only the real administrator can access or change business data.

---

## Phase 4 — Real category management

### Task 4.1 — Category backend

- [ ] Implement category validation.
- [ ] Implement unique slug generation.
- [ ] Implement create, list, get, update, reorder, activate, and archive services.
- [ ] Prevent unsafe deletion of referenced categories.
- [ ] Add authorization and tests.

### Task 4.2 — Category frontend

- [ ] Build the real admin categories list.
- [ ] Add search and status filtering.
- [ ] Build the create-category form.
- [ ] Build the edit-category form.
- [ ] Add activation/archive confirmation.
- [ ] Add loading, empty, validation, and error states.
- [ ] Use real database categories only.

**Completion:** the administrator can create the first real categories that later appear in the storefront.

---

## Phase 5 — Cloudinary image management

### Task 5.1 — Secure upload backend

- [ ] Install the Cloudinary SDK only in this phase.
- [ ] Validate Cloudinary environment variables.
- [ ] Create authenticated upload signatures or a controlled server upload route.
- [ ] Restrict file formats, sizes, and dimensions.
- [ ] Generate safe storage keys/folders.
- [ ] Store Cloudinary public ID, URL, dimensions, alt text, position, and cover state.
- [ ] Handle replacement and cleanup safely.

### Task 5.2 — Upload frontend

- [ ] Connect `ImageUploader` to the real upload workflow.
- [ ] Add file validation before upload.
- [ ] Add progress, retry, replace, remove, and error states.
- [ ] Build image reordering.
- [ ] Build cover-image selection.
- [ ] Require useful alternative text.
- [ ] Test phone image selection and upload.

**Completion:** categories and products can use real Cloudinary images with secure server authorization.

---

## Phase 6 — Real product management

### Task 6.1 — Product backend

- [ ] Implement product schemas and services.
- [ ] Implement product create, list, get, update, activate, draft, and archive operations.
- [ ] Validate category relationships.
- [ ] Validate at least one weight-price option before activation.
- [ ] Store prices as integer minor units.
- [ ] Store currency explicitly on every price option.
- [ ] Prevent automatic cross-currency conversion.
- [ ] Add real image relationships.
- [ ] Add transactions and tests.

### Task 6.2 — Product admin frontend

- [ ] Build the real products table/list.
- [ ] Add search, category, currency, and status filters.
- [ ] Build the product form.
- [ ] Connect the category selector to real categories.
- [ ] Connect Cloudinary image management.
- [ ] Connect the reusable `WeightPriceEditor`.
- [ ] Support grams and kilograms only.
- [ ] Provide GBP, EUR, and USD through the reusable currency dropdown.
- [ ] Add product preview using the current unsaved form values, not fake stored data.
- [ ] Add loading, empty, validation, error, and success states.

**Completion:** admin can enter the first real products, images, weights, currencies, and prices.

---

## Phase 7 — Real customer catalog

### Task 7.1 — Catalog backend

- [ ] Query active categories only.
- [ ] Query active products and active price options only.
- [ ] Implement category filtering.
- [ ] Implement normalized product search.
- [ ] Implement whitelisted sorting.
- [ ] Implement server pagination.
- [ ] Implement public product lookup by slug.
- [ ] Return dedicated typed view models, not raw database records.
- [ ] Add cache rules and invalidation after admin changes.

### Task 7.2 — Catalog frontend

- [ ] Replace the foundation catalog shell with real database results.
- [ ] Build real category tabs from active categories.
- [ ] Keep `All goods` as the first tab.
- [ ] Synchronize category, search, sort, and page with URL parameters.
- [ ] Build real product cards.
- [ ] Format each price with its actual currency.
- [ ] Add product result count.
- [ ] Add loading, empty-category, no-search-result, and error states.
- [ ] Validate 360px, 390px, 430px, tablet, and desktop layouts.

### Task 7.3 — Product details

- [ ] Build the real image gallery.
- [ ] Display category, name, description, and availability.
- [ ] Connect the real weight-price selector.
- [ ] Show the selected option's exact currency and price.
- [ ] Add structured metadata and correct page metadata.
- [ ] Handle inactive or missing products with a real not-found response.

**Completion:** customers browse only real products entered by the administrator.

---

## Phase 8 — Real shopping cart

### Task 8.1 — Cart domain

- [ ] Define the cart line identity as product plus price-option ID.
- [ ] Create add, update quantity, remove, and clear operations.
- [ ] Persist only product IDs, price-option IDs, and quantities locally.
- [ ] Never trust locally stored prices.
- [ ] Revalidate current product availability and prices on the server.
- [ ] Define the single-currency cart rule before enabling checkout.

### Task 8.2 — Cart frontend

- [ ] Connect `Add to cart` to the selected real price option.
- [ ] Build the cart page using reusable components.
- [ ] Add quantity controls and removal confirmation.
- [ ] Display current server-confirmed prices.
- [ ] Warn when a product, price, or availability changed.
- [ ] Add empty, loading, error, and recovery states.
- [ ] Add accessible cart-count announcements.

**Completion:** the cart contains real catalog selections and never treats browser prices as authoritative.

---

## Phase 9 — Checkout and real order creation

### Task 9.1 — Confirm required business behavior

- [ ] Define Pickup behavior.
- [ ] Define Delivery availability, address rules, areas, and fees.
- [ ] Define `Recharge from store` behavior.
- [ ] Define `Recharge online` and the external recharge website handoff.
- [ ] Decide whether checkout permits only one currency per order.
- [ ] Define customer confirmation/notification behavior.

Implementation must pause on these business rules instead of inventing them.

### Task 9.2 — Order backend

- [ ] Validate guest customer details.
- [ ] Validate fulfillment and payment method.
- [ ] Load authoritative products and prices.
- [ ] Calculate totals with integer arithmetic.
- [ ] Reject mixed currencies unless an approved policy exists.
- [ ] Generate a safe public order reference.
- [ ] Create the order and item snapshots in one transaction.
- [ ] Add idempotency to prevent duplicate submissions.
- [ ] Add rate limiting.
- [ ] Record the initial order-status event.
- [ ] Add integration tests.

### Task 9.3 — Checkout frontend

- [ ] Build the guest checkout form from reusable fields.
- [ ] Build Pickup/Delivery selection from approved behavior.
- [ ] Build Recharge-method selection from approved behavior.
- [ ] Display the authoritative order summary.
- [ ] Add pending, field-error, server-error, and retry states.
- [ ] Prevent double submission.
- [ ] Build the real order-success page with the returned reference.

**Completion:** an anonymous customer can create a valid, non-duplicate real order.

---

## Phase 10 — Real admin order operations

### Task 10.1 — Orders backend

- [ ] Implement paginated order listing.
- [ ] Search by reference, customer name, and phone.
- [ ] Filter by order status, payment status, payment method, fulfillment, currency, and date.
- [ ] Whitelist sorting fields.
- [ ] Implement order details.
- [ ] Define and enforce valid status transitions.
- [ ] Create a status event for every change.
- [ ] Authorize all operations.
- [ ] Add tests.

### Task 10.2 — Orders frontend

- [ ] Replace the admin order shell with the real orders table.
- [ ] Build the mobile order-card alternative.
- [ ] Add real search, filters, sorting, and pagination.
- [ ] Add currency-aware totals.
- [ ] Add typed order and payment status badges.
- [ ] Build the order details page.
- [ ] Build the status timeline.
- [ ] Build the authorized status-change action.
- [ ] Add loading, empty, no-result, error, and success states.

**Completion:** admin can find, inspect, and process every real order.

---

## Phase 11 — Integration hardening

- [ ] Verify cache invalidation after every admin mutation.
- [ ] Verify authorization for every private route and action.
- [ ] Verify rate limits.
- [ ] Verify money calculations for every supported currency.
- [ ] Verify no mixed-currency checkout bypass.
- [ ] Verify Cloudinary failure recovery.
- [ ] Verify order idempotency.
- [ ] Complete accessibility testing.
- [ ] Complete 360px, 390px, 430px, tablet, and desktop testing.
- [ ] Run unit, integration, and end-to-end tests.
- [ ] Remove all foundation placeholders superseded by real features.
- [ ] Confirm there is no mock business data in application runtime code.

---

## Phase 12 — GitHub and Railway deployment (last phase)

- [ ] Initialize or confirm the Git repository only when approved.
- [ ] Review ignored files and ensure `.env` is never committed.
- [ ] Create the GitHub repository and push the reviewed code.
- [ ] Create Railway services.
- [ ] Provision the production PostgreSQL database.
- [ ] Configure production environment variables.
- [ ] Configure Cloudinary production credentials.
- [ ] Run production migrations safely.
- [ ] Create the real production admin account securely.
- [ ] Configure domain and HTTPS.
- [ ] Configure backups, health checks, and logs.
- [ ] Run production smoke tests.

**Completion:** MOB GREENS is deployed through GitHub to Railway with real infrastructure and verified critical workflows.

---

## Immediate next task

Start **Task 1.1 — Complete form foundations** only.

Implementation order:

1. `Label` and `FieldError`.
2. `FormField` composition contract.
3. `TextField` and `TextArea`.
4. `Select` for later currency/category choices.
5. `Checkbox`, `RadioGroup`, and `Switch`.
6. Accessibility and interaction tests.
7. Light theme, dark theme, 360px, 390px, 430px, and desktop visual validation.

Do not build product cards or business pages during Task 1.1. They depend on the component contracts established here.
