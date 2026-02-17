import os
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.db.database import init_db, SessionLocal
from app.routers import health, sessions
from app.websocket.manager import manager
from app.services.expiry_service import cleanup_expired_sessions
from app.services.drop_cleanup_service import cleanup_expired_drops


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()

    task = None

    # 🔥 DO NOT RUN EXPIRY LOOP DURING TESTS
    if os.getenv("TESTING") != "1" and os.getenv("RUN_EXPIRY_LOOP", "true") == "true":

        async def expiry_loop():
            while True:
                db = SessionLocal()
                try:
                    # Clean sessions
                    deleted_sessions = cleanup_expired_sessions(db)

                    # Clean drops (returns list of expired drop IDs)
                    expired_drop_ids = cleanup_expired_drops(db)

                    if deleted_sessions:
                        print(f"Cleaned {deleted_sessions} expired sessions")

                    # 🔥 Broadcast drop deletions
                    for drop in expired_drop_ids:
                        await manager.broadcast(
                            drop["session_code"],
                            {
                                "event": "DELETE_DROP",
                                "id": drop["id"],
                            },
                        )

                finally:
                    db.close()

                await asyncio.sleep(5)  # every 5 seconds

        task = asyncio.create_task(expiry_loop())

    yield

    if task:
        task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            pass


app = FastAPI(lifespan=lifespan)

from app.core.config import FRONTEND_URL

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        FRONTEND_URL,
        "http://localhost:3001",
        "https://dropify-frontend-psi.vercel.app",
        "https://dropify-frontend-git-main-topovistas-projects.vercel.app",
        "https://dropify-frontend-o7vp4m3zo-topovistas-projects.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("uploads", exist_ok=True)
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
