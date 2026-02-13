import os
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_file_upload_creates_drop(tmp_path):
    response = client.post("/sessions")
    code = response.json()["code"]

    file_content = b"hello file"
    files = {"file": ("test.txt", file_content, "text/plain")}

    upload_response = client.post(
        f"/sessions/{code}/drops/file",
        files=files
    )

    assert upload_response.status_code == 200

    data = upload_response.json()
    assert "file_path" in data

    # Verify file actually exists
    assert os.path.exists(data["file_path"])
