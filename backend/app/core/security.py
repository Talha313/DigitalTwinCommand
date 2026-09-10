"""Password hashing and JWT session tokens."""
from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Any, Literal

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerifyMismatchError

from app.core.config import settings

_hasher = PasswordHasher()
_ALGORITHM = "HS256"

TokenType = Literal["access", "refresh"]


def hash_password(password: str) -> str:
    return _hasher.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return _hasher.verify(password_hash, password)
    except (VerifyMismatchError, InvalidHashError, Exception):
        return False


def needs_rehash(password_hash: str) -> bool:
    try:
        return _hasher.check_needs_rehash(password_hash)
    except Exception:
        return False


def create_token(subject: str, token_type: TokenType, **claims: Any) -> str:
    now = datetime.now(UTC)
    if token_type == "access":
        expires = now + timedelta(minutes=settings.access_token_ttl_minutes)
    else:
        expires = now + timedelta(days=settings.refresh_token_ttl_days)
    payload: dict[str, Any] = {
        "sub": subject,
        "type": token_type,
        "iat": int(now.timestamp()),
        "exp": int(expires.timestamp()),
        **claims,
    }
    return jwt.encode(payload, settings.session_secret, algorithm=_ALGORITHM)


def decode_token(token: str, expected_type: TokenType | None = None) -> dict[str, Any]:
    payload = jwt.decode(token, settings.session_secret, algorithms=[_ALGORITHM])
    if expected_type and payload.get("type") != expected_type:
        raise jwt.InvalidTokenError(f"expected {expected_type} token")
    return payload
