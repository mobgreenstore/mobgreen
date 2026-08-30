# Product Catalog and Ordering Platform — Project Blueprint

## 1. Document purpose

This document defines the project before implementation begins. It is the shared reference for product scope, frontend experience, backend design, reusable components, data structures, workflows, and the order in which the platform should be built.

This phase creates documentation only. No application code, packages, database, authentication provider, or image service should be installed until the decisions in this document are accepted.

---

## 2. Product overview

The product is a mobile-first catalog and ordering platform with two connected experiences:

1. **Customer storefront** — customers quickly discover products by category, search and sort the catalog, select an amount/quantity with its defined price, add products to a cart, and place an order.
2. **Admin workspace** — an administrator manages categories, products, product images, quantity-based prices, and all customer orders from a professional operational interface.

The first version is intentionally focused. It is not a marketplace, accounting system, delivery platform, or complex inventory system.

### Core product promise

- Customers can understand what is sold immediately after opening the site.
- The experience is excellent on a phone, not merely usable on one.
- The admin can manage the catalog and review orders without technical assistance.
- Customer and admin screens share the same visual language and reusable component foundation.
- The codebase stays compact, modular, typed, and easy to extend.

---

## 3. Recommended implementation approach

### Decision: one full-stack Next.js monolith

Use a single Next.js application containing:

- the customer-facing routes;
- the protected admin routes;
- server-rendered pages and server actions;
- Route Handlers for explicit API endpoints;
- business services;
- database access;
- image-upload integration.

This is the simplest architecture that still provides good boundaries. It avoids maintaining separate customer, admin, and backend projects and makes it easy to share typography, layout primitives, cards, forms, status components, types, validation, and utilities.

The existing `FRONTEND/user/admin` directory should not become the permanent architecture. When coding begins, normalize the project to one application root under `FRONTEND/app` (recommended), or rename `FRONTEND/user` to the chosen application name. Do not keep the admin application nested inside the user application.

### Why this fits the project

- One dependency tree, build, deployment, and environment configuration.
- Direct type sharing between UI, validation, business logic, and persistence.
- Server Components reduce unnecessary client-side JavaScript.
- Admin and storefront remain visually consistent.
- Route groups keep each experience separate without duplicating the design system.
- A service layer prevents pages or Route Handlers from becoming large backend files.

### Architecture boundary

The application is monolithic, but it must not be one large file. The intended flow is:

`Page or UI component -> server action / Route Handler -> service -> repository -> database`

UI code must never query the database directly. Route files should coordinate a request, not contain all business rules.

---

## 4. MVP scope

### Included in version one

- Public storefront welcome/catalog page.
- Category tabs with an `All` option.
- Product search and sorting.
- Product cards with real product images.
- Product detail view.
- Quantity/amount choices with a price for each choice.
- Shopping cart.
- Simple checkout/customer-information form.
- Order confirmation and order reference.
- Admin authentication.
- Admin overview/dashboard.
- Category creation, editing, activation/deactivation, and ordering.
- Product creation, editing, activation/deactivation, image management, and category assignment.
- Quantity-based pricing management for every product.
- Orders table with search, filtering, sorting, pagination, and status.
- Order detail view and status updates.
- Responsive layouts, validation, loading states, empty states, and error states.

### Deliberately excluded from version one

- Online card/mobile-money payment.
- Multi-vendor support.
- Advanced warehouse or stock management.
- Delivery-driver tracking.
- Promotions, coupons, loyalty points, and reviews.
- Customer chat.
- Multiple administrator permission levels.
- Complex analytics and accounting reports.

These can be added later only after the ordering flow is stable.

### Confirmed initial business decisions

- A product belongs to one category in version one.
- A product may have several images; one image is marked as the cover.
- The store/application name is **MOB GREENS**.
- Product measurements use grams (`g`) and kilograms (`kg`).
- Each product has one or more purchasable weight options, for example `250 g`, `500 g`, or `1 kg`; each option has its own price and currency.
- The selected amount option is an order line, and customers can increase the number of those packs in the cart.
- Prices are stored as integer minor units, never floating-point numbers.
- The catalog supports multiple currencies. The administrator explicitly selects a currency for every price option; amounts with different currencies are never automatically added or converted without a defined exchange-rate/payment policy.
- Supported initial currency choices are configured centrally rather than hard-coded inside forms. The initial set is `GBP`, `EUR`, and `USD`, and it can be extended later.
- Customers always order anonymously as guests; there are no customer accounts. Only the administrator signs in.
- Checkout collects name, phone number, delivery/pickup preference, address when relevant, and an optional note.
- Fulfillment exposes `Pickup` and `Delivery`, but their business logic will be specified later.
- Payment exposes two choices only: `Recharge from store` and `Recharge online`. Their behavior and external gift-card recharge integration will be specified later; no payment logic is implemented during the foundation phase.
- Cloudinary is the selected production image provider.
- Railway is the selected deployment platform. Deployment and GitHub connection are deliberately postponed until the final release phase.
- Product/category deletion should normally be a reversible archive/deactivation operation so old orders retain correct history.

---

## 5. Users and permissions

### Customer

- Can browse active categories and products.
- Can search, sort, and filter the visible catalog.
- Can view product details and amount-based prices.
- Can manage a local cart.
- Can submit an order and receive its reference.
- Cannot access any `/admin` route or mutation.

### Administrator

- Signs in through a protected admin login.
- Can create and manage categories.
- Can create and manage products, images, and amount-price options.
- Can see every order in a table.
- Can open complete order details.
- Can update order and payment statuses.
- Can see basic dashboard totals and recent orders.

Every admin mutation must be authorized on the server; hiding buttons in the browser is not security.

---

## 6. Information architecture and pages

### Customer routes

| Route | Page | Primary purpose |
|---|---|---|
| `/` | Welcome and catalog | Explain the offer immediately and let the customer browse without an extra landing-page step. |
| `/products/[slug]` | Product details | Show images, description, available amount-price options, and add-to-cart action. |
| `/cart` | Cart | Review products, chosen amount options, quantities, subtotal, and remove/update actions. |
| `/checkout` | Checkout | Collect customer and fulfillment details and submit the order. |
| `/order/success/[reference]` | Confirmation | Confirm submission and show the reference and concise next steps. |

The home page is both the welcome page and the catalog. It should not waste mobile space on a large decorative hero.

### Admin routes

| Route | Page | Primary purpose |
|---|---|---|
| `/admin/login` | Admin sign-in | Secure, focused authentication. |
| `/admin` | Dashboard | Show useful totals, attention items, and recent orders. |
| `/admin/categories` | Categories | View, search, reorder, activate, edit, and add categories. |
| `/admin/categories/new` | New category | Create a category with a name, description, image, and display order. |
| `/admin/categories/[id]/edit` | Edit category | Update category information and visibility. |
| `/admin/products` | Products | Search, filter by category/status, inspect, edit, and add products. |
| `/admin/products/new` | New product | Add product information, images, category, and amount-price options. |
| `/admin/products/[id]/edit` | Edit product | Maintain product content, images, prices, and status. |
| `/admin/orders` | Orders | Display all orders in an operational table with filters and status. |
| `/admin/orders/[id]` | Order details | Show customer, line items, totals, fulfillment data, history, notes, and status actions. |
| `/admin/settings` | Settings | Store name, contact information, currency, and basic ordering configuration. |

For mobile admin use, table rows may become structured list cards, but desktop and tablet must retain the true table experience.

---

## 7. Customer experience workflows

### 7.1 Welcome and discovery

1. The customer sees a compact header with brand, search access, and cart count.
2. A short welcome statement explains what can be ordered in one or two lines.
3. A visible search field includes a real search icon and an accessible label.
4. Horizontally scrollable category tabs show `All` followed by active categories.
5. Selecting a tab updates the product results immediately and preserves the selected state clearly.
6. A compact sort control supports at least `Recommended`, `Price: low to high`, `Price: high to low`, and `Newest`.
7. The result count and active filters remain understandable.
8. Products appear in a one-column or two-column mobile grid depending on available width, never as compressed desktop cards.

### 7.2 Product selection

1. The customer opens a product card.
2. The product page shows the image gallery, name, category, concise description, and availability.
3. Amount options are presented as selectable controls such as `1 pack — 2,500` and `5 packs — 11,500`.
4. The currently selected option controls the displayed price.
5. The customer chooses cart quantity and adds the item.
6. A restrained toast or inline confirmation reports success; no emoji or sticker graphics are used.

### 7.3 Cart and checkout

1. The cart groups each product with its selected amount option.
2. The customer can change quantity or remove a line.
3. The subtotal is always visible and recalculated on the server during checkout.
4. Checkout validates contact and fulfillment information.
5. Submission creates an immutable order snapshot of names, amount labels, and prices.
6. The success page provides the order reference and explains what happens next.

### 7.4 Customer edge states

- Empty catalog.
- No products in a selected category.
- No search result, with a clear reset action.
- Product or amount option became unavailable.
- Empty cart.
- Checkout validation failure.
- Connection/submission failure that does not silently duplicate an order.

---

## 8. Admin experience workflows

### 8.1 Add a category

1. Open Categories and select `Add category`.
2. Enter name, optional short description, image, and display position.
3. Preview the uploaded image and allow replacement/removal.
4. Validate uniqueness and image requirements.
5. Save, return to the list, and show a clear success message.

### 8.2 Add a product

1. Open Products and select `Add product`.
2. Enter name, category, short description, full description, and visibility.
3. Upload several images, choose the cover, reorder them, and remove mistakes before saving.
4. Add at least one amount-price row. Each row contains a label, amount value if needed, unit, price, optional comparison price, and availability.
5. Preview the customer-facing product summary.
6. Save as active or draft.
7. Return to the product list with the created product visible.

### 8.3 Manage orders

1. Open Orders and see all orders in a table.
2. Search by reference, customer name, or phone number.
3. Filter by order status, payment status, and date.
4. Sort by newest, oldest, or total.
5. Open a row to see full details.
6. Update the order status only through permitted transitions.
7. Record each status change in an order-event history.

### Suggested order statuses

`PENDING -> CONFIRMED -> PROCESSING -> READY -> COMPLETED`

Optional branches:

- `PENDING` or `CONFIRMED -> CANCELLED`
- `READY -> OUT_FOR_DELIVERY -> COMPLETED` when delivery is used

Status colors are indicators, not decoration:

- Neutral/black/gray: pending or informational.
- Blue: confirmed/in progress.
- Green: completed/success.
- Red: cancelled, destructive, or error.

Text labels and icons must accompany color so status is never communicated by color alone.

### Orders table columns

| Column | Behavior |
|---|---|
| Order | Reference and creation date. |
| Customer | Name and phone number. |
| Items | Line count or compact summary. |
| Total | Properly formatted currency. |
| Payment | Text status badge. |
| Order status | Text status badge. |
| Fulfillment | Pickup/delivery. |
| Action | `View details` menu/action with an accessible label. |

The table requires a loading skeleton, empty state, no-filter-results state, error state, pagination, and narrow-screen alternative.

---

## 9. Frontend design direction

### Visual character

The interface should feel calm, intentional, contemporary, and operational—not like a generic generated dashboard. The design should rely on hierarchy, spacing, proportion, image quality, and typography instead of excessive gradients, floating shapes, glass effects, or decoration.

### Color system

- Main palette: black, white, and carefully selected neutral grays.
- Blue: information, selected operational states, or links when necessary.
- Green: success and completed states.
- Red: errors, cancellation, and destructive actions.
- Do not use blue, green, or red as large decorative background areas.
- All colors must pass WCAG AA contrast for their text size and context.

### Typography

- Use one high-quality sans-serif family throughout, preferably `Inter` or `Geist` loaded through `next/font`.
- Use a consistent type scale rather than arbitrary sizes.
- Keep body copy at least 16px on customer mobile screens.
- Use strong but restrained weight contrast; avoid making every heading extra bold.
- Use tabular numerals for prices, totals, order references, and table data.
- Limit readable text widths and keep descriptions concise.

Suggested scale:

| Token | Size / line height | Use |
|---|---|---|
| `display` | 36/40 desktop, 30/36 mobile | Rare welcome heading. |
| `h1` | 30/36 desktop, 26/32 mobile | Page title. |
| `h2` | 22/28 | Section title. |
| `h3` | 18/24 | Card or subsection title. |
| `body` | 16/24 | Primary reading text. |
| `small` | 14/20 | Metadata and compact controls. |
| `caption` | 12/16 | Supporting labels only. |

### Spacing and sizing

- Use a 4px base spacing system with common steps of 4, 8, 12, 16, 20, 24, 32, 40, 48, and 64px.
- Standard mobile page padding: 16px; larger phones/tablets: 20–24px; desktop content: 32px.
- Minimum interactive target: 44x44px.
- Keep one consistent radius family; use moderate radii rather than pill-shaped containers everywhere.
- Use borders and spacing before shadows. Shadows should be subtle and purposeful.
- Respect device safe-area insets for sticky mobile navigation and cart actions.

### Iconography and imagery

- Use a consistent SVG icon library such as Lucide React.
- Do not use emoji, stickers, decorative clip art, or mixed icon styles.
- Every icon-only control needs an accessible name and visible tooltip where appropriate.
- Product photography should use consistent aspect ratios and `next/image` optimization.
- Image placeholders should be neutral and branded, not novelty illustrations.

### Motion

- Keep motion brief and functional: menu opening, tab selection, toast arrival, and modal transitions.
- Respect `prefers-reduced-motion`.
- Do not animate every card or use continuous decorative movement.

---

## 10. Mobile-first requirements

Mobile behavior is part of the design definition, not a later responsive pass.

- Design and review first at 360px, 390px, and 430px widths.
- No horizontal page overflow.
- Category tabs may scroll horizontally with a visible selected state.
- Search must be easy to reach and should not collapse into an icon-only experience by default.
- Important product information must appear before secondary descriptions.
- Sticky bottom cart/checkout actions must account for safe areas and must not cover content.
- Forms use correct input modes (`tel`, numeric, email) and useful autocomplete attributes.
- Validation appears next to the relevant field and summary focus is managed accessibly.
- Mobile admin navigation uses a controlled drawer or compact navigation; customer and admin navigation remain distinct.
- Admin tables switch to well-structured order cards below the table breakpoint while preserving the same actions and information priority.
- Dialogs become bottom sheets or full-height panels where that improves phone usability.
- Test at 200% text zoom and with long category/product names.

---

## 11. Reusable frontend component system

Reusability is required, but abstractions should follow real repeated patterns. Do not create a universal component with dozens of unrelated props.

### Foundation primitives

- `Button` — primary, secondary, outline, ghost, and destructive variants.
- `IconButton` — square icon action with mandatory accessible label.
- `TextField`, `TextArea`, `Select`, `Checkbox`, `RadioGroup`, `Switch`.
- `FormField` — label, hint, required state, error, and input association.
- `Badge` and `StatusBadge`.
- `Tabs` and `CategoryTabs`.
- `Card`, `Panel`, `Divider`, `Container`, `Stack`, and `Cluster` layout helpers.
- `Dialog`, `Drawer`, `BottomSheet`, `Popover`, `DropdownMenu`, and `Tooltip`.
- `Toast` for brief action feedback.
- `Skeleton`, `Spinner`, `EmptyState`, `ErrorState`, and `InlineAlert`.
- `Pagination` and `DataTable` building blocks.

Use accessible headless primitives for complex interaction behavior, then style them with the project’s own design tokens.

### Shared commerce components

- `Money` — the only price-formatting presentation component.
- `ResponsiveImage` and `ImageGallery`.
- `SearchField`.
- `SortMenu`.
- `QuantityStepper`.
- `AmountOptionPicker`.
- `ProductCard`.
- `ProductGrid`.
- `CartItem`.
- `OrderSummary`.
- `OrderStatusTimeline`.

### Customer composition components

- `StoreHeader`.
- `WelcomeIntro`.
- `CatalogToolbar`.
- `CategoryTabList`.
- `MobileCartBar`.
- `CheckoutForm`.
- `OrderConfirmation`.

### Admin composition components

- `AdminShell`.
- `AdminSidebar` and `AdminMobileNav`.
- `PageHeader` with title, description, and actions.
- `MetricCard`.
- `FilterBar`.
- `OrdersTable` and `OrderMobileList`.
- `CategoryForm`.
- `ProductForm`.
- `AmountPriceEditor` for adding/removing/reordering pricing rows.
- `ImageUploader` and `ImageReorderGrid`.
- `DeleteOrArchiveDialog`.
- `OrderDetailsPanel`.

### Component ownership rules

- `components/ui`: domain-neutral visual primitives only.
- `components/shared`: reusable components that understand common application concepts.
- `features/<feature>/components`: components specific to catalog, cart, checkout, categories, products, or orders.
- Pages compose feature components; they should not define a second design system.
- Business mutations belong in feature actions/services, not inside visual components.
- Prefer server components; add `use client` only at the smallest interactive boundary.
- Keep presentation, validation schema, server mutation, and database logic in separate files.

---

## 12. Proposed project structure

```text
verification/
├── PROJECT_BLUEPRINT.md
├── FRONTEND/
│   └── app/                         # One Next.js full-stack application
│       ├── public/
│       ├── prisma/
│       │   ├── schema.prisma
│       │   └── migrations/
│       ├── src/
│       │   ├── app/
│       │   │   ├── (store)/         # Public customer routes
│       │   │   │   ├── page.tsx
│       │   │   │   ├── products/[slug]/page.tsx
│       │   │   │   ├── cart/page.tsx
│       │   │   │   ├── checkout/page.tsx
│       │   │   │   └── order/success/[reference]/page.tsx
│       │   │   ├── admin/
│       │   │   │   ├── (auth)/login/page.tsx
│       │   │   │   └── (workspace)/
│       │   │   │       ├── layout.tsx
│       │   │   │       ├── page.tsx
│       │   │   │       ├── categories/
│       │   │   │       ├── products/
│       │   │   │       ├── orders/
│       │   │   │       └── settings/
│       │   │   ├── api/             # Only endpoints that need HTTP boundaries
│       │   │   ├── layout.tsx
│       │   │   ├── error.tsx
│       │   │   ├── not-found.tsx
│       │   │   └── globals.css
│       │   ├── components/
│       │   │   ├── ui/
│       │   │   └── shared/
│       │   ├── features/
│       │   │   ├── auth/
│       │   │   ├── catalog/
│       │   │   ├── cart/
│       │   │   ├── checkout/
│       │   │   ├── categories/
│       │   │   ├── products/
│       │   │   └── orders/
│       │   ├── server/
│       │   │   ├── db/
│       │   │   ├── repositories/
│       │   │   ├── services/
│       │   │   ├── auth/
│       │   │   └── storage/
│       │   ├── lib/
│       │   │   ├── env.ts
│       │   │   ├── money.ts
│       │   │   ├── result.ts
│       │   │   └── utils.ts
│       │   ├── styles/
│       │   │   └── tokens.css
│       │   └── types/
│       ├── tests/
│       │   ├── unit/
│       │   ├── integration/
│       │   └── e2e/
│       ├── .env.example
│       ├── next.config.ts
│       ├── package.json
│       └── tsconfig.json
└── docs/                             # Add focused documents only as needed
    ├── UI_SPEC.md
    ├── API_CONTRACT.md
    └── DATA_MODEL.md
```

Do not create every empty folder on day one. Add a folder when the first real file for that boundary is implemented.

### Feature folder example

```text
features/products/
├── actions/
│   ├── create-product.ts
│   └── update-product.ts
├── components/
│   ├── product-card.tsx
│   ├── product-form.tsx
│   └── amount-price-editor.tsx
├── schemas/
│   └── product-schema.ts
├── queries/
│   └── get-products.ts
└── types.ts
```

This keeps each business area discoverable without putting its database rules inside its UI components.

---

## 13. Backend modules and responsibilities

The backend lives inside the Next.js application but uses clear modules.

### Auth module

- Admin sign-in and sign-out.
- Password verification using a strong password hash.
- Secure session creation.
- Admin-route and admin-mutation authorization.
- Login rate limiting and generic failure messages.

### Catalog module

- Public category and product queries.
- Search, category filtering, sorting, and pagination.
- Return only active categories, products, images, and price options to public routes.

### Category module

- Create and update categories.
- Enforce unique normalized slugs.
- Manage display order and active state.
- Prevent destructive removal when historical relationships exist.

### Product module

- Create and update products.
- Validate category and pricing rows.
- Manage active/draft/archived state.
- Manage product images and cover selection.
- Keep amount-price options ordered and uniquely identifiable.

### Order module

- Validate checkout input.
- Load authoritative product prices from the database.
- Reject inactive or missing choices.
- Calculate totals on the server in one transaction.
- Create an order and immutable order-item snapshots.
- Generate a non-sequential public order reference.
- List, filter, paginate, and inspect orders for admin.
- Enforce valid status transitions and write status history.

### Media module

- Validate file type, size, and image dimensions.
- Upload to an image storage provider.
- Store provider key, URL, dimensions, alternative text, position, and cover state.
- Remove or replace images safely after database changes succeed.

---

## 14. Data model

### `AdminUser`

- `id`
- `email` (unique)
- `passwordHash`
- `name`
- `isActive`
- `createdAt`, `updatedAt`

### `Category`

- `id`
- `name`
- `slug` (unique)
- `description` (optional)
- `imageUrl` / storage key (optional)
- `position`
- `isActive`
- `createdAt`, `updatedAt`

### `Product`

- `id`
- `categoryId`
- `name`
- `slug` (unique)
- `shortDescription`
- `description` (optional)
- `status`: `DRAFT | ACTIVE | ARCHIVED`
- `createdAt`, `updatedAt`

### `ProductImage`

- `id`
- `productId`
- `storageKey`
- `url`
- `altText`
- `width`, `height`
- `position`
- `isCover`

### `ProductPriceOption`

- `id`
- `productId`
- `label` — customer-facing description such as `5 kg`.
- `amount` (optional numeric value).
- `unit` (optional normalized unit).
- `priceMinor` — integer minor currency units.
- `compareAtPriceMinor` (optional).
- `position`
- `isActive`
- `createdAt`, `updatedAt`

### `Order`

- `id`
- `reference` (unique, public safe identifier)
- `customerName`
- `customerPhone`
- `customerEmail` (optional)
- `fulfillmentType`: `PICKUP | DELIVERY`
- `address` (optional, required for delivery)
- `customerNote` (optional)
- `currency` — one order currency; mixed-currency cart checkout is not allowed unless a conversion policy is introduced later.
- `subtotalMinor`
- `deliveryFeeMinor`
- `totalMinor`
- `status`
- `paymentStatus`: `UNPAID | PENDING | PAID | REFUNDED`
- `paymentMethod`: `RECHARGE_FROM_STORE | RECHARGE_ONLINE`
- `createdAt`, `updatedAt`

### `OrderItem`

- `id`
- `orderId`
- `productId` (nullable reference for historical resilience)
- `priceOptionId` (nullable reference)
- `productNameSnapshot`
- `amountLabelSnapshot`
- `unitPriceMinor`
- `quantity`
- `lineTotalMinor`

### `OrderStatusEvent`

- `id`
- `orderId`
- `fromStatus` (nullable for creation)
- `toStatus`
- `note` (optional)
- `changedByAdminId` (nullable for system/customer creation)
- `createdAt`

### `StoreSettings`

- `id`
- `storeName`
- `supportPhone`
- `supportedCurrencyCodes`
- `orderPrefix`
- `pickupInstructions` (optional)
- `deliveryEnabled`
- `updatedAt`

Use database constraints for uniqueness and relationships in addition to application validation.

---

## 15. Server communication and API rules

### Communication strategy

- Use Server Components for read-heavy initial page rendering.
- Use Server Actions for application-owned form mutations when appropriate.
- Use Route Handlers for upload signatures, public integrations, webhooks, or endpoints that genuinely require an HTTP contract.
- Do not create an API endpoint merely to call it from a Server Component in the same application.
- Client components receive small serializable view models, not raw database records.

### Suggested HTTP endpoints where useful

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/catalog/products` | Client-driven search/filter pagination if needed after initial render. |
| `POST` | `/api/orders` | Submit an order with idempotency protection. |
| `POST` | `/api/admin/uploads/sign` | Prepare an authenticated direct image upload. |
| `GET` | `/api/admin/orders/export` | Optional later CSV export. |

Admin category/product/order forms can primarily use typed Server Actions.

### Request rules

- Validate every external input with Zod at the server boundary.
- Return a consistent result shape: success data or a typed error with field errors where appropriate.
- Never trust client-submitted totals or prices.
- Use database transactions for order creation and multi-record catalog updates.
- Add idempotency to order submission to prevent accidental duplicate orders.
- Paginate admin lists and public search results on the server.
- Whitelist sortable fields; never pass arbitrary client field names into database ordering.
- Log server errors with request context but never expose secrets or stack traces to users.

---

## 16. Recommended technology choices

Versions should be selected and locked only when installation begins.

### Core

- Next.js App Router.
- React.
- TypeScript with strict mode.
- PostgreSQL.
- Prisma ORM and migrations.
- Tailwind CSS for layout and styling with CSS custom properties for design tokens.

### UI and forms

- Radix UI primitives for accessible complex controls.
- Lucide React for consistent real SVG icons.
- Class Variance Authority for controlled component variants.
- React Hook Form for complex admin/customer forms.
- Zod for shared validation.
- TanStack Table for the admin orders/products tables.

### Authentication and infrastructure

- Auth.js for the protected admin session, or a small database-backed session implementation if Auth.js adds unnecessary complexity after evaluation.
- An S3-compatible service or Cloudinary for production product images; local files are only acceptable for development.
- A small database-backed or provider-backed rate limiter for login and public order creation.

### Testing and quality

- Vitest and React Testing Library for unit/component behavior.
- Playwright for critical customer and admin workflows.
- ESLint and Prettier.

Avoid adding a global state library initially. The cart can use a small focused context/store persisted locally, while server data stays server-owned. Add a query library only if later client-side synchronization genuinely requires it.

---

## 17. Accessibility and quality requirements

- Target WCAG 2.2 AA.
- All functionality must work with keyboard navigation.
- Use semantic headings, landmarks, forms, tables, buttons, and links.
- Maintain visible focus states.
- Associate every form control with its label and error message.
- Announce meaningful async results to assistive technology.
- Never use placeholder text as the only label.
- Provide useful alternative text for product images and empty alternative text for decorative images.
- Preserve table semantics on desktop.
- Avoid icon-only actions where text fits; otherwise supply accessible names.
- Confirm destructive actions and explain their consequence.
- Do not use color as the only signal.
- Support reduced motion and sufficient contrast.

---

## 18. Security and data integrity

- Hash passwords with Argon2id or bcrypt using an appropriate cost.
- Use secure, HTTP-only, same-site cookies for admin sessions.
- Protect admin routes and repeat authorization inside every server mutation.
- Validate upload MIME type, extension, size, and dimensions; generate storage keys server-side.
- Restrict accepted image formats and strip unsafe metadata where the provider supports it.
- Rate-limit login, search abuse if necessary, and order submission.
- Apply CSRF protections appropriate to the chosen action/session mechanism.
- Recalculate pricing from authoritative database records during checkout.
- Escape/render user content safely; do not accept arbitrary HTML descriptions initially.
- Use transactions for orders and price-option updates.
- Store secrets only in environment variables validated at startup.
- Never expose database identifiers unnecessarily in public URLs.
- Prefer archive/deactivate over permanent deletion of referenced business records.
- Maintain an order status history for operational accountability.

---

## 19. Performance requirements

- Optimize product images through `next/image` and correctly configured remote image hosts.
- Generate responsive image sizes rather than downloading desktop images on phones.
- Server-render catalog results for the initial page.
- Debounce client search only when using live search; keep URLs shareable through search parameters.
- Paginate instead of loading all products or orders.
- Keep interactive client component boundaries small.
- Avoid large UI/icon bundle imports.
- Use loading skeletons that match final geometry and reduce layout shifts.
- Cache public catalog reads carefully and invalidate them after admin mutations.
- Do not cache private admin data publicly.

Target quality checks should include Core Web Vitals, a slow mobile network profile, and a low-to-mid-range Android device profile.

---

## 20. Testing strategy

### Unit tests

- Money formatting and integer calculations.
- Valid order status transitions.
- Product price-option validation.
- Slug/reference generation.
- Cart calculations.

### Integration tests

- Product creation with images and multiple price options.
- Catalog filtering and sorting.
- Order creation uses server prices, not client totals.
- Duplicate order submission protection.
- Admin authorization and order status history.

### End-to-end critical paths

1. Customer selects a category, searches, opens a product, selects an amount, and adds it to cart.
2. Customer checks out and receives an order reference.
3. Admin signs in, creates a category, and creates a product with images and amount prices.
4. Admin finds the new order, opens details, and moves it through valid statuses.
5. Mobile customer and mobile admin layouts preserve all critical actions.

---

## 21. Step-by-step delivery plan

Only one phase should be designed and implemented in detail at a time.

### Phase 0 — Confirm product decisions

- Store name confirmed as MOB GREENS.
- Multi-currency price entry confirmed, initially GBP, EUR, and USD.
- Product measurements confirmed as grams and kilograms.
- Pickup and delivery choices confirmed; detailed behavior is deferred.
- Anonymous guest ordering confirmed; customer accounts are excluded.
- Payment labels confirmed as `Recharge from store` and `Recharge online`; detailed behavior is deferred.
- Cloudinary confirmed for images and Railway confirmed for final deployment.
- Approve the page list and visual direction.

**Exit condition:** no unresolved choice changes the schema or checkout flow.

### Phase 1 — Foundation and design system

- Create the single Next.js TypeScript app.
- Install only approved core dependencies.
- Configure strict TypeScript, linting, formatting, environment validation, fonts, and design tokens.
- Build and document foundational UI primitives.
- Build the customer/admin shells and responsive navigation.
- Create representative empty/loading/error states.

**Exit condition:** a small component showcase proves typography, spacing, colors, forms, buttons, cards, statuses, and responsive behavior.

### Phase 2 — Customer catalog frontend with temporary data

- Build the mobile welcome/catalog page.
- Build search, category tabs, sorting, product grid, product card, and product details.
- Build all catalog states and responsive layouts.
- Review the visual result before backend integration.

**Exit condition:** the full discovery flow works with typed fixture data at target phone widths.

### Phase 3 — Database and catalog backend

- Add PostgreSQL and Prisma.
- Implement category, product, image, and price-option models.
- Add repositories, services, validation, seed data, and catalog queries.
- Replace fixture data with server data.

**Exit condition:** customer catalog data is database-backed and tested.

### Phase 4 — Admin authentication and catalog management

- Implement secure admin authentication.
- Build dashboard shell.
- Build category list/forms.
- Build product list/forms, image upload, and amount-price editor.
- Add authorization, validation, optimistic feedback only where safe, and cache invalidation.

**Exit condition:** admin can manage everything shown in the public catalog.

### Phase 5 — Cart, checkout, and order backend

- Implement focused cart state and persistence.
- Build cart and checkout UI.
- Implement authoritative price calculation, transactions, order snapshots, reference generation, and idempotency.
- Build order success state.

**Exit condition:** a customer can place a valid non-duplicate order end to end.

### Phase 6 — Admin order operations

- Build orders table, filters, sorting, pagination, and responsive mobile list.
- Build order details and status timeline.
- Implement valid status updates and history.
- Add dashboard order summaries.

**Exit condition:** admin can find, inspect, and process every order.

### Phase 7 — Hardening and release

- Complete accessibility, responsive, security, performance, and error-state review.
- Run unit, integration, and end-to-end tests.
- Add backups, logging, deployment environment, and production image storage.
- Seed the first admin and verify recovery procedure.

**Exit condition:** all critical workflows pass in the production-like environment.

---

## 22. Definition of done for every page

A page is not complete until:

- Desktop and specified phone widths are designed and tested.
- Keyboard and screen-reader behavior is reasonable.
- Loading, empty, error, success, and validation states are handled.
- Long names and realistic content do not break the layout.
- Reusable components are used where an established pattern exists.
- No database or business logic is embedded in presentational components.
- Authorization is enforced server-side for private operations.
- Relevant automated tests pass.
- No emojis, stickers, mixed icon libraries, arbitrary colors, or decorative visual noise have been introduced.
- The page has been visually reviewed in context, not only as isolated code.

---

## 23. Decisions recorded before dependency installation

1. Product/store name: **MOB GREENS**.
2. Currency: selectable per price option; initial supported list is GBP, EUR, and USD.
3. Amount types: grams and kilograms.
4. Fulfillment choices: pickup and delivery; detailed logic will be provided later.
5. Customer identity: anonymous guest ordering only, with no customer accounts.
6. Payment choices: `Recharge from store` and `Recharge online`; detailed logic will be provided later.
7. Production image provider: Cloudinary.
8. Deployment platform: Railway, connected through GitHub during the final phase.
9. Inactive products: hidden from the public storefront by default.

These decisions authorized Phase 1 dependency installation inside the normalized single application directory.
---

## 24. Immediate next deliverable

After this blueprint is approved, create `docs/UI_SPEC.md` for **Phase 1 only**. It should define concrete design tokens, component APIs, customer/admin shells, navigation behavior, and annotated mobile/desktop layouts. Then initialize the project and install the approved Phase 1 dependencies.
