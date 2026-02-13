from app.db.redis import ping


def test_redis_ping():
    assert ping() is True
