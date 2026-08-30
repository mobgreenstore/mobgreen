# MOB GREENS

MOB GREENS is a mobile-first storefront and connected administrator workspace for real product catalogues, guest checkout, recharge verification, delivery matching, and order operations.

The full-stack Next.js monolith is located in [`FRONTEND/app`](./FRONTEND/app).

## Local setup

```bash
cd FRONTEND/app
cp .env.example .env
npm install
npm run dev
```

- Admin: `http://localhost:3000`
- Storefront: `http://localhost:3001`

Local development expects the Railway CLI to be authenticated because `npm run dev` opens the PostgreSQL tunnel. Use `npm run dev:apps` when a directly reachable `DATABASE_URL` is configured.

## Verification

```bash
npm run lint
npm run typecheck
npm run format:check
npm test
npm run build:store
npm run build:admin
```

Never commit `.env`. Configure production secrets in Railway variables using [`FRONTEND/app/.env.example`](./FRONTEND/app/.env.example) as the variable-name reference.

See [`PROJECT_BLUEPRINT.md`](./PROJECT_BLUEPRINT.md) and [`IMPLEMENTATION_TASKS.md`](./IMPLEMENTATION_TASKS.md) for architecture and implementation status.
