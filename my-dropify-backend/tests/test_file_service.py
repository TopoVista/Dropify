import pytest
from fastapi import UploadFile
from io import BytesIO
from app.services.file_service import save_file
from app.services.session_service import create_session
from app.db.database import SessionLocal


@pytest.mark.asyncio
async def test_save_file_success(tmp_path):
    db = SessionLocal()

    # Create session first
    session = create_session(db)

    file_content = b"hello"
    file = UploadFile(
        filename="test.txt",
        file=BytesIO(file_content)
    )

    drop = await save_file(db, session.code, file)

    assert drop.file_path.endswith(".txt")

    db.close()


@pytest.mark.asyncio
async def test_invalid_extension(tmp_path):
    db = SessionLocal()

    session = create_session(db)

    file_content = b"hello"
    file = UploadFile(
        filename="test.exe",
        file=BytesIO(file_content)
    )

    with pytest.raises(ValueError):
        await save_file(db, session.code, file)

    db.close()


@pytest.mark.asyncio
async def test_empty_file(tmp_path):
    db = SessionLocal()

    session = create_session(db)

    file_content = b""
    file = UploadFile(
        filename="test.txt",
        file=BytesIO(file_content)
    )

    with pytest.raises(ValueError):
        await save_file(db, session.code, file)

    db.close()
