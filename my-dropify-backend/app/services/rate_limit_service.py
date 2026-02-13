from app.db.redis import redis_client
from fastapi import HTTPException

class RateLimiter:
    def __init__(self, limit: int, window: int):
        self.limit = limit
        self.window = window

    async def check(self, key: str):
        count = await redis_client.incr(key)

        if count == 1:
            await redis_client.expire(key, self.window)

        if count > self.limit:
            ttl = await redis_client.ttl(key)
            raise HTTPException(
                status_code=429,
                detail="Rate limit exceeded",
                headers={"Retry-After": str(ttl)}
            )
