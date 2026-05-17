"""add project effort logs

Revision ID: 0004
Revises: 0003
Create Date: 2026-05-17

"""
from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from alembic import op

revision: str = "0004"
down_revision: Union[str, None] = "0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("CREATE TYPE effortapproval AS ENUM ('auto', 'manual')")
    op.execute("CREATE TYPE effortlogstatus AS ENUM ('pending', 'approved', 'rejected')")

    op.add_column(
        "projects",
        sa.Column(
            "effort_approval",
            sa.Enum("auto", "manual", name="effortapproval"),
            nullable=False,
            server_default="auto",
        ),
    )

    op.create_table(
        "project_effort_logs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("project_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("projects.id", ondelete="CASCADE"), nullable=False),
        sa.Column("volunteer_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("volunteers.id", ondelete="CASCADE"), nullable=False),
        sa.Column("date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("hours", sa.Float, nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("status", sa.Enum("pending", "approved", "rejected", name="effortlogstatus"),
                  nullable=False, server_default="pending"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("reviewed_by", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
    )
    op.create_index("ix_project_effort_logs_project_id", "project_effort_logs", ["project_id"])
    op.create_index("ix_project_effort_logs_volunteer_id", "project_effort_logs", ["volunteer_id"])


def downgrade() -> None:
    op.drop_index("ix_project_effort_logs_volunteer_id", table_name="project_effort_logs")
    op.drop_index("ix_project_effort_logs_project_id", table_name="project_effort_logs")
    op.drop_table("project_effort_logs")
    op.drop_column("projects", "effort_approval")
    op.execute("DROP TYPE effortlogstatus")
    op.execute("DROP TYPE effortapproval")
