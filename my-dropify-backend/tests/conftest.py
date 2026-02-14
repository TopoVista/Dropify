import os
os.environ["TESTING"] = "true"

import pytest
from app.main import app
from fastapi.testclient import TestClient
from app.core.dependencies import limiter

@pytest.fixture(autouse=True)
def reset_rate_limiter():
    limiter.memory_store = {}

@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c
