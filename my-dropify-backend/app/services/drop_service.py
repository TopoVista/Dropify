import html
from sqlalchemy.orm import Session
from app.models.drop import Drop
from app.models.session import Session as SessionModel


MAX_TEXT_LENGTH = 5000


def _sanitize_text(content: str) -> str:
    # Escape HTML to prevent XSS
    escaped = html.escape(content)

    # Optional: collapse excessive whitespace
    return escaped.strip()


def create_text_drop(
    db: Session,
    session_code: str,
    content: str
) -> Drop:

    if not content or not content.strip():
        raise ValueError("Content cannot be empty")

    if len(content) > MAX_TEXT_LENGTH:
        raise ValueError("Text too long")

    exists = (
        db.query(SessionModel.id)
        .filter(SessionModel.code == session_code)
        .first()
    )

    if not exists:
        raise ValueError("Session does not exist")

    clean_content = _sanitize_text(content)

    drop = Drop(
        session_code=session_code,
        content=clean_content,
    )

    db.add(drop)
    db.commit()
    db.refresh(drop)

    return drop


def get_drops_by_session(db: Session, session_code: str):
    return (
        db.query(Drop)
        .filter(Drop.session_code == session_code)
        .order_by(Drop.id.asc())
        .all()
    )
