from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.activity import ActivityLog
from app.models.onboarding import OnboardingChecklist
from app.models.volunteer import JourneyStage, Volunteer
from app.schemas.onboarding import DashboardResponse

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

ACTIVE_STAGES = (JourneyStage.active, JourneyStage.returning, JourneyStage.ambassador)


@router.get("", response_model=DashboardResponse)
async def get_dashboard(db: AsyncSession = Depends(get_db)):
    total = await db.scalar(select(func.count(Volunteer.id)))

    active = await db.scalar(
        select(func.count(Volunteer.id)).where(Volunteer.current_stage.in_(ACTIVE_STAGES))
    )

    total_hours = await db.scalar(
        select(func.coalesce(func.sum(ActivityLog.hours_logged), 0))
    )

    onboarding_done = await db.scalar(
        select(func.count(OnboardingChecklist.id)).where(
            OnboardingChecklist.onboarding_completed_at.is_not(None)
        )
    )

    stage_rows = await db.execute(
        select(Volunteer.current_stage, func.count(Volunteer.id)).group_by(Volunteer.current_stage)
    )
    stage_breakdown = {row[0].value: row[1] for row in stage_rows}

    # Volunteers with a checklist not yet completed — now reliable since checklists
    # are created at volunteer registration time
    pending_compliance = await db.scalar(
        select(func.count(OnboardingChecklist.id)).where(
            OnboardingChecklist.onboarding_completed_at.is_(None)
        )
    )

    return DashboardResponse(
        total_volunteers=total or 0,
        active_volunteers=active or 0,
        total_hours_logged=total_hours or 0,
        onboarding_completed=onboarding_done or 0,
        stage_breakdown=stage_breakdown,
        pending_compliance=pending_compliance or 0,
    )
