from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime, UTC
from app.models.base import Base


class Drop(Base):
    __tablename__ = "drops"

    id = Column(Integer, primary_key=True, index=True)
    session_code = Column(String, index=True)
    content = Column(String, nullable=True)
    file_path = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(UTC))
