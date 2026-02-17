from fastapi import Request
from app.services.advanced_rate_limit_service import SlidingWindowRateLimiter


# Per session limiter (more strict)
session_limiter = SlidingWindowRateLimiter(
    limit=10,
    window_seconds=60,
)

# Per drop type limiter
text_drop_limiter = SlidingWindowRateLimiter(
    limit=20,
    window_seconds=60,
)

file_drop_limiter = SlidingWindowRateLimiter(
    limit=5,
    window_seconds=60,
)


async def limit_per_session(request: Request):
    session_code = request.path_params.get("code")
    if not session_code:
        return

    key = f"rate:session:{session_code}"
    await session_limiter.check(key)


async def limit_text_drops(request: Request):
    session_code = request.path_params.get("code")
    if not session_code:
        return

    key = f"rate:text:{session_code}"
    await text_drop_limiter.check(key)


async def limit_file_drops(request: Request):
    session_code = request.path_params.get("code")
    if not session_code:
        return

    key = f"rate:file:{session_code}"
    await file_drop_limiter.check(key)
