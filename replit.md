# W2V Waste2Value

W2V is an interactive FoodTech and sustainability platform that helps kitchens and food processing units plan production, recover surplus, and measure impact.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/waste2value/src/App.tsx` — routed application flows and role-specific screens
- `artifacts/waste2value/src/index.css` — W2V visual language and responsive UI tokens
- `lib/api-spec/openapi.yaml` — source of truth for typed API contracts
- `artifacts/api-server/src/routes/w2v.ts` — onboarding, planning, recovery, telemetry, and impact routes
- `lib/db/src/schema/w2v.ts` — persisted W2V records

## Architecture decisions

- The frontend uses typed generated API hooks and keeps submitted result states separate from form input states so predictions are never shown before a submit.
- Operational telemetry is realistic simulated data until private sensor feeds are connected; selected readings still drive alerts and detail states.
- Registration and admin decisions are persisted as generic W2V records so additional domain tables can be introduced without changing the first user flows.

## Product

Users can register as institutional kitchens or FPUs, verify with OTP, enter role-specific workspaces, generate planning recommendations, analyze energy and inventory, publish recovery listings, inspect simulated storage and machine telemetry, and review activity-derived impact metrics. Admins can review and decide pending applications.

## User preferences

The user explicitly asked for a real interactive application rather than a documentation or PDF-like UI, using the supplied W2V logo and deep green, light green, orange, and off-white brand language.

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
