from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, EmailStr, Field

from app.db.models.enums import UserRole, UserStatus
from app.models.base import ORMModel


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=200)
    first_name: str | None = Field(default=None, max_length=120)
    last_name: str | None = Field(default=None, max_length=120)


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    password: str = Field(min_length=8, max_length=200)


class UserRead(ORMModel):
    id: str
    email: str
    first_name: str | None = None
    last_name: str | None = None
    role: UserRole
    status: UserStatus
    created_at: datetime


class SessionResponse(BaseModel):
    """Returned on login/signup. The access + refresh tokens are also set as
    httpOnly cookies; they are echoed here for non-browser clients."""

    user: UserRead
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class ForgotPasswordResponse(BaseModel):
    # Deliberately generic — never reveals whether the email exists.
    ok: bool = True
    # Only populated in non-production so the flow is testable without email.
    reset_token: str | None = None
