"""Serves locally-stored media (report audio/video/captions, recordings) when
the storage backend is local disk. No-op when S3 is configured."""

from __future__ import annotations

import mimetypes

from fastapi import APIRouter
from fastapi.responses import FileResponse, Response

from app.providers.storage import local_path, storage

router = APIRouter(prefix="/media", tags=["media"])


@router.get("/{path:path}")
async def get_media(path: str) -> Response:
    if storage.backend != "local":
        return Response(status_code=404)
    target = local_path(path)
    if not target.is_file():
        return Response(status_code=404)
    media_type = mimetypes.guess_type(target.name)[0] or "application/octet-stream"
    return FileResponse(target, media_type=media_type)
