import redis
from app.core.config import REDIS_URL

redis_client = redis.Redis.from_url(
    REDIS_URL,
    decode_responses=True
)


def ping():
    return redis_client.ping()
