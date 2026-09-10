"""S3 / MinIO-compatible object storage for recordings, generated audio,
avatar videos, captions and training exports."""
from __future__ import annotations

import asyncio
from functools import lru_cache

import boto3
from botocore.config import Config
from botocore.exceptions import BotoCoreError, ClientError

from app.core.config import settings
from app.core.logging import get_logger
from app.errors import NotConfiguredError, UpstreamError

log = get_logger(__name__)


@lru_cache
def _s3():
    if not settings.s3_bucket:
        raise NotConfiguredError("S3_BUCKET is not configured.")
    return boto3.client(
        "s3",
        region_name=settings.s3_region,
        endpoint_url=settings.s3_endpoint_url or None,
        aws_access_key_id=settings.s3_access_key_id or None,
        aws_secret_access_key=settings.s3_secret_access_key or None,
        config=Config(signature_version="s3v4", retries={"max_attempts": 3}),
    )


class Storage:
    @property
    def configured(self) -> bool:
        return bool(settings.s3_bucket)

    async def put(self, key: str, data: bytes, *, content_type: str) -> str:
        def _upload() -> None:
            _s3().put_object(
                Bucket=settings.s3_bucket,
                Key=key,
                Body=data,
                ContentType=content_type,
            )

        try:
            await asyncio.to_thread(_upload)
        except (BotoCoreError, ClientError) as exc:
            raise UpstreamError(f"S3 upload failed: {exc}") from exc
        return await self.url_for(key)

    async def url_for(self, key: str, *, expires: int = 604800) -> str:
        if settings.s3_public_base_url:
            return f"{settings.s3_public_base_url.rstrip('/')}/{key}"

        def _sign() -> str:
            return _s3().generate_presigned_url(
                "get_object",
                Params={"Bucket": settings.s3_bucket, "Key": key},
                ExpiresIn=expires,
            )

        try:
            return await asyncio.to_thread(_sign)
        except (BotoCoreError, ClientError) as exc:
            raise UpstreamError(f"S3 presign failed: {exc}") from exc

    async def health(self) -> bool:
        def _head() -> bool:
            _s3().head_bucket(Bucket=settings.s3_bucket)
            return True

        try:
            return await asyncio.to_thread(_head)
        except Exception:  # noqa: BLE001
            return False


storage = Storage()
