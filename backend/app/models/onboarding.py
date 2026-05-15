import uuid

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class OnboardingChecklist(Base):
    __tablename__ = "onboarding_checklists"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    volunteer_id = Column(UUID(as_uuid=True), ForeignKey("volunteers.id"), nullable=False, unique=True)

    orientation_completed = Column(Boolean, default=False)
    orientation_completed_at = Column(DateTime(timezone=True), nullable=True)

    agreement_signed = Column(Boolean, default=False)
    agreement_signed_at = Column(DateTime(timezone=True), nullable=True)
    agreement_file_url = Column(String(512), nullable=True)

    id_proof_submitted = Column(Boolean, default=False)
    id_proof_submitted_at = Column(DateTime(timezone=True), nullable=True)
    id_proof_file_url = Column(String(512), nullable=True)

    buddy_id = Column(UUID(as_uuid=True), ForeignKey("volunteers.id"), nullable=True)
    onboarding_completed_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    volunteer = relationship("Volunteer", back_populates="onboarding", foreign_keys=[volunteer_id])
    buddy = relationship("Volunteer", foreign_keys=[buddy_id])
