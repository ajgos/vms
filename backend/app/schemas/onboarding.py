from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class OnboardingUpdate(BaseModel):
    orientation_completed: Optional[bool] = None
    orientation_completed_at: Optional[datetime] = None
    agreement_signed: Optional[bool] = None
    agreement_signed_at: Optional[datetime] = None
    agreement_file_url: Optional[str] = None
    id_proof_submitted: Optional[bool] = None
    id_proof_submitted_at: Optional[datetime] = None
    id_proof_file_url: Optional[str] = None
    buddy_id: Optional[UUID] = None


class OnboardingResponse(BaseModel):
    id: UUID
    volunteer_id: UUID
    orientation_completed: bool
    orientation_completed_at: Optional[datetime]
    agreement_signed: bool
    agreement_signed_at: Optional[datetime]
    agreement_file_url: Optional[str]
    id_proof_submitted: bool
    id_proof_submitted_at: Optional[datetime]
    id_proof_file_url: Optional[str]
    buddy_id: Optional[UUID]
    onboarding_completed_at: Optional[datetime]
    updated_at: datetime
    is_complete: bool = False
    pending_items: list[str] = []

    model_config = {"from_attributes": True}


class DashboardResponse(BaseModel):
    total_volunteers: int
    active_volunteers: int
    total_hours_logged: int
    onboarding_completed: int
    stage_breakdown: dict[str, int]
    pending_compliance: int
