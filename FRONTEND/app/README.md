# MOB GREENS

MOB GREENS is a mobile-first catalog and guest-ordering platform with a connected admin workspace. The application now includes the real catalog, cart, guest checkout, recharge verification, admin operations, location, delivery tracking, and simulated nearby-delivery matching workflows.

## Stack

- Next.js App Router
- React and strict TypeScript
- Tailwind CSS with project-owned design tokens
- Lucide React icons
- Class Variance Authority, `clsx`, and `tailwind-merge`
- Zod environment/configuration validation
- Vitest

## Local development

```bash
npm install
npm run dev
```

Run `npm run dev` to open the Railway database tunnel and start both surfaces. The admin runs at `http://localhost:3000` and the storefront at `http://localhost:3001`.

## Quality commands

```bash
npm run lint
npm run typecheck
npm test
npm run format:check
npm run build
```

Use `npm run format` to apply the repository formatting rules.

## Source boundaries

```text
src/
├── app/                # Storefront and admin route compositions
├── components/
│   ├── ui/             # Domain-neutral primitives
│   └── shared/         # Shared application compositions
├── config/             # Typed store choices and labels
├── features/           # Business features added phase by phase
├── lib/                # Shared utilities and environment validation
├── server/             # Future services, repositories, auth, and storage
├── styles/             # Light/dark design tokens
└── types/              # Cross-feature type definitions
```

## Confirmed product configuration

- Store name: MOB GREENS
- Product measurements: grams and kilograms
- Initial selectable currencies: GBP, EUR, and USD
- Customer identity: anonymous guest checkout only
- Fulfillment labels: Pickup and Delivery
- Payment labels: Recharge from store and Recharge online
- Image provider for the catalog phase: Cloudinary
- Final deployment target: Railway through GitHub

Guest checkout uses recharge-code verification. Delivery checkout requires one currency, a server-verified location, and a simulated courier selection before confirmation. Cross-currency conversion is intentionally not performed.

See [the project blueprint](../../PROJECT_BLUEPRINT.md) for the complete scope, architecture, workflows, and phased delivery plan.
