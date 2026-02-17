from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import update
from pydantic import BaseModel
from datetime import datetime, timedelta
import os

from app.db.database import get_db
from app.services.session_service import create_session, get_session_by_code
from app.services.drop_service import (
    create_text_drop,
    get_drops_by_session,
    atomic_consume_drop,
)
from app.services.file_service import save_file
from app.services.qrcode_service import generate_session_qrcode
from app.websocket.manager import manager
from app.core.dependencies import rate_limit_dependency
from app.models.session import Session as SessionModel
from app.models.drop import Drop


router = APIRouter()


# =========================
# REQUEST MODELS
# =========================

class JoinRequest(BaseModel):
    code: str


class TextDropRequest(BaseModel):
    content: str
    drop_type: str = "text"
    burn_after_read: bool = False


# =========================
# HELPERS
# =========================

def _require_session(db: Session, code: str):
    session = get_session_by_code(db, code)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


# =========================
# SESSION ROUTES
# =========================

@router.post("/sessions", dependencies=[Depends(rate_limit_dependency)])
async def create(db: Session = Depends(get_db)):
    session = create_session(db)
    return {"code": session.code}


@router.get("/sessions/{code}")
def get_session(code: str, db: Session = Depends(get_db)):
    session = _require_session(db, code)
    return {
        "code": session.code,
        "expires_at": session.expires_at.isoformat()
        if session.expires_at else None,
    }


@router.post("/sessions/join")
def join(data: JoinRequest, db: Session = Depends(get_db)):
    session = _require_session(db, data.code)
    return {
        "code": session.code,
        "expires_at": session.expires_at.isoformat()
        if session.expires_at else None,
    }


# =========================
# DROP ROUTES
# =========================

@router.get("/sessions/{code}/drops")
def get_drops(code: str, db: Session = Depends(get_db)):
    _require_session(db, code)

    drops = get_drops_by_session(db, code)
    result = []

    for drop in drops:

        if drop.file_path:
            result.append({
                "id": drop.id,
                "type": "file",
                "path": drop.file_path,
                "created_at": drop.created_at.isoformat(),
                "expires_at": drop.expires_at.isoformat()
                if drop.expires_at else None,
                "burn_after_read": drop.burn_after_read,
            })
        else:
            if "|" in drop.content:
                drop_type, actual_content = drop.content.split("|", 1)
            else:
                drop_type = "text"
                actual_content = drop.content

            result.append({
                "id": drop.id,
                "type": drop_type,
                "content": actual_content,
                "created_at": drop.created_at.isoformat(),
                "expires_at": drop.expires_at.isoformat()
                if drop.expires_at else None,
                "burn_after_read": drop.burn_after_read,
            })

    return result


@router.post("/sessions/{code}/drops/text")
async def create_drop(
    code: str,
    data: TextDropRequest,
    db: Session = Depends(get_db),
):
    _require_session(db, code)

    try:
        drop = create_text_drop(
            db,
            code,
            data.content,
            drop_type=data.drop_type,
            burn_after_read=data.burn_after_read,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    drop_type, actual_content = drop.content.split("|", 1)

    await manager.broadcast(
        code,
        {
            "event": "NEW_DROP",
            "id": drop.id,
            "type": drop_type,
            "content": actual_content,
            "created_at": drop.created_at.isoformat(),
            "expires_at": drop.expires_at.isoformat() if drop.expires_at else None,
            "burn_after_read": drop.burn_after_read,
        },
    )

    return {
        "id": drop.id,
        "type": drop_type,
        "content": actual_content,
        "burn_after_read": drop.burn_after_read,
    }


@router.post(
    "/sessions/{code}/drops/file",
    dependencies=[Depends(rate_limit_dependency)],
)
async def create_file_drop(
    code: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    _require_session(db, code)

    try:
        drop = await save_file(db, code, file)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    await manager.broadcast(
        code,
        {
            "event": "NEW_DROP",
            "id": drop.id,
            "type": "file",
            "path": drop.file_path,
            "created_at": drop.created_at.isoformat(),
            "expires_at": drop.expires_at.isoformat()
            if drop.expires_at else None,
        },
    )

    return {
        "id": drop.id,
        "path": drop.file_path,
    }


# =========================
# BURN AFTER READ
# =========================

@router.post("/sessions/{code}/drops/{drop_id}/consume")
async def consume_drop(
    code: str,
    drop_id: int,
    db: Session = Depends(get_db),
):
    drop = (
        db.query(Drop)
        .filter(Drop.id == drop_id)
        .filter(Drop.session_code == code)
        .first()
    )

    if not drop:
        raise HTTPException(status_code=404, detail="Drop not found")

    if not drop.burn_after_read:
        return {"consumed": False}

    was_consumed = atomic_consume_drop(db, drop_id)

    if was_consumed:
        await manager.broadcast(
            code,
            {
                "event": "DELETE_DROP",
                "id": drop_id,
            },
        )

    return {"consumed": was_consumed}


# =========================
# ONE-TIME DOWNLOAD
# =========================

@router.get("/downloads/{token}")
def download_file(token: str, db: Session = Depends(get_db)):

    drop = (
        db.query(Drop)
        .filter(Drop.download_token == token)
        .filter(Drop.is_deleted == False)
        .first()
    )

    if not drop:
        raise HTTPException(status_code=404, detail="Invalid or expired link")

    if drop.is_downloaded:
        raise HTTPException(status_code=410, detail="File already downloaded")

    if not drop.file_path or not os.path.exists(drop.file_path):
        raise HTTPException(status_code=404, detail="File not found")

    result = db.execute(
        update(Drop)
        .where(Drop.id == drop.id)
        .where(Drop.is_downloaded == False)
        .values(is_downloaded=True)
    )

    db.commit()

    if result.rowcount == 0:
        raise HTTPException(status_code=410, detail="File already downloaded")

    return FileResponse(
        path=drop.file_path,
        filename=os.path.basename(drop.file_path),
        media_type="application/octet-stream",
    )


# =========================
# QR CODE
# =========================

@router.get("/sessions/{code}/qrcode")
def get_qrcode(code: str):
    return generate_session_qrcode(code)


# =========================
# FORCE EXPIRE SESSION
# =========================

@router.delete("/sessions/{code}/expire")
def expire_session(code: str, db: Session = Depends(get_db)):
    session = (
        db.query(SessionModel)
        .filter(SessionModel.code == code)
        .first()
    )

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    session.expires_at = datetime.utcnow() - timedelta(seconds=1)
    db.commit()

    return {"expired": True}
