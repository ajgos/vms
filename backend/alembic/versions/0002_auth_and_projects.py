"""auth and projects

Revision ID: 0002
Revises: 0001
Create Date: 2026-05-16

"""
from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy.dialects.postgresql import ENUM as PgEnum
from alembic import op

revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_CREATE_TYPE = """
DO $$ BEGIN
    CREATE TYPE {name} AS ENUM ({values});
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
"""


def upgrade() -> None:
    op.execute(_CREATE_TYPE.format(name="userrole", values="'admin', 'volunteer'"))
    op.execute(_CREATE_TYPE.format(name="approvalstatus", values="'pending', 'approved', 'rejected'"))
    op.execute(_CREATE_TYPE.format(name="projectstatus", values="'draft', 'active', 'closed'"))
    op.execute(_CREATE_TYPE.format(name="applicationstatus", values="'pending', 'approved', 'rejected'"))

    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("role", PgEnum("admin", "volunteer", name="userrole", create_type=False), nullable=False),
        sa.Column("volunteer_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["volunteer_id"], ["volunteers.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
    )

    op.add_column(
        "volunteers",
        sa.Column(
            "approval_status",
            PgEnum("pending", "approved", "rejected", name="approvalstatus", create_type=False),
            nullable=False,
            server_default="approved",
        ),
    )

    op.create_table(
        "projects",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("program", sa.String(255), nullable=True),
        sa.Column("status", PgEnum("draft", "active", "closed", name="projectstatus", create_type=False), nullable=False, server_default="draft"),
        sa.Column("start_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("end_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("location", sa.String(255), nullable=True),
        sa.Column("mode", PgEnum("online", "offline", "hybrid", name="activitymode", create_type=False), nullable=True),
        sa.Column("capacity", sa.Integer(), nullable=True),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "project_skills",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("skill", sa.String(255), nullable=False),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "project_applications",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("volunteer_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("status", PgEnum("pending", "approved", "rejected", name="applicationstatus", create_type=False), nullable=False, server_default="pending"),
        sa.Column("message", sa.Text(), nullable=True),
        sa.Column("applied_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("reviewed_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["volunteer_id"], ["volunteers.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["reviewed_by"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("project_id", "volunteer_id"),
    )


def downgrade() -> None:
    op.drop_table("project_applications")
    op.drop_table("project_skills")
    op.drop_table("projects")
    op.drop_column("volunteers", "approval_status")
    op.drop_table("users")
    op.execute("DROP TYPE IF EXISTS applicationstatus")
    op.execute("DROP TYPE IF EXISTS projectstatus")
    op.execute("DROP TYPE IF EXISTS approvalstatus")
    op.execute("DROP TYPE IF EXISTS userrole")
