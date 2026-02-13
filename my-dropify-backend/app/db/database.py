from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import DATABASE_URL
from app.models.base import Base
from app.models.session import Session  # register model
from sqlalchemy.orm import Session
from typing import Generator
from app.models.drop import Drop



engine = create_engine(DATABASE_URL, future=True)

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False
)


def init_db():
    Base.metadata.create_all(bind=engine)


# Ensure tables are created on import (helps tests and simple setups)
init_db()

def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

from sqlalchemy import text

