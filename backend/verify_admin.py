from getpass import getpass
from sqlalchemy import select
from database import SessionLocal
from models import User
from pwdlib import PasswordHash

email = input("Admin email: ").strip().lower()
password = getpass("Enter the Admin password: ")

with SessionLocal() as session:
    user = session.scalar(select(User).where(User.email == email))

    if not user:
        print("Account not found.")
    else:
        valid = PasswordHash.recommended().verify(
            password, user.hashed_password
        )
        print("Password verification:", "SUCCESS" if valid else "FAILED")
