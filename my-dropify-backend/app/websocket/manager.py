from fastapi import WebSocket
from typing import Dict, List


class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, session_code: str, websocket: WebSocket):
        await websocket.accept()
        if session_code not in self.active_connections:
            self.active_connections[session_code] = []
        self.active_connections[session_code].append(websocket)

    def disconnect(self, session_code: str, websocket: WebSocket):
        self.active_connections[session_code].remove(websocket)

    async def broadcast(self, session_code: str, message: str):
        if session_code in self.active_connections:
            for connection in self.active_connections[session_code]:
                await connection.send_text(message)

manager = ConnectionManager()