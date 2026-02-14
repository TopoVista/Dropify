from fastapi import Request
from app.services.rate_limit_service import RateLimiter

limiter = RateLimiter(limit=5, window=60)

async def rate_limit_dependency(request: Request):
    ip = request.client.host if request.client else "testclient"

    if ip in ("127.0.0.1", None):
        ip = "testclient"

    key = f"rate_limit:{ip}:{request.url.path}"
    await limiter.check(key)
