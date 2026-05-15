from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import create_token, get_current_user, hash_password, require_admin, verify_password
from app.core.config import settings
from app.core.database import get_db
from app.models.onboarding import OnboardingChecklist
from app.models.user import User, UserRole
from app.models.volunteer import (
    ApprovalStatus, JourneyStage, JourneyStageHistory, Volunteer,
    VolunteerInterest, VolunteerLanguage, VolunteerSkill, VolunteerType,
)
from app.schemas.auth import AuthUserResponse, LoginRequest, RegisterRequest, SetupAdminRequest, TokenResponse

router = APIRouter(prefix="/auth", tags=["Auth"])


async def _user_response(db: AsyncSession, user: User) -> AuthUserResponse:
    approval_status = None
    if user.role == UserRole.volunteer and user.volunteer_id:
        result = await db.execute(
            select(Volunteer.approval_status).where(Volunteer.id == user.volunteer_id)
        )
        approval_status = result.scalar_one_or_none()
        if approval_status:
            approval_status = approval_status.value
    return AuthUserResponse(
        id=user.id,
        email=user.email,
        role=user.role.value,
        volunteer_id=user.volunteer_id,
        approval_status=approval_status,
    )


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterRequest, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User).where(User.email == payload.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    volunteer_type = None
    if payload.volunteer_type:
        try:
            volunteer_type = VolunteerType(payload.volunteer_type)
        except ValueError:
            pass

    v = Volunteer(
        name=payload.name,
        age=payload.age,
        gender=payload.gender,
        phone=payload.phone,
        email=payload.email,
        village=payload.village,
        block=payload.block,
        district=payload.district,
        state=payload.state,
        qualification=payload.qualification,
        field_of_study=payload.field_of_study,
        occupation=payload.occupation,
        volunteer_type=volunteer_type,
        hours_per_month=payload.hours_per_month,
        availability=payload.availability,
        preferred_district=payload.preferred_district,
        preferred_program=payload.preferred_program,
        approval_status=ApprovalStatus.pending,
    )
    v.skills = [VolunteerSkill(skill=s) for s in payload.skills]
    v.languages = [VolunteerLanguage(language=l) for l in payload.languages]
    v.interests = [VolunteerInterest(interest=i) for i in payload.interests]
    db.add(v)
    await db.flush()

    db.add(JourneyStageHistory(volunteer_id=v.id, from_stage=None, to_stage=v.current_stage))
    db.add(OnboardingChecklist(volunteer_id=v.id))

    user = User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        role=UserRole.volunteer,
        volunteer_id=v.id,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = create_token(user.id, user.role.value)
    return TokenResponse(access_token=token, user=await _user_response(db, user))


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account disabled")

    token = create_token(user.id, user.role.value)
    return TokenResponse(access_token=token, user=await _user_response(db, user))


@router.get("/me", response_model=AuthUserResponse)
async def me(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await _user_response(db, user)


@router.post("/setup-admin", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def setup_admin(payload: SetupAdminRequest, db: AsyncSession = Depends(get_db)):
    if payload.setup_secret != settings.SETUP_SECRET:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid setup secret")

    admin_check = await db.execute(
        select(func.count()).select_from(User).where(User.role == UserRole.admin)
    )
    if admin_check.scalar() > 0:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Admin already exists")

    existing = await db.execute(select(User).where(User.email == payload.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    user = User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        role=UserRole.admin,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = create_token(user.id, user.role.value)
    return TokenResponse(access_token=token, user=await _user_response(db, user))
