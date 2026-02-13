from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_websocket_connection_and_broadcast():
    # Create session
    res = client.post("/sessions")
    code = res.json()["code"]

    # Open websocket
    with client.websocket_connect(f"/ws/{code}") as websocket:
        # Send a drop
        client.post(
            f"/sessions/{code}/drops/text",
            json={"content": "Ping"}
        )

        # Receive broadcast
        message = websocket.receive_text()

        assert message == "Ping"
