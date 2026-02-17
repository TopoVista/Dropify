from datetime import datetime, UTC
from sqlalchemy.orm import Session
from app.models.session import Session as SessionModel
from app.models.drop import Drop


def cleanup_expired_sessions(db: Session):
    now = datetime.now(UTC)

    # Delete expired drops
    deleted_drops = (
        db.query(Drop)
        .filter(Drop.expires_at != None)
        .filter(Drop.expires_at < now)
        .delete()
    )

    # Delete expired sessions
    deleted_sessions = (
        db.query(SessionModel)
        .filter(SessionModel.expires_at < now)
        .delete()
    )

    db.commit()

    return deleted_drops + deleted_sessions
