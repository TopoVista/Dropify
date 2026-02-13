from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.database import get_db
from app.services.session_service import create_session, get_session_by_code
from app.services.drop_service import create_text_drop
from app.services.file_service import save_file
from app.services.qrcode_service import generate_session_qrcode
from app.websocket.manager import manager
from app.core.dependencies import rate_limit_dependency


router = APIRouter()


class JoinRequest(BaseModel):
    code: str


class TextDropRequest(BaseModel):
    content: str


def _require_session(db: Session, code: str):
    session = get_session_by_code(db, code)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session



@router.post("/sessions", dependencies=[Depends(rate_limit_dependency)])
def create(db: Session = Depends(get_db)):
    session = create_session(db)
    return {"code": session.code}


@router.get("/sessions/{code}")
def get_session(code: str, db: Session = Depends(get_db)):
    session = _require_session(db, code)
    return {
        "code": session.code,
        "expires_at": session.expires_at,
    }


@router.post("/sessions/join")
def join(data: JoinRequest, db: Session = Depends(get_db)):
    session = _require_session(db, data.code)
    return {
        "code": session.code,
        "expires_at": session.expires_at,
    }


@router.post("/sessions/{code}/drops/text")
async def create_drop(
    code: str,
    data: TextDropRequest,
    db: Session = Depends(get_db),
):
    _require_session(db, code)

    try:
        drop = create_text_drop(db, code, data.content)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    await manager.broadcast(code, drop.content)

    return {"content": drop.content}


@router.post("/sessions/{code}/drops/file", dependencies=[Depends(rate_limit_dependency)])
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

    return {"file_path": drop.file_path}


@router.get("/sessions/{code}/qrcode")
def get_qrcode(code: str):
    return generate_session_qrcode(code)
