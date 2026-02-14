from fastapi import WebSocket
from typing import Dict, List


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

            # Clean up empty session lists
            if not self.active_connections[session_code]:
                del self.active_connections[session_code]

    async def broadcast(self, code: str, message: str):
        if code not in self.active_connections:
            return

        # Copy list to avoid mutation issues
        connections = list(self.active_connections[code])

        for connection in connections:
            try:
                await connection.send_text(message)
            except Exception:
                self.disconnect(code, connection)


manager = ConnectionManager()
