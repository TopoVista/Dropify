from io import BytesIO
import qrcode
from fastapi.responses import StreamingResponse
from app.core.config import FRONTEND_URL


def generate_session_qrcode(code: str) -> StreamingResponse:
    session_url = f"{FRONTEND_URL}/session/{code}"

    qr = qrcode.make(session_url)

    buffer = BytesIO()
    qr.save(buffer, format="PNG")
    buffer.seek(0)

    return StreamingResponse(buffer, media_type="image/png")
