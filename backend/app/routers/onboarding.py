from datetime import datetime, timezone
from pathlib import Path
from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.onboarding import OnboardingChecklist
from app.models.volunteer import Volunteer
from app.schemas.onboarding import OnboardingResponse, OnboardingUpdate

router = APIRouter(prefix="/onboarding", tags=["Onboarding"])

UPLOADS_DIR = Path("/app/uploads/id-proofs")
ALLOWED_TYPES = {"application/pdf", "image/jpeg", "image/png", "image/webp"}
MAX_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB

CHECKLIST_ITEMS = {
    "orientation_completed": "Orientation not completed",
    "agreement_signed": "Agreement not signed",
    "id_proof_submitted": "ID proof not submitted",
}


def _compute_pending(checklist: OnboardingChecklist) -> list[str]:
    return [msg for field, msg in CHECKLIST_ITEMS.items() if not getattr(checklist, field)]


def _to_response(checklist: OnboardingChecklist) -> OnboardingResponse:
    pending = _compute_pending(checklist)
    data = OnboardingResponse.model_validate(checklist)
    data.pending_items = pending
    data.is_complete = len(pending) == 0
    return data


async def _get_or_create_checklist(db: AsyncSession, volunteer_id: UUID) -> OnboardingChecklist:
    result = await db.execute(
        select(OnboardingChecklist).where(OnboardingChecklist.volunteer_id == volunteer_id)
    )
    checklist = result.scalar_one_or_none()
    if not checklist:
        volunteer = await db.get(Volunteer, volunteer_id)
        if not volunteer:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Volunteer not found")
        checklist = OnboardingChecklist(volunteer_id=volunteer_id)
        db.add(checklist)
        await db.commit()
        await db.refresh(checklist)
    return checklist


@router.get("/{volunteer_id}", response_model=OnboardingResponse)
async def get_onboarding(volunteer_id: UUID, db: AsyncSession = Depends(get_db)):
    checklist = await _get_or_create_checklist(db, volunteer_id)
    return _to_response(checklist)


@router.patch("/{volunteer_id}", response_model=OnboardingResponse)
async def update_onboarding(
    volunteer_id: UUID, payload: OnboardingUpdate, db: AsyncSession = Depends(get_db)
):
    checklist = await _get_or_create_checklist(db, volunteer_id)

    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(checklist, field, value)

    pending = _compute_pending(checklist)
    if not pending and not checklist.onboarding_completed_at:
        checklist.onboarding_completed_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(checklist)
    return _to_response(checklist)


@router.post("/{volunteer_id}/upload-id-proof", response_model=OnboardingResponse)
async def upload_id_proof(
    volunteer_id: UUID,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type. Allowed: PDF, JPEG, PNG, WebP.",
        )

    contents = await file.read()
    if len(contents) > MAX_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File too large. Maximum size is 5 MB.",
        )

    suffix = Path(file.filename or "file").suffix.lower() or ".bin"
    filename = f"{volunteer_id}{suffix}"
    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    (UPLOADS_DIR / filename).write_bytes(contents)

    checklist = await _get_or_create_checklist(db, volunteer_id)
    checklist.id_proof_file_url = f"/uploads/id-proofs/{filename}"
    await db.commit()
    await db.refresh(checklist)
    return _to_response(checklist)


@router.get("", response_model=list[OnboardingResponse])
async def list_onboarding(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(OnboardingChecklist))
    checklists = result.scalars().all()
    return [_to_response(c) for c in checklists]
