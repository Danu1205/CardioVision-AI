import json
from datetime import datetime
from pathlib import Path
from uuid import uuid4

from sqlalchemy import select
from database import engine, SessionLocal, Base
from models import Patient, Study, Prediction


def parse_datetime(value):
    if not value:
        return None
    try:
        return datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except (TypeError, ValueError):
        return None


def migrate():
    source = Path(__file__).resolve().parent / "studies.json"
    with source.open("r", encoding="utf-8") as file:
        legacy_studies = json.load(file)

    if not isinstance(legacy_studies, list):
        raise ValueError("studies.json must contain a JSON list")

    Base.metadata.create_all(bind=engine)

    patient_ids = {
        str(item.get("patient_id") or "unknown")
        for item in legacy_studies
    }

    imported_patients = 0
    imported_studies = 0
    imported_predictions = 0

    with SessionLocal.begin() as session:
        # Insert each distinct patient ID once.
        for patient_id in patient_ids:
            if session.get(Patient, patient_id) is None:
                session.add(Patient(
                    id=patient_id,
                    name=None,
                    status="Registered",
                    source="legacy_placeholder",
                ))
                imported_patients += 1

        # Flush patient rows before inserting studies with foreign keys.
        session.flush()

        for item in legacy_studies:
            study_id = str(item.get("study_id") or "")
            if not study_id:
                print("Skipped a record without a study_id")
                continue

            patient_id = str(item.get("patient_id") or "unknown")

            if session.get(Study, study_id) is None:
                session.add(Study(
                    study_id=study_id,
                    patient_id=patient_id,
                    filename=str(item.get("filename") or "unknown"),
                    stored_filename=str(item.get("stored_filename") or ""),
                    size_bytes=int(item.get("size_bytes") or 0),
                    format=str(item.get("format") or "unknown"),
                    status=str(item.get("status") or "UNKNOWN"),
                    validation=item.get("validation"),
                    prediction_status=str(item.get("prediction_status") or "NOT_RUN"),
                    uploaded_at=parse_datetime(item.get("uploaded_at")),
                ))
                imported_studies += 1

            result = item.get("prediction_result")
            if isinstance(result, dict):
                existing = session.scalar(
                    select(Prediction).where(Prediction.study_id == study_id)
                )
                if existing is None:
                    session.add(Prediction(
                        id=str(uuid4()),
                        study_id=study_id,
                        result=result,
                        predicted_at=parse_datetime(result.get("predicted_at")),
                    ))
                    imported_predictions += 1

    with SessionLocal() as session:
        print("Migration completed.")
        print("Patients:", len(session.scalars(select(Patient)).all()))
        print("Studies:", len(session.scalars(select(Study)).all()))
        print("Predictions:", len(session.scalars(select(Prediction)).all()))
        print("New patients:", imported_patients)
        print("New studies:", imported_studies)
        print("New predictions:", imported_predictions)


if __name__ == "__main__":
    migrate()
