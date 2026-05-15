import enum
import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean, Column, DateTime, Enum, ForeignKey,
    Integer, String, Text, func
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class VolunteerType(str, enum.Enum):
    remote = "remote"
    on_ground = "on_ground"
    hybrid = "hybrid"


class JourneyStage(str, enum.Enum):
    lead = "lead"
    onboarded = "onboarded"
    active = "active"
    returning = "returning"
    alumni = "alumni"
    ambassador = "ambassador"


class ApprovalStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class Volunteer(Base):
    __tablename__ = "volunteers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    age = Column(Integer, nullable=True)
    gender = Column(String(50), nullable=True)
    phone = Column(String(20), nullable=True)
    email = Column(String(255), unique=True, nullable=True)

    # Location
    village = Column(String(255), nullable=True)
    block = Column(String(255), nullable=True)
    district = Column(String(255), nullable=True)
    state = Column(String(255), nullable=True)

    # Education & occupation
    qualification = Column(String(255), nullable=True)
    field_of_study = Column(String(255), nullable=True)
    occupation = Column(String(255), nullable=True)

    # Preferences
    volunteer_type = Column(Enum(VolunteerType), nullable=True)
    hours_per_month = Column(Integer, nullable=True)
    availability = Column(String(255), nullable=True)
    preferred_district = Column(String(255), nullable=True)
    preferred_program = Column(String(255), nullable=True)

    # Journey
    current_stage = Column(Enum(JourneyStage), default=JourneyStage.lead, nullable=False)
    last_active_date = Column(DateTime(timezone=True), nullable=True)

    # Approval
    approval_status = Column(Enum(ApprovalStatus), default=ApprovalStatus.approved, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    skills = relationship("VolunteerSkill", back_populates="volunteer", cascade="all, delete-orphan")
    languages = relationship("VolunteerLanguage", back_populates="volunteer", cascade="all, delete-orphan")
    interests = relationship("VolunteerInterest", back_populates="volunteer", cascade="all, delete-orphan")
    onboarding = relationship("OnboardingChecklist", back_populates="volunteer", uselist=False, cascade="all, delete-orphan", foreign_keys="OnboardingChecklist.volunteer_id")
    activity_logs = relationship("ActivityLog", back_populates="volunteer", cascade="all, delete-orphan")
    stage_history = relationship("JourneyStageHistory", back_populates="volunteer", cascade="all, delete-orphan")


class VolunteerSkill(Base):
    __tablename__ = "volunteer_skills"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    volunteer_id = Column(UUID(as_uuid=True), ForeignKey("volunteers.id"), nullable=False)
    skill = Column(String(255), nullable=False)

    volunteer = relationship("Volunteer", back_populates="skills")


class VolunteerLanguage(Base):
    __tablename__ = "volunteer_languages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    volunteer_id = Column(UUID(as_uuid=True), ForeignKey("volunteers.id"), nullable=False)
    language = Column(String(100), nullable=False)

    volunteer = relationship("Volunteer", back_populates="languages")


class VolunteerInterest(Base):
    __tablename__ = "volunteer_interests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    volunteer_id = Column(UUID(as_uuid=True), ForeignKey("volunteers.id"), nullable=False)
    interest = Column(String(255), nullable=False)

    volunteer = relationship("Volunteer", back_populates="interests")


class JourneyStageHistory(Base):
    __tablename__ = "journey_stage_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    volunteer_id = Column(UUID(as_uuid=True), ForeignKey("volunteers.id"), nullable=False)
    from_stage = Column(Enum(JourneyStage), nullable=True)
    to_stage = Column(Enum(JourneyStage), nullable=False)
    changed_at = Column(DateTime(timezone=True), server_default=func.now())
    notes = Column(Text, nullable=True)

    volunteer = relationship("Volunteer", back_populates="stage_history")
