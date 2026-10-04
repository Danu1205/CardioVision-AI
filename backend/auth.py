import os
from datetime import datetime, timedelta, timezone
from uuid import uuid4

import jwt
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from pwdlib import PasswordHash
from sqlalchemy import select
from sqlalchemy.orm import Session

from database import SessionLocal
from models import User, AuditLog

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

password_hasher = PasswordHash.recommended()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
JWT_ALGORITHM = "HS256"
TOKEN_EXPIRE_MINUTES = 480

if not JWT_SECRET_KEY or len(JWT_SECRET_KEY) < 32:
    raise RuntimeError("JWT_SECRET_KEY is missing or too short. Check backend/.env.")


class LoginRequest(BaseModel):
    email: str
    password: str


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def record_audit(
    db: Session,
    user_id: str,
    action: str,
    entity_type: str = "User",
    entity_id: str | None = None,
):
    db.add(
        AuditLog(
            id=str(uuid4()),
            user_id=user_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            details={},
            created_at=datetime.now(timezone.utc),
        )
    )


def create_access_token(user: User) -> str:
    now = datetime.now(timezone.utc)

    payload = {
        "sub": user.id,
        "ver": user.token_version,
        "iat": now,
        "exp": now + timedelta(minutes=TOKEN_EXPIRE_MINUTES),
    }

    return jwt.encode(
        payload,
        JWT_SECRET_KEY,
        algorithm=JWT_ALGORITHM,
    )


def authenticate_user(
    db: Session,
    email: str,
    password: str,
) -> User:
    email = email.strip().lower()

    user = db.scalar(
        select(User).where(User.email == email)
    )

    if (
        user is None
        or not user.is_active
        or not password_hasher.verify(
            password,
            user.hashed_password,
        )
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


def build_login_response(
    db: Session,
    user: User,
):
    token = create_access_token(user)

    record_audit(
        db,
        user.id,
        "LOGIN",
        entity_type="User",
        entity_id=user.id,
    )

    db.commit()

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "role": user.role,
        },
    }


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired authentication token.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(
            token,
            JWT_SECRET_KEY,
            algorithms=[JWT_ALGORITHM],
        )

        user_id = payload.get("sub")
        token_version = payload.get("ver")

        if not user_id or token_version is None:
            raise credentials_error

    except jwt.InvalidTokenError:
        raise credentials_error

    user = db.scalar(
        select(User).where(User.id == user_id)
    )

    if (
        user is None
        or not user.is_active
        or user.token_version != token_version
    ):
        raise credentials_error

    return user


def require_admin(
    user: User = Depends(get_current_user),
) -> User:
    if user.role != "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator access required.",
        )

    return user


# Swagger / OAuth2 login
@router.post("/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    user = authenticate_user(
        db,
        form_data.username,
        form_data.password,
    )

    return build_login_response(db, user)


# JSON login for the React frontend
@router.post("/login/json")
def login_json(
    request: LoginRequest,
    db: Session = Depends(get_db),
):
    user = authenticate_user(
        db,
        request.email,
        request.password,
    )

    return build_login_response(db, user)


@router.get("/me")
def get_me(
    user: User = Depends(get_current_user),
):
    return {
        "id": user.id,
        "email": user.email,
        "role": user.role,
        "is_active": user.is_active,
    }


@router.post("/logout")
def logout(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user.token_version += 1

    record_audit(
        db,
        user.id,
        "LOGOUT",
        entity_type="User",
        entity_id=user.id,
    )

    db.commit()

    return {
        "message": "Logged out successfully."
    }
