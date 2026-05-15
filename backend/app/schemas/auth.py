from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr


class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str
    age: Optional[int] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    village: Optional[str] = None
    block: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    qualification: Optional[str] = None
    field_of_study: Optional[str] = None
    occupation: Optional[str] = None
    volunteer_type: Optional[str] = None
    hours_per_month: Optional[int] = None
    availability: Optional[str] = None
    preferred_district: Optional[str] = None
    preferred_program: Optional[str] = None
    skills: list[str] = []
    languages: list[str] = []
    interests: list[str] = []


class LoginRequest(BaseModel):
    email: str
    password: str


class SetupAdminRequest(BaseModel):
    email: str
    password: str
    setup_secret: str


class AuthUserResponse(BaseModel):
    id: UUID
    email: str
    role: str
    volunteer_id: Optional[UUID] = None
    approval_status: Optional[str] = None

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: AuthUserResponse
