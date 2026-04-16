# Rich Text Editor

A web-based rich text editor with inline multimedia support. Built with **FastAPI** (backend) and **vanilla HTML/CSS/JS + Quill.js** (frontend). All media and documents are stored on **Cloudinary**.

---

## Features

| Feature | Details |
|---|---|
| **Text formatting** | Bold, italic, underline |
| **Font control** | Family (Georgia, Arial, Times New Roman, etc.) and size (10–48px) |
| **Highlight** | 5 colour swatches + clear |
| **Audio** | Upload MP3/WAV/OGG → stored on Cloudinary → inline chip with popover player |
| **Video** | Upload MP4/MOV/MKV → stored on Cloudinary → inline chip with popover player |
| **YouTube** | Paste URL → thumbnail fetched → inline chip, click opens browser |
| **Image** | Upload PNG/JPG/GIF → stored on Cloudinary → inline chip with popover preview |
| **Save / Open** | Documents saved as `.txe` (JSON) directly on Cloudinary |

---

## Project Structure

```
text-editor/
├── backend/
│   ├── main.py                  # FastAPI routes
│   ├── __init__.py
│   └── editor/
│       ├── cloudinary_mgr.py    # All Cloudinary operations (media + documents)
│       └── file_manager.py      # Save / load / list documents via Cloudinary
│
├── frontend/
│   ├── index.html               # Main UI
│   ├── css/
│   │   └── style.css            # Dark purple theme
│   └── js/
│       ├── blots.js             # Quill inline chip blots (Audio/Video/YouTube/Image)
│       ├── api.js               # Fetch calls to FastAPI backend
│       └── app.js               # Quill init, toolbar wiring, save/open logic
│
├── .env                         # Cloudinary credentials (never commit)
├── .env.example                 # Credential template
├── pyproject.toml               # Python dependencies (uv)
└── .python-version              # Python 3.12
```

---

## Setup

### 1. Prerequisites

```bash
# Python 3.12 via uv
sudo apt install python3-tk   # only needed if running legacy tkinter version
```

### 2. Cloudinary credentials

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Get these from [cloudinary.com/console](https://cloudinary.com/console).

### 3. Install dependencies

```bash
uv sync
```

---

## Running

Open **two terminals** from the project root:

**Terminal 1 — Backend**
```bash
uvicorn backend.main:app --reload --port 8000
```

**Terminal 2 — Frontend**
```bash
cd frontend && python3 -m http.server 3000
```

Then open **http://localhost:3000** in your browser.

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/upload/audio` | Upload audio file → Cloudinary |
| `POST` | `/api/upload/video` | Upload video file → Cloudinary |
| `POST` | `/api/upload/image` | Upload image file → Cloudinary |
| `POST` | `/api/document/save` | Save document (Quill Delta) → Cloudinary |
| `GET` | `/api/document/{filename}` | Load document from Cloudinary |
| `GET` | `/api/documents` | List all saved documents |

Interactive API docs available at **http://localhost:8000/docs**.

---

## Document Format (`.txe`)

Documents are stored as JSON on Cloudinary under `text-editor/documents/`:

```json
{
  "version": "2.0",
  "delta": {
    "ops": [
      { "insert": "Hello world\n" },
      { "insert": { "audio-embed": { "url": "https://res.cloudinary.com/...", "filename": "song.mp3" } } },
      { "insert": { "youtube-embed": { "url": "https://www.youtube.com/watch?v=..." } } }
    ]
  }
}
```

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl + S` | Save |
| `Ctrl + O` | Open |
| `Ctrl + Z` | Undo |
| `Ctrl + Y` | Redo |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.12, FastAPI, Uvicorn |
| Frontend | HTML5, CSS3, Vanilla JS |
| Rich text | [Quill.js 1.3.7](https://quilljs.com) |
| Media storage | [Cloudinary](https://cloudinary.com) |
| Package manager | [uv](https://github.com/astral-sh/uv) |
