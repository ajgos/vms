from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr

from app.models.volunteer import ApprovalStatus, JourneyStage, VolunteerType


class VolunteerSkillSchema(BaseModel):
    skill: str


class VolunteerLanguageSchema(BaseModel):
    language: str


class VolunteerInterestSchema(BaseModel):
    interest: str


class VolunteerCreate(BaseModel):
    name: str
    age: Optional[int] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    village: Optional[str] = None
    block: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    qualification: Optional[str] = None
    field_of_study: Optional[str] = None
    occupation: Optional[str] = None
    volunteer_type: Optional[VolunteerType] = None
    hours_per_month: Optional[int] = None
    availability: Optional[str] = None
    preferred_district: Optional[str] = None
    preferred_program: Optional[str] = None
    skills: list[str] = []
    languages: list[str] = []
    interests: list[str] = []


class VolunteerUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    village: Optional[str] = None
    block: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    qualification: Optional[str] = None
    field_of_study: Optional[str] = None
    occupation: Optional[str] = None
    volunteer_type: Optional[VolunteerType] = None
    hours_per_month: Optional[int] = None
    availability: Optional[str] = None
    preferred_district: Optional[str] = None
    preferred_program: Optional[str] = None
    skills: Optional[list[str]] = None
    languages: Optional[list[str]] = None
    interests: Optional[list[str]] = None


class VolunteerStageUpdate(BaseModel):
    stage: JourneyStage
    notes: Optional[str] = None


class VolunteerResponse(BaseModel):
    id: UUID
    name: str
    age: Optional[int]
    gender: Optional[str]
    phone: Optional[str]
    email: Optional[str]
    village: Optional[str]
    block: Optional[str]
    district: Optional[str]
    state: Optional[str]
    qualification: Optional[str]
    field_of_study: Optional[str]
    occupation: Optional[str]
    volunteer_type: Optional[VolunteerType]
    hours_per_month: Optional[int]
    availability: Optional[str]
    preferred_district: Optional[str]
    preferred_program: Optional[str]
    current_stage: JourneyStage
    approval_status: ApprovalStatus = ApprovalStatus.approved
    last_active_date: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    skills: list[str] = []
    languages: list[str] = []
    interests: list[str] = []
    cumulative_hours: int = 0

    model_config = {"from_attributes": True}


class JourneyStageHistoryResponse(BaseModel):
    id: UUID
    from_stage: Optional[JourneyStage]
    to_stage: JourneyStage
    changed_at: datetime
    notes: Optional[str]

    model_config = {"from_attributes": True}
