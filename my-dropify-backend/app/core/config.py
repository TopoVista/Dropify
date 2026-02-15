import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://dropify_db_user:xsK9zv9fUs8U5QlTolmKyXJ7c7YyV5Jb@dpg-d68pg60boq4c73d65qlg-a/dropify_db")
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://dropify-frontend-2ngdo9rx9-topovistas-projects.vercel.app")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
SESSION_TTL_SECONDS = int(os.getenv("SESSION_TTL_SECONDS", 3600))

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL not set")
