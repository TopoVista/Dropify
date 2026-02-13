import os
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import asyncio

from app.db.database import init_db, SessionLocal
from app.routers import health, sessions
from app.websocket.manager import manager
from app.services.expiry_service import cleanup_expired_sessions


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()

    task = None

    if os.getenv("RUN_EXPIRY_LOOP", "true") == "true":
        async def expiry_loop():
            while True:
                db = SessionLocal()
                try:
                    deleted = cleanup_expired_sessions(db)
                    if deleted:
                        print(f"Cleaned {deleted} expired sessions")
                finally:
                    db.close()
                await asyncio.sleep(60)

        task = asyncio.create_task(expiry_loop())

    yield

    if task:
        task.cancel()



app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.get("/")
def root():
    return {"message": "Hello Dropify"}

app.include_router(health.router)
app.include_router(sessions.router)

@app.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    await manager.connect(session_id, websocket)
    try:
        while True:
            await asyncio.sleep(3600)
    except WebSocketDisconnect:
        manager.disconnect(session_id, websocket)

