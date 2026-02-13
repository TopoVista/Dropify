import os
import uuid
from pathlib import Path
from fastapi import UploadFile
from sqlalchemy.orm import Session
from app.models.drop import Drop
from app.models.session import Session as SessionModel


ALLOWED_EXTENSIONS = {"txt", "pdf", "png", "jpg", "jpeg"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

UPLOAD_DIR = Path("uploads")


def _validate_extension(filename: str) -> str:
    if "." not in filename:
        raise ValueError("File must have an extension")

    extension = filename.rsplit(".", 1)[1].lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise ValueError("File type not allowed")

    return extension


def _sanitize_filename(filename: str) -> str:
    return os.path.basename(filename)


def _ensure_session_exists(db: Session, session_code: str):
    session = (
        db.query(SessionModel)
        .filter(SessionModel.code == session_code)
        .first()
    )

    if not session:
        raise ValueError("Session does not exist")


async def save_file(
    db: Session,
    session_code: str,
    file: UploadFile
) -> Drop:

    if not file.filename:
        raise ValueError("File must have a name")

    _ensure_session_exists(db, session_code)

    clean_name = _sanitize_filename(file.filename)
    extension = _validate_extension(clean_name)

    content = await file.read()

    if not content:
        raise ValueError("File cannot be empty")

    if len(content) > MAX_FILE_SIZE:
        raise ValueError("File too large")

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

    unique_filename = f"{uuid.uuid4()}.{extension}"
    file_path = UPLOAD_DIR / unique_filename

    try:
        with open(file_path, "wb") as f:
            f.write(content)
    except Exception:
        raise ValueError("Failed to save file")

    normalized_path = file_path.as_posix()

    drop = Drop(
        session_code=session_code,
        content=None,
        file_path=normalized_path,
    )

    db.add(drop)
    db.commit()
    db.refresh(drop)

    return drop
