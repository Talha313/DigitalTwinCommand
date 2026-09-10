from __future__ import annotations

from pydantic import BaseModel, EmailStr

from app.db.models.enums import UserRole, UserStatus


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserRead(BaseModel):
    id: str
    email: str
    first_name: str | None
    last_name: str | None
    role: UserRole
    status: UserStatus


class SessionResponse(BaseModel):
    user: UserRead
