"""initial schema

Revision ID: 0001
Revises:
Create Date: 2026-05-15

"""
from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from alembic import op

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "volunteers",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("age", sa.Integer(), nullable=True),
        sa.Column("gender", sa.String(50), nullable=True),
        sa.Column("phone", sa.String(20), nullable=True),
        sa.Column("email", sa.String(255), nullable=True),
        sa.Column("village", sa.String(255), nullable=True),
        sa.Column("block", sa.String(255), nullable=True),
        sa.Column("district", sa.String(255), nullable=True),
        sa.Column("state", sa.String(255), nullable=True),
        sa.Column("qualification", sa.String(255), nullable=True),
        sa.Column("field_of_study", sa.String(255), nullable=True),
        sa.Column("occupation", sa.String(255), nullable=True),
        sa.Column("volunteer_type", sa.Enum("remote", "on_ground", "hybrid", name="volunteertype"), nullable=True),
        sa.Column("hours_per_month", sa.Integer(), nullable=True),
        sa.Column("availability", sa.String(255), nullable=True),
        sa.Column("preferred_district", sa.String(255), nullable=True),
        sa.Column("preferred_program", sa.String(255), nullable=True),
        sa.Column("current_stage", sa.Enum("lead", "onboarded", "active", "returning", "alumni", "ambassador", name="journeystage"), nullable=False, server_default="lead"),
        sa.Column("last_active_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
    )

    op.create_table(
        "volunteer_skills",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("volunteer_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("skill", sa.String(255), nullable=False),
        sa.ForeignKeyConstraint(["volunteer_id"], ["volunteers.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "volunteer_languages",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("volunteer_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("language", sa.String(100), nullable=False),
        sa.ForeignKeyConstraint(["volunteer_id"], ["volunteers.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "volunteer_interests",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("volunteer_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("interest", sa.String(255), nullable=False),
        sa.ForeignKeyConstraint(["volunteer_id"], ["volunteers.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "journey_stage_history",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("volunteer_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("from_stage", sa.Enum("lead", "onboarded", "active", "returning", "alumni", "ambassador", name="journeystage"), nullable=True),
        sa.Column("to_stage", sa.Enum("lead", "onboarded", "active", "returning", "alumni", "ambassador", name="journeystage"), nullable=False),
        sa.Column("changed_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["volunteer_id"], ["volunteers.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "activities",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("program", sa.String(255), nullable=True),
        sa.Column("mode", sa.Enum("online", "offline", "hybrid", name="activitymode"), nullable=True),
        sa.Column("location", sa.String(255), nullable=True),
        sa.Column("date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "activity_logs",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("volunteer_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("activity_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("activity_name", sa.String(255), nullable=True),
        sa.Column("date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("hours_logged", sa.Integer(), nullable=False),
        sa.Column("mode", sa.Enum("online", "offline", "hybrid", name="activitymode"), nullable=True),
        sa.Column("location", sa.String(255), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["volunteer_id"], ["volunteers.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["activity_id"], ["activities.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "onboarding_checklists",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("volunteer_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("orientation_completed", sa.Boolean(), server_default="false"),
        sa.Column("orientation_completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("agreement_signed", sa.Boolean(), server_default="false"),
        sa.Column("agreement_signed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("agreement_file_url", sa.String(512), nullable=True),
        sa.Column("id_proof_submitted", sa.Boolean(), server_default="false"),
        sa.Column("id_proof_submitted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("id_proof_file_url", sa.String(512), nullable=True),
        sa.Column("buddy_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("onboarding_completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["volunteer_id"], ["volunteers.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["buddy_id"], ["volunteers.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("volunteer_id"),
    )


def downgrade() -> None:
    op.drop_table("onboarding_checklists")
    op.drop_table("activity_logs")
    op.drop_table("activities")
    op.drop_table("journey_stage_history")
    op.drop_table("volunteer_interests")
    op.drop_table("volunteer_languages")
    op.drop_table("volunteer_skills")
    op.drop_table("volunteers")
    op.execute("DROP TYPE IF EXISTS volunteertype")
    op.execute("DROP TYPE IF EXISTS journeystage")
    op.execute("DROP TYPE IF EXISTS activitymode")
