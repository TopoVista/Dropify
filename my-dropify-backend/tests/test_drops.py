from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_create_text_drop():
    session_res = client.post("/sessions")
    code = session_res.json()["code"]

    drop_res = client.post(f"/sessions/{code}/drops/text", json={"content": "Hello"})
    assert drop_res.status_code == 200
    assert drop_res.json()["content"] == "Hello"
