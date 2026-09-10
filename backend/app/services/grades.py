from __future__ import annotations

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import db_session
from app.errors import NotImplementedYet
from app.models.grades import GradeCreate, GradeRead
from app.services.base import Service


class GradeService(Service):
    async def list_grades(
        self, subject_type: str | None = None, subject_id: str | None = None
    ) -> list[GradeRead]:
        raise NotImplementedYet("Grades are not implemented yet.")

    async def get(self, grade_id: str) -> GradeRead:
        raise NotImplementedYet("Grades are not implemented yet.")

    async def create(self, data: GradeCreate) -> GradeRead:
        raise NotImplementedYet("Grades are not implemented yet.")


def get_grades_service(session: AsyncSession = Depends(db_session)) -> GradeService:
    return GradeService(session)
