import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.dependencies import rate_limit_dependency

@pytest.fixture(autouse=True)
def enable_rate_limit():
    app.dependency_overrides.clear()
    yield
    app.dependency_overrides.clear()

def test_rate_limit_exceeded():
    with TestClient(app) as client:
        for _ in range(6):
            response = client.post("/sessions")
        assert response.status_code == 429
