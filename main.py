from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
from uuid import uuid4
import shutil

app = FastAPI(
    title="CardioVision AI API",
    description="Backend API for cardiac MRI research and myocarditis classification.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

MAX_FILE_SIZE = 100 * 1024 * 1024

ALLOWED_EXTENSIONS = {
    ".dcm", ".nii", ".gz", ".jpg", ".jpeg", ".png"
}

@app.get("/")
def home():
    return {
        "message": "Welcome to CardioVision AI API",
        "status": "running",
        "project": "Deep Learning-Based Detection and Classification of Myocarditis Using Cardiac MRI"
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "model_status": "MODEL_NOT_READY",
        "message": "Backend is running. AI model integration is pending."
    }

@app.post("/api/upload")
async def upload_mri(file: UploadFile = File(...)):
    original_name = Path(file.filename or "").name
    extension = Path(original_name).suffix.lower()

    if not original_name or extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file extension."
        )

    study_id = str(uuid4())
    safe_filename = f"{study_id}{extension}"
    destination = UPLOAD_DIR / safe_filename

    size = 0

    try:
        with destination.open("wb") as buffer:
            while chunk := await file.read(1024 * 1024):
                size += len(chunk)

                if size > MAX_FILE_SIZE:
                    raise HTTPException(
                        status_code=413,
                        detail="File exceeds the 100 MB limit."
                    )

                buffer.write(chunk)

    except HTTPException:
        destination.unlink(missing_ok=True)
        raise

    except Exception:
        destination.unlink(missing_ok=True)
        raise HTTPException(
            status_code=500,
            detail="Unable to save the uploaded file."
        )

    finally:
        await file.close()

    return {
        "study_id": study_id,
        "filename": original_name,
        "stored_filename": safe_filename,
        "size_bytes": size,
        "format": extension,
        "status": "UPLOADED_PENDING_VALIDATION",
        "message": "File received. Medical image validation has not yet been performed."
    }
