FROM python:3.12-slim AS base

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy

RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg curl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=ghcr.io/astral-sh/uv:0.11 /uv /usr/local/bin/uv

WORKDIR /app

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project

COPY . .
RUN uv sync --frozen --no-dev

ENV PATH="/app/.venv/bin:$PATH"

EXPOSE 8000

# API server (default). Override the command for the worker:
#   uv run arq app.worker.main.WorkerSettings
#
# --forwarded-allow-ips is required, not just --proxy-headers: uvicorn's
# default only trusts X-Forwarded-* from 127.0.0.1, but a reverse proxy
# running on the Docker host (e.g. Caddy) reaches this container via the
# bridge network gateway, not literal 127.0.0.1. Without it, the app never
# sees "https" as the scheme, and Twilio webhook signature validation (which
# is computed against the real https:// URL Twilio posted to) fails on every
# request — this was observed live as a 403 on every /twilio/status call.
CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000 --proxy-headers --forwarded-allow-ips='172.18.0.0/16'"]
