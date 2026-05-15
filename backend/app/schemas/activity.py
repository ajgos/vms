from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel

from app.models.activity import ActivityMode


class ActivityCreate(BaseModel):
    name: str
    program: Optional[str] = None
    mode: Optional[ActivityMode] = None
    location: Optional[str] = None
    date: Optional[datetime] = None
    description: Optional[str] = None


class ActivityResponse(BaseModel):
    id: UUID
    name: str
    program: Optional[str]
    mode: Optional[ActivityMode]
    location: Optional[str]
    date: Optional[datetime]
    description: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class ActivityLogCreate(BaseModel):
    volunteer_id: UUID
    activity_id: Optional[UUID] = None
    activity_name: Optional[str] = None
    date: datetime
    hours_logged: int
    mode: Optional[ActivityMode] = None
    location: Optional[str] = None
    notes: Optional[str] = None


class ActivityLogResponse(BaseModel):
    id: UUID
    volunteer_id: UUID
    activity_id: Optional[UUID]
    activity_name: Optional[str]
    date: datetime
    hours_logged: int
    mode: Optional[ActivityMode]
    location: Optional[str]
    notes: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}
