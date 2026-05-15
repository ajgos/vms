import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.routers.activities import activities_router, logs_router
from app.routers.auth import router as auth_router
from app.routers.dashboard import router as dashboard_router
from app.routers.onboarding import router as onboarding_router
from app.routers.projects import router as projects_router
from app.routers.volunteers import router as volunteers_router
from app.core.config import settings

UPLOADS_DIR = "/app/uploads"
os.makedirs(f"{UPLOADS_DIR}/id-proofs", exist_ok=True)

app = FastAPI(title="Volunteer Management System", version="1.0.0")

_origins = ["http://localhost:3000", "http://localhost:3001"]
if settings.FRONTEND_URL:
    _origins.append(settings.FRONTEND_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")

app.include_router(auth_router)
app.include_router(volunteers_router)
app.include_router(activities_router)
app.include_router(logs_router)
app.include_router(onboarding_router)
app.include_router(dashboard_router)
app.include_router(projects_router)


@app.get("/health")
async def health():
    return {"status": "ok"}
