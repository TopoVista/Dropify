from sqlalchemy.orm import Session
from sqlalchemy import update
from app.models.drop import Drop


def consume_burn_drop(db: Session, drop_id: int) -> bool:
    result = db.execute(
        update(Drop)
        .where(
            Drop.id == drop_id,
            Drop.burn_after_read == True,
            Drop.is_deleted == False,
        )
        .values(is_deleted=True)
    )

    db.commit()

    return result.rowcount == 1
