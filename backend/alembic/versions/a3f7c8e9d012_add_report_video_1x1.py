"""add reports.video_1x1

Revision ID: a3f7c8e9d012
Revises: 0d5309593f7d
Create Date: 2026-09-29 00:00:00.000000
"""
from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op


revision: str = 'a3f7c8e9d012'
down_revision: str | None = '0d5309593f7d'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column('reports', sa.Column('video_1x1', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('reports', 'video_1x1')
