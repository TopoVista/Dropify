import time
from fastapi import HTTPException
from redis.asyncio import Redis
from app.db.redis import redis_client


class SlidingWindowRateLimiter:

    def __init__(self, limit: int, window_seconds: int):
        self.limit = limit
        self.window = window_seconds
        self.redis: Redis = redis_client

    async def check(self, key: str):
        now = time.time()
        window_start = now - self.window

        # Remove expired timestamps
        await self.redis.zremrangebyscore(key, 0, window_start)

        # Count current requests in window
        count = await self.redis.zcard(key)

        if count >= self.limit:
            raise HTTPException(
                status_code=429,
                detail="Rate limit exceeded"
            )

        # Add current timestamp
        await self.redis.zadd(key, {str(now): now})

        # Ensure key expires automatically
        await self.redis.expire(key, self.window)
