from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Any
import tempfile
import os

from .editor.cloudinary_mgr import upload_audio, upload_video, upload_image
from .editor.file_manager import save_document, load_document, list_documents

app = FastAPI(title="Rich Text Editor API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)




@app.post("/api/upload/audio")
async def api_upload_audio(file: UploadFile = File(...)):
    suffix = os.path.splitext(file.filename)[1] or ".mp3"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name
    try:
        result = upload_audio(tmp_path)
        return {"url": result["secure_url"], "filename": file.filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        os.unlink(tmp_path)


@app.post("/api/upload/video")
async def api_upload_video(file: UploadFile = File(...)):
    suffix = os.path.splitext(file.filename)[1] or ".mp4"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name
    try:
        result = upload_video(tmp_path)
        return {"url": result["secure_url"], "filename": file.filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        os.unlink(tmp_path)


@app.post("/api/upload/image")
async def api_upload_image(file: UploadFile = File(...)):
    suffix = os.path.splitext(file.filename)[1] or ".jpg"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name
    try:
        result = upload_image(tmp_path)
        return {"url": result["secure_url"], "filename": file.filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        os.unlink(tmp_path)




class SaveRequest(BaseModel):
    filename: str
    delta: dict[str, Any]


@app.post("/api/document/save")
async def api_save(req: SaveRequest):
    name = req.filename.strip()
    if not name:
        raise HTTPException(400, "Filename cannot be empty")
    save_document(name, req.delta)
    return {"saved": name}


@app.get("/api/document/{filename}")
async def api_load(filename: str):
    try:
        return load_document(filename)
    except FileNotFoundError as e:
        raise HTTPException(404, str(e))


@app.get("/api/documents")
async def api_list():
    return {"documents": list_documents()}
