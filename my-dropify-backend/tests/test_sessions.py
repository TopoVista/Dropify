from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_create_session():
    response = client.post("/sessions")
    assert response.status_code == 200

    data = response.json()
    assert "code" in data
    assert len(data["code"]) == 6
    assert data["code"].isdigit()


def test_get_session():
    create_response = client.post("/sessions")
    code = create_response.json()["code"]

    response = client.get(f"/sessions/{code}")
    assert response.status_code == 200
    assert response.json()["code"] == code


def test_session_expiry():
    create_response = client.post("/sessions")
    code = create_response.json()["code"]

    # manually expire redis key
    from app.db.redis import redis_client
    redis_client.delete(f"session:{code}")

    response = client.get(f"/sessions/{code}")
    assert response.status_code == 404

def test_join_valid_session():
    create_response = client.post("/sessions")
    code = create_response.json()["code"]

    response = client.post("/sessions/join", json={"code": code})
    assert response.status_code == 200
    assert response.json()["code"] == code


def test_join_invalid_session():
    response = client.post("/sessions/join", json={"code": "000000"})
    assert response.status_code == 404
