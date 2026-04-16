import os
import json
import tempfile
import urllib.request
import cloudinary
import cloudinary.uploader
import cloudinary.api
import cloudinary.utils
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(dotenv_path=Path(__file__).parents[2] / ".env")

_configured = False


def _configure() -> None:
    global _configured
    if _configured:
        return
    cloud  = os.getenv("CLOUDINARY_CLOUD_NAME", "").strip()
    key    = os.getenv("CLOUDINARY_API_KEY", "").strip()
    secret = os.getenv("CLOUDINARY_API_SECRET", "").strip()
    if not (cloud and key and secret):
        raise RuntimeError("Cloudinary credentials missing — fill in .env")
    cloudinary.config(cloud_name=cloud, api_key=key, api_secret=secret, secure=True)
    _configured = True


# ── Media uploads ──────────────────────────────────────────────────────────

def upload_audio(file_path: str) -> dict:
    _configure()
    return cloudinary.uploader.upload(
        file_path, resource_type="video", folder="text-editor/audio"
    )


def upload_video(file_path: str) -> dict:
    _configure()
    return cloudinary.uploader.upload(
        file_path, resource_type="video", folder="text-editor/video"
    )


def upload_image(file_path: str) -> dict:
    _configure()
    return cloudinary.uploader.upload(
        file_path, resource_type="image", folder="text-editor/images"
    )


# ── Document storage on Cloudinary ────────────────────────────────────────

_DOC_FOLDER = "text-editor/documents"


def upload_document(filename: str, content: str) -> dict:
    """Save a .txe document as a raw file on Cloudinary."""
    _configure()
    with tempfile.NamedTemporaryFile(
        mode="w", suffix=".txe", delete=False, encoding="utf-8"
    ) as tmp:
        tmp.write(content)
        tmp_path = tmp.name
    try:
        return cloudinary.uploader.upload(
            tmp_path,
            resource_type="raw",
            folder=_DOC_FOLDER,
            public_id=filename,
            overwrite=True,
            use_filename=False,
        )
    finally:
        os.unlink(tmp_path)


def fetch_document(filename: str) -> str:
    """Download a .txe document from Cloudinary and return its JSON string."""
    _configure()
    public_id = f"{_DOC_FOLDER}/{filename}"
    url, _ = cloudinary.utils.cloudinary_url(public_id, resource_type="raw")
    with urllib.request.urlopen(url, timeout=30) as resp:
        return resp.read().decode("utf-8")


def list_cloud_documents() -> list[str]:
    """Return sorted list of document names stored on Cloudinary."""
    _configure()
    result = cloudinary.api.resources(
        resource_type="raw",
        type="upload",
        prefix=f"{_DOC_FOLDER}/",
        max_results=100,
    )
    names = []
    for r in result.get("resources", []):
        name = r["public_id"].split("/")[-1]
        if name:
            names.append(name)
    return sorted(names)
