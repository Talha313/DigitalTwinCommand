from __future__ import annotations

from fastapi import APIRouter, Depends, Query

from app.db.models.enums import UserRole
from app.db.models.user import User
from app.dependencies import current_user, require_role
from app.models.grades import GradeCreate, GradeRead
from app.services.grades import GradeService, get_grades_service

router = APIRouter(prefix="/grades", tags=["grades"])


@router.get("", response_model=list[GradeRead])
async def list_grades(
    subject_type: str | None = Query(default=None),
    subject_id: str | None = Query(default=None),
    _: User = Depends(current_user),
    service: GradeService = Depends(get_grades_service),
) -> list[GradeRead]:
    return await service.list_grades(subject_type, subject_id)


@router.post("", response_model=GradeRead, status_code=201)
async def create_grade(
    body: GradeCreate,
    _: User = Depends(require_role(UserRole.OPERATOR)),
    service: GradeService = Depends(get_grades_service),
) -> GradeRead:
    return await service.create(body)


@router.get("/{grade_id}", response_model=GradeRead)
async def get_grade(
    grade_id: str,
    _: User = Depends(current_user),
    service: GradeService = Depends(get_grades_service),
) -> GradeRead:
    return await service.get(grade_id)
