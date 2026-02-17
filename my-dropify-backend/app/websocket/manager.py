from fastapi import WebSocket
from typing import Dict, List
import json


class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, session_code: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.setdefault(session_code, []).append(websocket)

    def disconnect(self, session_code: str, websocket: WebSocket):
        if session_code in self.active_connections:
            if websocket in self.active_connections[session_code]:
                self.active_connections[session_code].remove(websocket)

            if not self.active_connections[session_code]:
                del self.active_connections[session_code]

    async def broadcast(self, code: str, message: dict):
        if code not in self.active_connections:
            return

        connections = list(self.active_connections[code])

        for connection in connections:
            try:
                await connection.send_json(message)   # 🔥 FIX
            except Exception:
                self.disconnect(code, connection)


manager = ConnectionManager()