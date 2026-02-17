from datetime import datetime, UTC
from sqlalchemy.orm import Session
from sqlalchemy import update, select

from app.models.drop import Drop


def cleanup_expired_drops(db: Session):
    """
    Finds drops that:
    - have expires_at set
    - are expired
    - are not already deleted

    Marks them deleted.
    Returns list of {id, session_code}
    """

    now = datetime.now(UTC)

    # Get expired drops first
    expired = (
        db.query(Drop)
        .filter(Drop.expires_at != None)
        .filter(Drop.expires_at < now)
        .filter(Drop.is_deleted == False)
        .all()
    )

    if not expired:
        return []

    expired_ids = [d.id for d in expired]

    # Mark them deleted in one atomic statement
    db.execute(
        update(Drop)
        .where(Drop.id.in_(expired_ids))
        .values(is_deleted=True)
    )

    db.commit()

    # Return info needed for websocket broadcast
    return [
        {
            "id": d.id,
            "session_code": d.session_code,
        }
        for d in expired
    ]
