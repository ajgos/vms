from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.activity import Activity, ActivityLog
from app.models.volunteer import Volunteer
from app.schemas.activity import (
    ActivityCreate, ActivityLogCreate, ActivityLogResponse, ActivityResponse,
)

router = APIRouter(tags=["Activities"])
activities_router = APIRouter(prefix="/activities")
logs_router = APIRouter(prefix="/activity-logs")


@activities_router.get("", response_model=list[ActivityResponse])
async def list_activities(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Activity).order_by(Activity.date.desc()))
    return result.scalars().all()


@activities_router.post("", response_model=ActivityResponse, status_code=status.HTTP_201_CREATED)
async def create_activity(payload: ActivityCreate, db: AsyncSession = Depends(get_db)):
    activity = Activity(**payload.model_dump())
    db.add(activity)
    await db.commit()
    await db.refresh(activity)
    return activity


@activities_router.delete("/{activity_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_activity(activity_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Activity).where(Activity.id == activity_id))
    activity = result.scalar_one_or_none()
    if not activity:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Activity not found")
    await db.delete(activity)
    await db.commit()


@logs_router.get("", response_model=list[ActivityLogResponse])
async def list_logs(volunteer_id: UUID | None = None, db: AsyncSession = Depends(get_db)):
    q = select(ActivityLog).order_by(ActivityLog.date.desc())
    if volunteer_id:
        q = q.where(ActivityLog.volunteer_id == volunteer_id)
    result = await db.execute(q)
    return result.scalars().all()


@logs_router.post("", response_model=ActivityLogResponse, status_code=status.HTTP_201_CREATED)
async def log_activity(payload: ActivityLogCreate, db: AsyncSession = Depends(get_db)):
    volunteer = await db.get(Volunteer, payload.volunteer_id)
    if not volunteer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Volunteer not found")

    log = ActivityLog(**payload.model_dump())
    volunteer.last_active_date = payload.date
    db.add(log)
    await db.commit()
    await db.refresh(log)
    return log


@logs_router.delete("/{log_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_log(log_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ActivityLog).where(ActivityLog.id == log_id))
    log = result.scalar_one_or_none()
    if not log:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Log not found")
    await db.delete(log)
    await db.commit()
