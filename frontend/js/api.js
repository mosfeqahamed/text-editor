/**
 * api.js — All fetch calls to the FastAPI backend.
 */

const API = 'http://localhost:8000';

async function _handleResponse(res) {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Request failed');
  }
  return res.json();
}

/** Upload an audio File object. Returns { url, filename } */
async function uploadAudio(file) {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${API}/api/upload/audio`, { method: 'POST', body: form });
  return _handleResponse(res);
}

/** Upload an image File object. Returns { url, filename } */
async function uploadImage(file) {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${API}/api/upload/image`, { method: 'POST', body: form });
  return _handleResponse(res);
}

/** Upload a video File object. Returns { url, filename } */
async function uploadVideo(file) {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${API}/api/upload/video`, { method: 'POST', body: form });
  return _handleResponse(res);
}

/** Save the Quill Delta under a filename. Returns { saved } */
async function saveDocument(filename, delta) {
  const res = await fetch(`${API}/api/document/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename, delta }),
  });
  return _handleResponse(res);
}

/** Load a document by name. Returns { version, delta } */
async function loadDocument(filename) {
  const res = await fetch(`${API}/api/document/${encodeURIComponent(filename)}`);
  return _handleResponse(res);
}

/** List all saved document names. Returns { documents: string[] } */
async function listDocuments() {
  const res = await fetch(`${API}/api/documents`);
  return _handleResponse(res);
}
