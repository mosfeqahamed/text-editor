import json
from typing import Any

from .cloudinary_mgr import upload_document, fetch_document, list_cloud_documents


def save_document(filename: str, delta: dict[str, Any]) -> None:
    """Serialise delta and upload to Cloudinary."""
    content = json.dumps({"version": "2.0", "delta": delta}, ensure_ascii=False)
    upload_document(filename, content)


def load_document(filename: str) -> dict:
    """Fetch from Cloudinary and return parsed document dict."""
    try:
        content = fetch_document(filename)
    except Exception as e:
        raise FileNotFoundError(f"'{filename}' not found on Cloudinary: {e}")
    return json.loads(content)


def list_documents() -> list[str]:
    """List all document names stored on Cloudinary."""
    return list_cloud_documents()
