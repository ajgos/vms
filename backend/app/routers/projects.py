from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.auth import require_admin, require_volunteer, get_current_user
from app.core.database import get_db
from app.models.project import ApplicationStatus, Project, ProjectApplication, ProjectSkill
from app.models.user import User, UserRole
from app.models.volunteer import Volunteer
from app.schemas.project import (
    ApplicationCreate, ApplicationResponse, ApplicationStatusUpdate,
    ProjectCreate, ProjectResponse, ProjectUpdate,
)

router = APIRouter(prefix="/projects", tags=["Projects"])


def _load_opts():
    return [selectinload(Project.skills), selectinload(Project.applications)]


async def _build_project_response(p: Project) -> ProjectResponse:
    p_dict = {k: v for k, v in p.__dict__.items() if not k.startswith("_")}
    p_dict["skills"] = [s.skill for s in p.skills]
    p_dict["application_count"] = len(p.applications)
    return ProjectResponse.model_validate(p_dict)


async def _get_project_or_404(db: AsyncSession, project_id: UUID) -> Project:
    result = await db.execute(
        select(Project).options(*_load_opts()).where(Project.id == project_id)
    )
    p = result.scalar_one_or_none()
    if not p:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return p


@router.get("/my-applications", response_model=list[ApplicationResponse])
async def my_applications(
    user: User = Depends(require_volunteer),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ProjectApplication)
        .where(ProjectApplication.volunteer_id == user.volunteer_id)
        .order_by(ProjectApplication.applied_at.desc())
    )
    apps = result.scalars().all()
    return [_build_app_response(app, None) for app in apps]


@router.get("", response_model=list[ProjectResponse])
async def list_projects(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    q = select(Project).options(*_load_opts())
    if user.role == UserRole.volunteer:
        q = q.where(Project.status == "active")
    q = q.order_by(Project.created_at.desc())
    result = await db.execute(q)
    projects = result.scalars().all()
    return [await _build_project_response(p) for p in projects]


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    payload: ProjectCreate,
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    p = Project(
        **payload.model_dump(exclude={"skills"}),
        created_by=user.id,
    )
    p.skills = [ProjectSkill(skill=s) for s in payload.skills]
    db.add(p)
    await db.commit()
    await db.refresh(p)
    result = await db.execute(
        select(Project).options(*_load_opts()).where(Project.id == p.id)
    )
    p = result.scalar_one()
    return await _build_project_response(p)


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    p = await _get_project_or_404(db, project_id)
    if user.role == UserRole.volunteer and p.status != "active":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return await _build_project_response(p)


@router.patch("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: UUID,
    payload: ProjectUpdate,
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    p = await _get_project_or_404(db, project_id)
    update_data = payload.model_dump(exclude_none=True, exclude={"skills"})
    for field, value in update_data.items():
        setattr(p, field, value)
    if payload.skills is not None:
        await db.execute(ProjectSkill.__table__.delete().where(ProjectSkill.project_id == p.id))
        p.skills = [ProjectSkill(project_id=p.id, skill=s) for s in payload.skills]
    await db.commit()
    await db.refresh(p)
    result = await db.execute(select(Project).options(*_load_opts()).where(Project.id == p.id))
    p = result.scalar_one()
    return await _build_project_response(p)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: UUID,
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    p = await _get_project_or_404(db, project_id)
    await db.delete(p)
    await db.commit()


@router.post("/{project_id}/apply", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
async def apply_to_project(
    project_id: UUID,
    payload: ApplicationCreate,
    user: User = Depends(require_volunteer),
    db: AsyncSession = Depends(get_db),
):
    p = await _get_project_or_404(db, project_id)
    if p.status != "active":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Project is not accepting applications")

    existing = await db.execute(
        select(ProjectApplication).where(
            ProjectApplication.project_id == project_id,
            ProjectApplication.volunteer_id == user.volunteer_id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Already applied to this project")

    app = ProjectApplication(
        project_id=project_id,
        volunteer_id=user.volunteer_id,
        message=payload.message,
    )
    db.add(app)
    await db.commit()
    await db.refresh(app)
    return _build_app_response(app, None)


@router.get("/{project_id}/applications", response_model=list[ApplicationResponse])
async def list_applications(
    project_id: UUID,
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    await _get_project_or_404(db, project_id)
    result = await db.execute(
        select(ProjectApplication, Volunteer.name)
        .join(Volunteer, ProjectApplication.volunteer_id == Volunteer.id)
        .where(ProjectApplication.project_id == project_id)
        .order_by(ProjectApplication.applied_at.desc())
    )
    rows = result.all()
    return [_build_app_response(app, name) for app, name in rows]


@router.patch("/{project_id}/applications/{app_id}", response_model=ApplicationResponse)
async def review_application(
    project_id: UUID,
    app_id: UUID,
    payload: ApplicationStatusUpdate,
    user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ProjectApplication, Volunteer.name)
        .join(Volunteer, ProjectApplication.volunteer_id == Volunteer.id)
        .where(
            ProjectApplication.id == app_id,
            ProjectApplication.project_id == project_id,
        )
    )
    row = result.one_or_none()
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")
    app, vol_name = row
    app.status = payload.status
    app.reviewed_at = datetime.now(timezone.utc)
    app.reviewed_by = user.id
    await db.commit()
    await db.refresh(app)
    return _build_app_response(app, vol_name)


def _build_app_response(app: ProjectApplication, volunteer_name) -> ApplicationResponse:
    return ApplicationResponse(
        id=app.id,
        project_id=app.project_id,
        volunteer_id=app.volunteer_id,
        status=app.status,
        message=app.message,
        applied_at=app.applied_at,
        reviewed_at=app.reviewed_at,
        volunteer_name=volunteer_name,
    )
