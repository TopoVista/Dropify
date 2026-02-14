from fastapi import HTTPException
from redis.exceptions import ConnectionError
from app.db.redis import redis_client
import os
import time

class RateLimiter:
    def __init__(self, limit: int = 5, window: int = 60):
        self.limit = limit
        self.window = window
        self.memory_store = {}

    async def check(self, key: str):
        # 🔥 If running tests, use in-memory limiter
        if os.getenv("TESTING") == "true":
            now = time.time()
            window_start = now - self.window

            if key not in self.memory_store:
                self.memory_store[key] = []

            # remove expired timestamps
            self.memory_store[key] = [
                t for t in self.memory_store[key] if t > window_start
            ]

            if len(self.memory_store[key]) >= self.limit:
                raise HTTPException(
                    status_code=429,
                    detail="Too many requests",
                )

            self.memory_store[key].append(now)
            return

        # 🔥 Production Redis limiter
        try:
            count = await redis_client.incr(key)

            if count == 1:
                await redis_client.expire(key, self.window)

            if count > self.limit:
                raise HTTPException(
                    status_code=429,
                    detail="Too many requests",
                )

        except ConnectionError:
            return
