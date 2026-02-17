from datetime import datetime, timedelta, UTC


def predict_expiry(
    content: str | None = None,
    file_type: str | None = None,
) -> datetime:
    """
    Simple heuristic-based expiry prediction.

    Rules:
    - Very short text (<20 chars): 2 hours
    - Medium text (20–200 chars): 1 hour
    - Long text (>200 chars): 10 minutes
    - Files: 30 minutes
    - Default fallback: 1 hour
    """

    now = datetime.now(UTC)

    # File logic
    if file_type:
        return now + timedelta(minutes=30)

    # Text logic
    if content:
        length = len(content.strip())

        if length < 20:
            return now + timedelta(hours=2)

        if length <= 200:
            return now + timedelta(hours=1)

        return now + timedelta(minutes=10)

    # Fallback
    return now + timedelta(hours=1)
