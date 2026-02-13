from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_qrcode_generation():
    response = client.post("/sessions")
    code = response.json()["code"]

    qr_response = client.get(f"/sessions/{code}/qrcode")

    assert qr_response.status_code == 200
    assert qr_response.headers["content-type"] == "image/png"
