"""Object storage for generated audio, avatar videos, captions, recordings and
training exports.

Two backends, chosen automatically:
  * S3 / MinIO   when ``S3_BUCKET`` is set
  * local disk   otherwise — files land under ``STORAGE_DIR`` and are served by
                 ``GET /media/{path}`` (see app/routers/media.py)
"""

from __future__ import annotations

import asyncio
from functools import lru_cache
from pathlib import Path
from urllib.parse import urlparse

from app.core.config import settings
from app.core.logging import get_logger
from app.errors import UpstreamError

log = get_logger(__name__)


def _use_s3() -> bool:
    return bool(settings.s3_bucket)


@lru_cache
def _s3():
    import boto3
    from botocore.config import Config

    return boto3.client(
        "s3",
        region_name=settings.s3_region,
        endpoint_url=settings.s3_endpoint_url or None,
        aws_access_key_id=settings.s3_access_key_id or None,
        aws_secret_access_key=settings.s3_secret_access_key or None,
        config=Config(signature_version="s3v4", retries={"max_attempts": 3}),
    )


def _local_root() -> Path:
    root = Path(settings.storage_dir)
    if not root.is_absolute():
        root = Path.cwd() / root
    root.mkdir(parents=True, exist_ok=True)
    return root


def local_path(key: str) -> Path:
    root = _local_root()
    target = (root / key).resolve()
    if not str(target).startswith(str(root.resolve())):
        raise UpstreamError("Invalid storage key.")
    return target


def key_from_url(url: str) -> str | None:
    """Best-effort reverse of url_for() — the retention job stores URLs, not
    keys, so it needs to recover the key to delete the right object. Returns
    None for a URL that isn't ours (nothing to delete)."""
    if not _use_s3():
        prefix = f"{settings.public_base}/media/"
        return url[len(prefix) :] if url.startswith(prefix) else None
    if settings.s3_public_base_url:
        prefix = f"{settings.s3_public_base_url.rstrip('/')}/"
        return url[len(prefix) :] if url.startswith(prefix) else None
    return urlparse(url).path.lstrip("/") or None


class Storage:
    @property
    def backend(self) -> str:
        return "s3" if _use_s3() else "local"

    @property
    def configured(self) -> bool:
        return True

    async def put(self, key: str, data: bytes, *, content_type: str) -> str:
        if _use_s3():
            from botocore.exceptions import BotoCoreError, ClientError

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
        else:

            def _write() -> None:
                path = local_path(key)
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_bytes(data)

            await asyncio.to_thread(_write)
        return await self.url_for(key)

    async def exists(self, key: str) -> bool:
        if _use_s3():
            from botocore.exceptions import ClientError

            def _head() -> bool:
                try:
                    _s3().head_object(Bucket=settings.s3_bucket, Key=key)
                    return True
                except ClientError as exc:
                    if exc.response.get("Error", {}).get("Code") in ("404", "NoSuchKey"):
                        return False
                    raise

            try:
                return await asyncio.to_thread(_head)
            except ClientError:
                return False
        return await asyncio.to_thread(lambda: local_path(key).exists())

    async def delete(self, key: str) -> None:
        if _use_s3():
            from botocore.exceptions import BotoCoreError, ClientError

            def _delete() -> None:
                _s3().delete_object(Bucket=settings.s3_bucket, Key=key)

            try:
                await asyncio.to_thread(_delete)
            except (BotoCoreError, ClientError) as exc:
                raise UpstreamError(f"S3 delete failed: {exc}") from exc
        else:

            def _unlink() -> None:
                local_path(key).unlink(missing_ok=True)

            await asyncio.to_thread(_unlink)

    async def url_for(self, key: str, *, expires: int = 604800) -> str:
        if not _use_s3():
            return f"{settings.public_base}/media/{key.lstrip('/')}"
        if settings.s3_public_base_url:
            return f"{settings.s3_public_base_url.rstrip('/')}/{key}"
        from botocore.exceptions import BotoCoreError, ClientError

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
        if not _use_s3():
            try:
                probe = _local_root() / ".healthcheck"
                await asyncio.to_thread(probe.write_text, "ok")
                await asyncio.to_thread(probe.unlink)
                return True
            except Exception:
                return False

        def _head() -> bool:
            _s3().head_bucket(Bucket=settings.s3_bucket)
            return True

        try:
            return await asyncio.to_thread(_head)
        except Exception:
            return False


storage = Storage()
