from getpass import getpass
from uuid import uuid4
from sqlalchemy import select
from database import SessionLocal
from models import User
from pwdlib import PasswordHash

password_hasher = PasswordHash.recommended()

email = input("Admin email: ").strip().lower()
password = getpass("Admin password (minimum 12 characters): ")
confirm = getpass("Confirm admin password: ")

if not email or "@" not in email:
    raise SystemExit("Please enter a valid email address.")

if len(password) < 12:
    raise SystemExit("Password must contain at least 12 characters.")

if password != confirm:
    raise SystemExit("Passwords do not match.")

with SessionLocal() as session:
    existing = session.scalar(select(User).where(User.email == email))

    if existing:
        raise SystemExit("An account with this email already exists.")

    admin = User(
        id=str(uuid4()),
        email=email,
        hashed_password=password_hasher.hash(password),
        role="Admin",
        is_active=True,
        token_version=0
    )

    session.add(admin)
    session.commit()

print(f"Admin account created successfully: {email}")
