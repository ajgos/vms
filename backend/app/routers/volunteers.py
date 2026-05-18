from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.auth import require_admin
from app.core.database import get_db
from app.models.activity import ActivityLog
from app.models.onboarding import OnboardingChecklist
from app.models.project import Project, ProjectApplication
from app.models.volunteer import (
    ApprovalStatus, JourneyStage, JourneyStageHistory, Volunteer,
    VolunteerInterest, VolunteerLanguage, VolunteerSkill,
)
from app.schemas.volunteer import (
    JourneyStageHistoryResponse, VolunteerCreate,
    VolunteerResponse, VolunteerStageUpdate, VolunteerUpdate,
)

router = APIRouter(prefix="/volunteers", tags=["Volunteers"])


def _load_opts():
    return [
        selectinload(Volunteer.skills),
        selectinload(Volunteer.languages),
        selectinload(Volunteer.interests),
    ]


async def _get_volunteer_or_404(db: AsyncSession, volunteer_id: UUID) -> Volunteer:
    result = await db.execute(
        select(Volunteer).options(*_load_opts()).where(Volunteer.id == volunteer_id)
    )
    v = result.scalar_one_or_none()
    if not v:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Volunteer not found")
    return v


async def _build_response(db: AsyncSession, v: Volunteer) -> VolunteerResponse:
    hours_result = await db.execute(
        select(func.coalesce(func.sum(ActivityLog.hours_logged), 0))
        .where(ActivityLog.volunteer_id == v.id)
    )
    cumulative_hours = hours_result.scalar()
    v_dict = {k: val for k, val in v.__dict__.items() if not k.startswith("_")}
    v_dict["skills"] = [s.skill for s in v.skills]
    v_dict["languages"] = [l.language for l in v.languages]
    v_dict["interests"] = [i.interest for i in v.interests]
    v_dict["cumulative_hours"] = cumulative_hours
    return VolunteerResponse.model_validate(v_dict)


@router.get("", response_model=list[VolunteerResponse])
async def list_volunteers(
    stage: Optional[JourneyStage] = None,
    district: Optional[str] = None,
    state: Optional[str] = None,
    search: Optional[str] = Query(None, description="Search by name, email, or phone"),
    offset: int = 0,
    limit: int = Query(50, le=1000),
    db: AsyncSession = Depends(get_db),
):
    q = select(Volunteer).options(*_load_opts())
    if stage:
        q = q.where(Volunteer.current_stage == stage)
    if district:
        q = q.where(Volunteer.district.ilike(f"%{district}%"))
    if state:
        q = q.where(Volunteer.state.ilike(f"%{state}%"))
    if search:
        q = q.where(
            Volunteer.name.ilike(f"%{search}%")
            | Volunteer.email.ilike(f"%{search}%")
            | Volunteer.phone.ilike(f"%{search}%")
        )
    q = q.offset(offset).limit(limit).order_by(Volunteer.created_at.desc())
    result = await db.execute(q)
    volunteers = result.scalars().all()
    return [await _build_response(db, v) for v in volunteers]


@router.post("", response_model=VolunteerResponse, status_code=status.HTTP_201_CREATED)
async def create_volunteer(payload: VolunteerCreate, db: AsyncSession = Depends(get_db)):
    v = Volunteer(**payload.model_dump(exclude={"skills", "languages", "interests"}))
    v.skills = [VolunteerSkill(skill=s) for s in payload.skills]
    v.languages = [VolunteerLanguage(language=l) for l in payload.languages]
    v.interests = [VolunteerInterest(interest=i) for i in payload.interests]
    db.add(v)
    try:
        await db.flush()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    # Record initial stage in history
    db.add(JourneyStageHistory(volunteer_id=v.id, from_stage=None, to_stage=v.current_stage))
    # Create blank onboarding checklist so dashboard counts are accurate from day one
    db.add(OnboardingChecklist(volunteer_id=v.id))
    await db.commit()
    # Re-fetch with eager-loaded relationships to avoid lazy-load in async context
    v = await _get_volunteer_or_404(db, v.id)
    return await _build_response(db, v)


@router.get("/pending", response_model=list[VolunteerResponse])
async def list_pending(
    user=Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    q = (
        select(Volunteer)
        .options(*_load_opts())
        .where(Volunteer.approval_status == ApprovalStatus.pending)
        .order_by(Volunteer.created_at.desc())
    )
    result = await db.execute(q)
    volunteers = result.scalars().all()
    return [await _build_response(db, v) for v in volunteers]


@router.patch("/{volunteer_id}/approve", response_model=VolunteerResponse)
async def approve_volunteer(
    volunteer_id: UUID,
    user=Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    v = await _get_volunteer_or_404(db, volunteer_id)
    v.approval_status = ApprovalStatus.approved
    v.current_stage = JourneyStage.onboarded
    db.add(JourneyStageHistory(
        volunteer_id=v.id, from_stage=v.current_stage, to_stage=JourneyStage.onboarded,
        notes="Approved by admin",
    ))
    await db.commit()
    await db.refresh(v)
    return await _build_response(db, v)


@router.patch("/{volunteer_id}/reject", response_model=VolunteerResponse)
async def reject_volunteer(
    volunteer_id: UUID,
    user=Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    v = await _get_volunteer_or_404(db, volunteer_id)
    v.approval_status = ApprovalStatus.rejected
    await db.commit()
    await db.refresh(v)
    return await _build_response(db, v)


@router.get("/{volunteer_id}", response_model=VolunteerResponse)
async def get_volunteer(volunteer_id: UUID, db: AsyncSession = Depends(get_db)):
    v = await _get_volunteer_or_404(db, volunteer_id)
    return await _build_response(db, v)


@router.patch("/{volunteer_id}", response_model=VolunteerResponse)
async def update_volunteer(
    volunteer_id: UUID, payload: VolunteerUpdate, db: AsyncSession = Depends(get_db)
):
    v = await _get_volunteer_or_404(db, volunteer_id)
    update_data = payload.model_dump(exclude_none=True, exclude={"skills", "languages", "interests"})
    for field, value in update_data.items():
        setattr(v, field, value)

    if payload.skills is not None:
        await db.execute(
            VolunteerSkill.__table__.delete().where(VolunteerSkill.volunteer_id == v.id)
        )
        v.skills = [VolunteerSkill(volunteer_id=v.id, skill=s) for s in payload.skills]
    if payload.languages is not None:
        await db.execute(
            VolunteerLanguage.__table__.delete().where(VolunteerLanguage.volunteer_id == v.id)
        )
        v.languages = [VolunteerLanguage(volunteer_id=v.id, language=l) for l in payload.languages]
    if payload.interests is not None:
        await db.execute(
            VolunteerInterest.__table__.delete().where(VolunteerInterest.volunteer_id == v.id)
        )
        v.interests = [VolunteerInterest(volunteer_id=v.id, interest=i) for i in payload.interests]

    await db.commit()
    await db.refresh(v)
    return await _build_response(db, v)


@router.patch("/{volunteer_id}/stage", response_model=VolunteerResponse)
async def update_stage(
    volunteer_id: UUID, payload: VolunteerStageUpdate, db: AsyncSession = Depends(get_db)
):
    v = await _get_volunteer_or_404(db, volunteer_id)
    previous_stage = v.current_stage
    v.current_stage = payload.stage
    db.add(JourneyStageHistory(
        volunteer_id=v.id,
        from_stage=previous_stage,
        to_stage=payload.stage,
        notes=payload.notes,
    ))
    await db.commit()
    await db.refresh(v)
    return await _build_response(db, v)


@router.get("/{volunteer_id}/stage-history", response_model=list[JourneyStageHistoryResponse])
async def get_stage_history(volunteer_id: UUID, db: AsyncSession = Depends(get_db)):
    await _get_volunteer_or_404(db, volunteer_id)
    result = await db.execute(
        select(JourneyStageHistory)
        .where(JourneyStageHistory.volunteer_id == volunteer_id)
        .order_by(JourneyStageHistory.changed_at)
    )
    return result.scalars().all()


@router.delete("/{volunteer_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_volunteer(volunteer_id: UUID, db: AsyncSession = Depends(get_db)):
    v = await _get_volunteer_or_404(db, volunteer_id)
    await db.delete(v)
    await db.commit()


@router.get("/{volunteer_id}/projects")
async def get_volunteer_projects(volunteer_id: UUID, db: AsyncSession = Depends(get_db)):
    await _get_volunteer_or_404(db, volunteer_id)
    result = await db.execute(
        select(ProjectApplication, Project.name, Project.program, Project.status, Project.start_date, Project.end_date)
        .join(Project, ProjectApplication.project_id == Project.id)
        .where(ProjectApplication.volunteer_id == volunteer_id)
        .order_by(ProjectApplication.applied_at.desc())
    )
    rows = result.all()
    return [
        {
            "application_id": str(row.ProjectApplication.id),
            "project_id": str(row.ProjectApplication.project_id),
            "project_name": row.name,
            "program": row.program,
            "project_status": row.status.value,
            "application_status": row.ProjectApplication.status.value,
            "applied_at": row.ProjectApplication.applied_at,
            "start_date": row.start_date,
            "end_date": row.end_date,
        }
        for row in rows
    ]
