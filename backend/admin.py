
from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from pwdlib import PasswordHash
from sqlalchemy import select
from sqlalchemy.orm import Session

from database import SessionLocal
from models import User, Patient, AuditLog
from auth import require_admin

router = APIRouter(prefix="/api/admin", tags=["Admin"])
password_hasher = PasswordHash.recommended()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def add_audit(db, user_id, action, entity_type, entity_id, details=None):
    db.add(
        AuditLog(
            id=str(uuid4()),
            user_id=user_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            details=details or {},
            created_at=datetime.now(timezone.utc),
        )
    )


class CreateResearcherRequest(BaseModel):
    email: str = Field(min_length=5, max_length=255)
    password: str = Field(min_length=12, max_length=128)


class AccountStatusRequest(BaseModel):
    is_active: bool


class AssignPatientRequest(BaseModel):
    researcher_id: str


@router.get("/users")
def list_users(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    users = db.scalars(
        select(User).order_by(User.created_at.desc())
    ).all()

    return {
        "total_users": len(users),
        "users": [
            {
                "id": user.id,
                "email": user.email,
                "role": user.role,
                "is_active": user.is_active,
                "created_at": (
                    user.created_at.isoformat()
                    if user.created_at else None
                ),
            }
            for user in users
        ],
    }


@router.post("/users", status_code=201)
def create_researcher(
    request: CreateResearcherRequest,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    email = request.email.strip().lower()

    if "@" not in email:
        raise HTTPException(
            status_code=422,
            detail="Enter a valid email address.",
        )

    existing = db.scalar(
        select(User).where(User.email == email)
    )

    if existing:
        raise HTTPException(
            status_code=409,
            detail="An account with this email already exists.",
        )

    researcher = User(
        id=str(uuid4()),
        email=email,
        hashed_password=password_hasher.hash(request.password),
        role="Researcher",
        is_active=True,
        token_version=0,
        created_by_user_id=admin.id,
        created_at=datetime.now(timezone.utc),
    )

    db.add(researcher)

    add_audit(
        db,
        admin.id,
        "RESEARCHER_CREATED",
        "User",
        researcher.id,
        {"email": email},
    )

    db.commit()
    db.refresh(researcher)

    return {
        "message": "Researcher account created.",
        "user": {
            "id": researcher.id,
            "email": researcher.email,
            "role": researcher.role,
            "is_active": researcher.is_active,
        },
    }


@router.patch("/users/{user_id}/status")
def update_user_status(
    user_id: str,
    request: AccountStatusRequest,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    user = db.get(User, user_id)

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found.",
        )

    if user.id == admin.id and not request.is_active:
        raise HTTPException(
            status_code=400,
            detail="You cannot deactivate your own Admin account.",
        )

    if user.role != "Researcher":
        raise HTTPException(
            status_code=400,
            detail="This endpoint only manages Researcher accounts.",
        )

    user.is_active = request.is_active
    user.token_version += 1

    action = (
        "RESEARCHER_ACTIVATED"
        if request.is_active
        else "RESEARCHER_DEACTIVATED"
    )

    add_audit(
        db,
        admin.id,
        action,
        "User",
        user.id,
        {"email": user.email},
    )

    db.commit()

    return {
        "message": "Researcher account updated.",
        "user_id": user.id,
        "is_active": user.is_active,
    }


@router.get("/patients")
def list_patients_for_assignment(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    patients = db.scalars(
        select(Patient).order_by(Patient.name.asc())
    ).all()

    researchers = db.scalars(
        select(User).where(User.role == "Researcher")
    ).all()

    researcher_lookup = {
        user.id: user.email for user in researchers
    }

    return {
        "total_patients": len(patients),
        "patients": [
            {
                "id": patient.id,
                "name": patient.name,
                "age": patient.age,
                "sex": patient.sex,
                "diagnosis": patient.diagnosis,
                "status": patient.status,
                "assigned_to_user_id": patient.assigned_to_user_id,
                "assigned_researcher_email": researcher_lookup.get(
                    patient.assigned_to_user_id
                ),
            }
            for patient in patients
        ],
    }


@router.post("/patients/{patient_id}/assign")
def assign_patient(
    patient_id: str,
    request: AssignPatientRequest,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    patient = db.get(Patient, patient_id)

    if patient is None:
        raise HTTPException(
            status_code=404,
            detail="Patient not found.",
        )

    researcher = db.get(User, request.researcher_id)

    if researcher is None or researcher.role != "Researcher":
        raise HTTPException(
            status_code=404,
            detail="Researcher account not found.",
        )

    if not researcher.is_active:
        raise HTTPException(
            status_code=400,
            detail="Cannot assign a patient to an inactive Researcher.",
        )

    previous_assignment = patient.assigned_to_user_id
    patient.assigned_to_user_id = researcher.id

    add_audit(
        db,
        admin.id,
        "PATIENT_ASSIGNED",
        "Patient",
        patient.id,
        {
            "researcher_id": researcher.id,
            "previous_assignee_id": previous_assignment,
        },
    )

    db.commit()

    return {
        "message": "Patient assigned successfully.",
        "patient_id": patient.id,
        "assigned_to_user_id": researcher.id,
        "researcher_email": researcher.email,
    }


@router.get("/audit-logs")
def get_audit_logs(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    logs = db.scalars(
        select(AuditLog)
        .order_by(AuditLog.created_at.desc())
        .limit(200)
    ).all()

    return {
        "total_logs": len(logs),
        "logs": [
            {
                "id": log.id,
                "user_id": log.user_id,
                "action": log.action,
                "entity_type": log.entity_type,
                "entity_id": log.entity_id,
                "details": log.details,
                "created_at": (
                    log.created_at.isoformat()
                    if log.created_at else None
                ),
            }
            for log in logs
        ],
    }
