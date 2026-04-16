# Vercel entrypoint — re-exports the FastAPI app from backend/
from backend.main import app  # noqa: F401
