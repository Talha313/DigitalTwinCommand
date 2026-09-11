# Digital Twin Command Center — Backend

FastAPI · SQLAlchemy 2.0 (async) · Alembic · Postgres · Redis · arq worker.

The **live phone agent's brain is Claude, hosted natively by ElevenLabs** and
configured in the ElevenLabs dashboard — this service does **not** proxy an LLM
for calls. It uses the **Anthropic API directly** only for the dashboard chat,
the daily-report research/scriptwriting (with web search), and grading.

## Architecture

```
Twilio Programmable Voice ──<Stream>──┐
                                      ▼
              FastAPI media bridge  (app/realtime/bridge.py)
                ├── ElevenLabs Agent WS (client)  → LLM = Claude (native) · TTS = PVC
                ├── Postgres  (calls / utterances / whispers)
                └── /ws/calls/{id}  → PWA live transcript + status + whisper receipts

Daily report worker (arq, cron 05:30 ET):
   Anthropic (Claude + web_search) → script → ElevenLabs TTS (PVC)
   → HeyGen / D-ID video → ffmpeg (captions + loudnorm) → S3 → READY
```

## Layout

```
app/
  main.py              create_app() + lifespan (seed on boot in non-prod)
  core/                config · security (argon2 + JWT) · logging · ratelimit
  db/                  base · session · models/ (ORM) · seed
  models/              Pydantic DTOs (ORMModel base stringifies UUIDs)
  providers/           anthropic · elevenlabs · twilio · storage(S3) · lipsync · push
  services/            business logic, one file per resource
  routers/             thin APIRouters + telephony webhooks + ws + webhooks
  realtime/            hub (pub/sub + replay) · bridge (Twilio ⇄ ElevenLabs)
  worker/              arq WorkerSettings · report pipeline · post-call tasks
  scripts/             gen_vapid
alembic/               migrations
tests/                 pytest (async, real Postgres `dtcc_test`)
```

## Run locally

```bash
uv sync
cp .env.example .env            # fill in keys — see the root SETUP notes
createdb dtcc                    # or use docker compose
uv run alembic upgrade head
uv run uvicorn app.main:app --reload          # http://localhost:8000/docs
uv run arq app.worker.main.WorkerSettings     # background worker (needs Redis)
```

Or everything at once:

```bash
docker compose up --build       # api + worker + postgres + redis + minio
```

## Auth

Cookie **and** bearer token. `POST /api/auth/signup` (first account → admin),
`/login`, `/refresh`, `/logout`, `/me`, `/forgot-password`, `/reset-password`.
Roles: `viewer < operator < admin`. WebSocket auth uses `?token=<access token>`.

## Tests / lint

```bash
uv run pytest                   # uses postgres db `dtcc_test`
uv run ruff check .
uv run alembic check            # assert models == migrations
```

## Key endpoints

| Path | Notes |
|---|---|
| `POST /api/chat/stream` | SSE dashboard chat with the twin (Anthropic) |
| `POST /api/calls/outbound` | place a call (Twilio) |
| `POST /api/calls/{id}/whispers` | inject operator whisper mid-call |
| `GET  /ws/calls/{id}?token=…` | live transcript + status stream |
| `POST /api/reports/generate` | trigger today's report now |
| `POST /twilio/voice` `/twilio/status` `WS /twilio/media` | Twilio webhooks |
| `POST /webhooks/elevenlabs` | ElevenLabs post-call webhook |
| `GET  /api/health` | DB + per-integration readiness |
```
