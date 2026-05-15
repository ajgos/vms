import enum
import uuid

from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class ActivityMode(str, enum.Enum):
    online = "online"
    offline = "offline"
    hybrid = "hybrid"


class Activity(Base):
    __tablename__ = "activities"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    program = Column(String(255), nullable=True)
    mode = Column(Enum(ActivityMode), nullable=True)
    location = Column(String(255), nullable=True)
    date = Column(DateTime(timezone=True), nullable=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    logs = relationship("ActivityLog", back_populates="activity")


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    volunteer_id = Column(UUID(as_uuid=True), ForeignKey("volunteers.id"), nullable=False)
    activity_id = Column(UUID(as_uuid=True), ForeignKey("activities.id"), nullable=True)
    activity_name = Column(String(255), nullable=True)  # for manual entries without a master activity
    date = Column(DateTime(timezone=True), nullable=False)
    hours_logged = Column(Integer, nullable=False)
    mode = Column(Enum(ActivityMode), nullable=True)
    location = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    volunteer = relationship("Volunteer", back_populates="activity_logs")
    activity = relationship("Activity", back_populates="logs")
