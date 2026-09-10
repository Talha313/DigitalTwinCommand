# Digital Twin Command Center — Frontend

The Next.js PWA for the Digital Twin Command Center. This repository is
**frontend only** — every screen runs on mock data (`apps/web/src/lib/mock-data/`).
No backend, database, or third-party services are wired up.

## Stack

- Next.js (App Router) + TypeScript (strict)
- Tailwind CSS + shadcn/ui + Radix primitives
- PWA-first, dark enterprise theme

## Getting started

```bash
pnpm install
pnpm dev            # http://localhost:3000
```

Sign in with any credentials (the login button goes straight to the dashboard).

## Scripts

| Command | Runs |
|---|---|
| `pnpm dev` | Next dev server |
| `pnpm build` | production build |
| `pnpm start` | serve the production build |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` | ESLint |

## Modules

`/dashboard` · `/chat` · `/calls/live` · `/calls/history` · `/reports` ·
`/memory` · `/roles` · `/roles/[id]` (configuration) · `/settings/integrations`

## Layout

```
apps/web/            the application
packages/shared/     placeholder — shared TypeScript types
packages/config/     placeholder — shared tooling presets
```

`CLAUDE.md` describes the full product vision (calls, telephony, reports, AI
roles); the backend that powers it is developed separately and is not part of
this repository.
