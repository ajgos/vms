from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel

from app.models.project import ApplicationStatus, ProjectStatus


class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    program: Optional[str] = None
    status: ProjectStatus = ProjectStatus.draft
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    location: Optional[str] = None
    mode: Optional[str] = None
    capacity: Optional[int] = None
    skills: list[str] = []


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    program: Optional[str] = None
    status: Optional[ProjectStatus] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    location: Optional[str] = None
    mode: Optional[str] = None
    capacity: Optional[int] = None
    skills: Optional[list[str]] = None


class ProjectResponse(BaseModel):
    id: UUID
    name: str
    description: Optional[str]
    program: Optional[str]
    status: ProjectStatus
    start_date: Optional[datetime]
    end_date: Optional[datetime]
    location: Optional[str]
    mode: Optional[str]
    capacity: Optional[int]
    skills: list[str] = []
    created_at: datetime
    updated_at: datetime
    application_count: int = 0

    model_config = {"from_attributes": True}


class ApplicationCreate(BaseModel):
    message: Optional[str] = None


class ApplicationStatusUpdate(BaseModel):
    status: ApplicationStatus


class ApplicationResponse(BaseModel):
    id: UUID
    project_id: UUID
    volunteer_id: UUID
    status: ApplicationStatus
    message: Optional[str]
    applied_at: datetime
    reviewed_at: Optional[datetime]
    volunteer_name: Optional[str] = None

    model_config = {"from_attributes": True}
