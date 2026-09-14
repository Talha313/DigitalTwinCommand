from __future__ import annotations

from typing import Any
from zoneinfo import ZoneInfo

from arq import cron

from app.core.config import settings
from app.core.logging import configure_logging, get_logger
from app.providers.http import close_shared_client
from app.worker.queue import redis_settings
from app.worker.tasks import (
    generate_report,
    package_report,
    purge_old_media,
    render_report,
    run_daily_report,
    summarize_call,
)

log = get_logger(__name__)


async def _startup(ctx: dict[str, Any]) -> None:
    configure_logging()
    log.info(
        "worker started · tz=%s daily=%02d:%02d",
        settings.report_tz,
        settings.report_cron_hour,
        settings.report_cron_minute,
    )


async def _shutdown(ctx: dict[str, Any]) -> None:
    await close_shared_client()


class WorkerSettings:
    redis_settings = redis_settings()
    # arq computes cron next-run times against this tz (Worker.__init__'s
    # `timezone` param — defaults to the host's local tz otherwise, which
    # would silently NOT be America/New_York on most deployment hosts).
    timezone = ZoneInfo(settings.report_tz)
    functions = [
        generate_report,
        render_report,
        package_report,
        summarize_call,
        run_daily_report,
        purge_old_media,
    ]
    cron_jobs = [
        cron(
            run_daily_report,
            hour=settings.report_cron_hour,
            minute=settings.report_cron_minute,
            timeout=3600,
            unique=True,
        ),
        # Ahead of the daily report (03:00 vs. 05:30), same tz, low-traffic hour.
        cron(purge_old_media, hour=3, minute=0, timeout=1800, unique=True),
    ]
    on_startup = _startup
    on_shutdown = _shutdown
    max_jobs = 4
    job_timeout = 3600
    keep_result = 3600
