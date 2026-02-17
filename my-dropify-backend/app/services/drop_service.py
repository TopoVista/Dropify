import html
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import update, and_, or_

from app.models.drop import Drop
from app.models.session import Session as SessionModel


MAX_TEXT_LENGTH = 5000
DEFAULT_DROP_TTL_SECONDS = 3600


def _to_naive_utc(dt):
    if not dt:
        return None
    if dt.tzinfo is not None:
        return dt.replace(tzinfo=None)
    return dt


def create_text_drop(
    db: Session,
    session_code: str,
    content: str,
    drop_type: str = "text",
    burn_after_read: bool = False,
) -> Drop:

    if not content or not content.strip():
        raise ValueError("Content cannot be empty")

    if len(content) > MAX_TEXT_LENGTH:
        raise ValueError("Text too long")

    if drop_type not in ("text", "code"):
        raise ValueError("Invalid drop type")

    session = (
        db.query(SessionModel)
        .filter(SessionModel.code == session_code)
        .first()
    )

    if not session:
        raise ValueError("Session does not exist")

    clean_content = html.escape(content)

    now = datetime.utcnow()

    drop_expiry = now + timedelta(seconds=DEFAULT_DROP_TTL_SECONDS)

    session_expiry = _to_naive_utc(session.expires_at)

    if session_expiry and session_expiry < drop_expiry:
        drop_expiry = session_expiry

    stored_content = f"{drop_type}|{clean_content}"

    drop = Drop(
        session_code=session_code,
        content=stored_content,
        burn_after_read=burn_after_read,
        expires_at=drop_expiry,
        is_deleted=False,
        created_at=now,
    )

    db.add(drop)
    db.commit()
    db.refresh(drop)

    return drop


def get_drops_by_session(db: Session, session_code: str):
    now = datetime.utcnow()

    return (
        db.query(Drop)
        .filter(Drop.session_code == session_code)
        .filter(Drop.is_deleted == False)
        .filter(
            or_(
                Drop.expires_at == None,
                Drop.expires_at > now
            )
        )
        .order_by(Drop.id.asc())
        .all()
    )


def atomic_consume_drop(db: Session, drop_id: int) -> bool:
    result = db.execute(
        update(Drop)
        .where(
            and_(
                Drop.id == drop_id,
                Drop.burn_after_read == True,
                Drop.is_deleted == False,
            )
        )
        .values(is_deleted=True)
    )

    db.commit()

    return result.rowcount > 0
