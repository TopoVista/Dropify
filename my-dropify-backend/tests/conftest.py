import pytest
from app.main import app
from app.core.dependencies import rate_limit_dependency

@pytest.fixture(autouse=True)
def disable_rate_limit():
    app.dependency_overrides[rate_limit_dependency] = lambda: None
    yield
    app.dependency_overrides.clear()
