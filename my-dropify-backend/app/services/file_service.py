import os
import uuid
import secrets
from pathlib import Path
from fastapi import UploadFile
from sqlalchemy.orm import Session
from app.models.drop import Drop
from app.models.session import Session as SessionModel
from app.services.expiry_prediction_service import predict_expiry


ALLOWED_EXTENSIONS = {"txt", "pdf", "png", "jpg", "jpeg"}

FORBIDDEN_EXTENSIONS = {
    "exe", "sh", "bat", "cmd", "msi", "js", "html", "php", "py"
}

MAX_FILE_SIZE = 5 * 1024 * 1024

UPLOAD_DIR = Path("uploads")


def _validate_extension(filename: str) -> str:
    if "." not in filename:
        raise ValueError("File must have an extension")

    parts = filename.split(".")
    extension = parts[-1].lower()

    if len(parts) > 2 and parts[-2].lower() in FORBIDDEN_EXTENSIONS:
        raise ValueError("Suspicious file name")

    if extension in FORBIDDEN_EXTENSIONS:
        raise ValueError("File type not allowed")

    if extension not in ALLOWED_EXTENSIONS:
        raise ValueError("File type not allowed")

    return extension


def _validate_mime_type(file: UploadFile):
    if not file.content_type:
        raise ValueError("Invalid file type")

    if not (
        file.content_type.startswith("image/")
        or file.content_type == "application/pdf"
        or file.content_type == "text/plain"
    ):
        raise ValueError("Invalid file type")


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

    _validate_mime_type(file)

    content = await file.read()

    if not content:
        raise ValueError("File cannot be empty")

    if len(content) > MAX_FILE_SIZE:
        raise ValueError("File too large (max 5MB)")

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

    unique_filename = f"{uuid.uuid4()}.{extension}"
    file_path = UPLOAD_DIR / unique_filename

    try:
        with open(file_path, "wb") as f:
            f.write(content)
    except Exception:
        raise ValueError("Failed to save file")

    normalized_path = file_path.as_posix()

    expiry = predict_expiry(None, normalized_path)

    download_token = secrets.token_urlsafe(32)

    drop = Drop(
        session_code=session_code,
        content=None,
        file_path=normalized_path,
        expires_at=expiry,
        download_token=download_token,
        is_downloaded=False,
        is_deleted=False,
    )

    db.add(drop)
    db.commit()
    db.refresh(drop)

    return drop
