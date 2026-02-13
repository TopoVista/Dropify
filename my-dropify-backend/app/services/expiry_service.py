from datetime import datetime, UTC
from sqlalchemy.orm import Session
from app.models.session import Session as SessionModel
from app.models.drop import Drop


def cleanup_expired_sessions(db: Session) -> int:
    now = datetime.now(UTC)

    expired_sessions = (
        db.query(SessionModel)
        .filter(SessionModel.expires_at < now)
        .all()
    )

    if not expired_sessions:
        return 0

    expired_codes = [session.code for session in expired_sessions]

    (
        db.query(Drop)
        .filter(Drop.session_code.in_(expired_codes))
        .delete(synchronize_session=False)
    )

    (
        db.query(SessionModel)
        .filter(SessionModel.code.in_(expired_codes))
        .delete(synchronize_session=False)
    )

    db.commit()

    return len(expired_codes)
