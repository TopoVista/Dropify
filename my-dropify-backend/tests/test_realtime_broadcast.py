from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_realtime_text_broadcast():
    # Create session
    res = client.post("/sessions")
    code = res.json()["code"]

    # Open two websocket connections
    with client.websocket_connect(f"/ws/{code}") as ws1:
        with client.websocket_connect(f"/ws/{code}") as ws2:

            # Send text drop
            client.post(
                f"/sessions/{code}/drops/text",
                json={"content": "HelloWorld"}
            )

            # Both clients should receive broadcast
            msg1 = ws1.receive_text()
            msg2 = ws2.receive_text()

            assert msg1 == "HelloWorld"
            assert msg2 == "HelloWorld"
