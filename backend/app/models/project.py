import enum
import uuid

from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class ProjectStatus(str, enum.Enum):
    draft = "draft"
    active = "active"
    closed = "closed"


class ApplicationStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class Project(Base):
    __tablename__ = "projects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    program = Column(String(255), nullable=True)
    status = Column(Enum(ProjectStatus), nullable=False, default=ProjectStatus.draft)
    start_date = Column(DateTime(timezone=True), nullable=True)
    end_date = Column(DateTime(timezone=True), nullable=True)
    location = Column(String(255), nullable=True)
    # Reuse existing activitymode PG enum; create_type=False avoids re-creating it
    mode = Column(Enum("online", "offline", "hybrid", name="activitymode", create_type=False), nullable=True)
    capacity = Column(Integer, nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    skills = relationship("ProjectSkill", back_populates="project", cascade="all, delete-orphan")
    applications = relationship("ProjectApplication", back_populates="project", cascade="all, delete-orphan")
    creator = relationship("User", foreign_keys=[created_by])


class ProjectSkill(Base):
    __tablename__ = "project_skills"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    skill = Column(String(255), nullable=False)

    project = relationship("Project", back_populates="skills")


class ProjectApplication(Base):
    __tablename__ = "project_applications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    volunteer_id = Column(UUID(as_uuid=True), ForeignKey("volunteers.id", ondelete="CASCADE"), nullable=False)
    status = Column(Enum(ApplicationStatus), nullable=False, default=ApplicationStatus.pending)
    message = Column(Text, nullable=True)
    applied_at = Column(DateTime(timezone=True), server_default=func.now())
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    reviewed_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    project = relationship("Project", back_populates="applications")
    volunteer = relationship("Volunteer")
    reviewer = relationship("User", foreign_keys=[reviewed_by])

    __table_args__ = (UniqueConstraint("project_id", "volunteer_id"),)
