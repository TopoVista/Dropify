from fastapi import Request
from app.services.rate_limit_service import RateLimiter

limiter = RateLimiter(limit=5, window=60)

async def rate_limit_dependency(request: Request):
    ip = request.client.host
    key = f"rate:{ip}:{request.url.path}"
    await limiter.check(key)
