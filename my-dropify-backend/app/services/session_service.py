import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.session import Session as SessionModel

SESSION_TTL_SECONDS = 3600
MAX_CODE_GENERATION_ATTEMPTS = 20


def generate_code() -> str:
    return f"{random.randint(0, 999999):06d}"


def _generate_unique_code(db: Session) -> str:
    for _ in range(MAX_CODE_GENERATION_ATTEMPTS):
        code = generate_code()

        exists = (
            db.query(SessionModel)
            .filter(SessionModel.code == code)
            .first()
        )

        if not exists:
            return code

    raise RuntimeError("Unable to generate unique session code")


def create_session(db: Session) -> SessionModel:
    code = _generate_unique_code(db)

    expires_at = datetime.utcnow() + timedelta(seconds=SESSION_TTL_SECONDS)

    session = SessionModel(
        code=code,
        expires_at=expires_at,
    )

    db.add(session)
    db.commit()
    db.refresh(session)

    return session


def get_session_by_code(db: Session, code: str) -> SessionModel | None:
    session = (
        db.query(SessionModel)
        .filter(SessionModel.code == code)
        .first()
    )

    if not session:
        return None

    if session.expires_at < datetime.utcnow():
        return None

    return session
