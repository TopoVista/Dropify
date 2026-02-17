from sqlalchemy import Column, Integer, String, DateTime, Boolean
from datetime import datetime
from app.models.base import Base


class Drop(Base):
    __tablename__ = "drops"

    id = Column(Integer, primary_key=True, index=True)
    session_code = Column(String, index=True)

    content = Column(String, nullable=True)
    file_path = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    expires_at = Column(DateTime, nullable=True)

    burn_after_read = Column(Boolean, default=False)
    is_deleted = Column(Boolean, default=False)

    # Needed for one-time downloads
    download_token = Column(String, unique=True, nullable=True)
    is_downloaded = Column(Boolean, default=False)
