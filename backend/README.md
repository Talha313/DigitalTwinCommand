# Digital Twin Command Center — Backend

FastAPI + SQLAlchemy 2.0 (async) + Alembic.

## Layout

```
app/
  main.py               create_app()
  core/config.py        pydantic-settings (reads .env)
  dependencies.py       db_session()
  errors.py             AppError -> JSON  (NotImplementedYet -> 501)
  db/
    base.py             DeclarativeBase + id / timestamp mixins
    session.py          async engine + get_session()
    models/             SQLAlchemy ORM models — one file per table
  models/               Pydantic DTOs — request/response, one file per resource
  services/             business logic — one file per resource + get_<x>_service()
  routers/              thin APIRouters — one file per resource
    api.py              aggregates -> api_router (/api/*), openai_router (/v1/*)
alembic/                migrations
```

A resource = `models/<x>.py` (DTOs) + `services/<x>.py` + `routers/<x>.py`.

## Run

```bash
uv sync                       # or: python -m venv .venv && pip install -e ".[dev]"
cp .env.example .env
uv run alembic revision --autogenerate -m "init"
uv run alembic upgrade head
uv run uvicorn app.main:app --reload      # http://localhost:8000/docs
uv run pytest
uv run ruff check .
```

Endpoints return `501 not_implemented` until the services are built out.
