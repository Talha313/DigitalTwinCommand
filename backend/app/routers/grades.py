from __future__ import annotations

from fastapi import APIRouter, Depends, Query

from app.models.grades import GradeCreate, GradeRead
from app.services.grades import GradeService, get_grades_service

router = APIRouter(prefix="/grades", tags=["grades"])


@router.get("", response_model=list[GradeRead])
async def list_grades(
    subject_type: str | None = Query(default=None),
    subject_id: str | None = Query(default=None),
    service: GradeService = Depends(get_grades_service),
) -> list[GradeRead]:
    return await service.list_grades(subject_type, subject_id)


@router.post("", response_model=GradeRead, status_code=201)
async def create_grade(
    body: GradeCreate, service: GradeService = Depends(get_grades_service)
) -> GradeRead:
    return await service.create(body)


@router.get("/{grade_id}", response_model=GradeRead)
async def get_grade(
    grade_id: str, service: GradeService = Depends(get_grades_service)
) -> GradeRead:
    return await service.get(grade_id)
