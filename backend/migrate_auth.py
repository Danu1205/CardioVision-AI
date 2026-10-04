from sqlalchemy import text
from database import engine
import models

statements = [
    """
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS token_version INTEGER NOT NULL DEFAULT 0
    """,
    """
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS created_by_user_id VARCHAR(36)
    REFERENCES users(id)
    """,
    """
    ALTER TABLE patients
    ADD COLUMN IF NOT EXISTS created_by_user_id VARCHAR(36)
    REFERENCES users(id)
    """,
    """
    ALTER TABLE patients
    ADD COLUMN IF NOT EXISTS assigned_to_user_id VARCHAR(36)
    REFERENCES users(id)
    """,
    """
    ALTER TABLE studies
    ADD COLUMN IF NOT EXISTS uploaded_by_user_id VARCHAR(36)
    REFERENCES users(id)
    """,
    """
    ALTER TABLE predictions
    ADD COLUMN IF NOT EXISTS predicted_by_user_id VARCHAR(36)
    REFERENCES users(id)
    """,
    """
    CREATE INDEX IF NOT EXISTS ix_patients_created_by_user_id
    ON patients(created_by_user_id)
    """,
    """
    CREATE INDEX IF NOT EXISTS ix_patients_assigned_to_user_id
    ON patients(assigned_to_user_id)
    """,
    """
    CREATE INDEX IF NOT EXISTS ix_studies_uploaded_by_user_id
    ON studies(uploaded_by_user_id)
    """,
    """
    CREATE INDEX IF NOT EXISTS ix_predictions_predicted_by_user_id
    ON predictions(predicted_by_user_id)
    """,
    """
    ALTER TABLE users ALTER COLUMN role SET DEFAULT 'Researcher'
    """
]

with engine.begin() as connection:
    for statement in statements:
        connection.execute(text(statement))

    models.AuditLog.__table__.create(connection, checkfirst=True)

print("Authentication database migration completed.")
print("Existing records were preserved.")
