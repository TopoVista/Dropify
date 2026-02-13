from datetime import datetime, timedelta, UTC
from app.services.expiry_service import cleanup_expired_sessions
from app.db.database import SessionLocal
from app.models.session import Session as SessionModel


def test_expired_session_cleanup():
    db = SessionLocal()

    expired = SessionModel(
        code="999999",
        expires_at=datetime.now(UTC) - timedelta(minutes=1)
    )

    db.add(expired)
    db.commit()

    cleanup_expired_sessions(db)

    result = db.query(SessionModel).filter_by(code="999999").first()
    assert result is None

    db.close()
