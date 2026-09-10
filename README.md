# Digital Twin Command Center

Monorepo:

| Path | What it is |
|---|---|
| `apps/web/` | Next.js 15 PWA dashboard. Still runs on mock data (`src/lib/mock-data/`); wiring to the API is the next step. |
| `backend/` | FastAPI + SQLAlchemy (async) + Postgres + Redis + arq worker. **Implemented.** See `backend/README.md`. |
| `packages/` | placeholders — shared TS types / tooling presets |

The live **phone agent's brain is Claude, hosted natively by ElevenLabs**
(configured in the ElevenLabs dashboard). The backend calls the **Anthropic API
directly** only for the dashboard chat, the daily-report research/script, and
grading — there is no self-hosted LLM and no Grok.

## Frontend (this section)

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

## Backend

```bash
cd backend
uv sync
cp .env.example .env          # fill in keys
createdb dtcc
uv run alembic upgrade head
uv run uvicorn app.main:app --reload         # http://localhost:8000/docs
uv run arq app.worker.main.WorkerSettings    # worker (needs Redis)
# or: docker compose up --build
```
