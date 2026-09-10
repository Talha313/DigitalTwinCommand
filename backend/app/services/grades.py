from __future__ import annotations

from fastapi import Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.grade import Grade
from app.dependencies import db_session
from app.models.grades import GradeCreate, GradeRead
from app.services.base import Service, as_uuid


class GradeService(Service):
    async def list_grades(
        self, subject_type: str | None = None, subject_id: str | None = None
    ) -> list[GradeRead]:
        stmt = select(Grade).order_by(Grade.created_at.desc())
        if subject_type:
            stmt = stmt.where(Grade.subject_type == subject_type)
        if subject_id:
            stmt = stmt.where(Grade.subject_id == as_uuid(subject_id))
        rows = (await self.session.execute(stmt)).scalars().all()
        return [GradeRead.model_validate(r) for r in rows]

    async def get(self, grade_id: str) -> GradeRead:
        return GradeRead.model_validate(await self._get(Grade, grade_id, label="Grade"))

    async def create(self, data: GradeCreate) -> GradeRead:
        grade = Grade(
            subject_type=data.subject_type,
            subject_id=as_uuid(data.subject_id, field="subject_id"),
            score=data.score,
            notes=data.notes,
            grader_model=data.grader_model,
        )
        self.session.add(grade)
        await self.session.flush()
        return GradeRead.model_validate(grade)


def get_grades_service(session: AsyncSession = Depends(db_session)) -> GradeService:
    return GradeService(session)
