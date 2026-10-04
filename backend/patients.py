from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from database import SessionLocal
from models import Patient, User, AuditLog
from auth import get_current_user


router = APIRouter(prefix="/api", tags=["Patients"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_accessible_patient(db: Session, patient_id: str, user: User):
    patient = db.get(Patient, patient_id)

    if patient is None:
        raise HTTPException(status_code=404, detail="Patient not found.")

    if user.role == "Admin":
        return patient

    if user.role != "Researcher":
        raise HTTPException(status_code=403, detail="Role not permitted.")

    if (
        patient.created_by_user_id != user.id
        and patient.assigned_to_user_id != user.id
    ):
        raise HTTPException(
            status_code=403,
            detail="You do not have access to this patient.",
        )

    return patient


def patient_to_dict(patient: Patient):
    return {
        "id": patient.id,
        "name": patient.name,
        "age": patient.age,
        "sex": patient.sex,
        "email": patient.email,
        "phone": patient.phone,
        "diagnosis": patient.diagnosis or "",
        "dateAdded": patient.date_added,
        "status": patient.status,
        "notes": patient.notes or "",
    }


def record_patient_audit(
    db: Session,
    user_id: str,
    action: str,
    patient_id: str,
):
    db.add(
        AuditLog(
            id=str(uuid4()),
            user_id=user_id,
            action=action,
            entity_type="Patient",
            entity_id=patient_id,
            details={},
        )
    )


class PatientCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    age: int = Field(ge=1, le=120)
    sex: str = Field(pattern="^(Male|Female|Other)$")
    email: str = Field(min_length=3, max_length=255)
    phone: str = Field(min_length=7, max_length=50)
    diagnosis: str | None = None
    notes: str | None = None


class PatientUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    age: int | None = Field(default=None, ge=1, le=120)
    sex: str | None = Field(
        default=None,
        pattern="^(Male|Female|Other)$",
    )
    email: str | None = Field(default=None, max_length=255)
    phone: str | None = Field(default=None, max_length=50)
    diagnosis: str | None = None
    notes: str | None = None


@router.get("/patients")
def list_patients(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    statement = select(Patient).order_by(Patient.date_added.desc())

    if user.role == "Researcher":
        statement = statement.where(
            (Patient.created_by_user_id == user.id)
            | (Patient.assigned_to_user_id == user.id)
        )
    elif user.role != "Admin":
        raise HTTPException(
            status_code=403,
            detail="Your role is not permitted to access patients.",
        )

    patients = db.scalars(statement).all()
    results = [patient_to_dict(patient) for patient in patients]

    return {
        "total": len(results),
        "patients": results,
    }


@router.get("/patients/{patient_id}")
def get_patient(
    patient_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    patient = get_accessible_patient(db, patient_id, user)
    return patient_to_dict(patient)


@router.post("/patients", status_code=201)
def create_patient(
    payload: PatientCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.role not in {"Admin", "Researcher"}:
        raise HTTPException(status_code=403, detail="Role not permitted.")

    patient_id = f"CV-{uuid4().hex[:12].upper()}"

    patient = Patient(
        id=patient_id,
        name=payload.name.strip(),
        age=payload.age,
        sex=payload.sex,
        email=payload.email.strip(),
        phone=payload.phone.strip(),
        diagnosis=payload.diagnosis,
        date_added=__import__("datetime").datetime.now(
            __import__("datetime").timezone.utc
        ).isoformat(),
        status="Registered",
        notes=payload.notes,
        source="manual",
        created_by_user_id=user.id,
        assigned_to_user_id=user.id if user.role == "Researcher" else None,
    )

    try:
        db.add(patient)
        db.flush()
        record_patient_audit(db, user.id, "PATIENT_CREATED", patient_id)
        db.commit()
        db.refresh(patient)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Patient could not be saved.",
        )

    return patient_to_dict(patient)


@router.put("/patients/{patient_id}")
def update_patient(
    patient_id: str,
    payload: PatientUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    patient = get_accessible_patient(db, patient_id, user)
    updates = payload.model_dump(exclude_unset=True)

    if not updates:
        return patient_to_dict(patient)

    for field, value in updates.items():
        if isinstance(value, str) and field in {"name", "email", "phone"}:
            value = value.strip()
        setattr(patient, field, value)

    try:
        record_patient_audit(db, user.id, "PATIENT_UPDATED", patient_id)
        db.commit()
        db.refresh(patient)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Patient could not be updated.",
        )

    return patient_to_dict(patient)
