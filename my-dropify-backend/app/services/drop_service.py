from sqlalchemy.orm import Session
from app.models.drop import Drop
from app.models.session import Session as SessionModel


def create_text_drop(
    db: Session,
    session_code: str,
    content: str
) -> Drop:

    if not content or not content.strip():
        raise ValueError("Content cannot be empty")

    # Faster existence check (no full object load)
    exists = (
        db.query(SessionModel.id)
        .filter(SessionModel.code == session_code)
        .first()
    )

    if not exists:
        raise ValueError("Session does not exist")

    clean_content = content.strip()

    drop = Drop(
        session_code=session_code,
        content=clean_content,
    )

    db.add(drop)
    db.commit()
    db.refresh(drop)

    return drop
