/**
 * app.js — Initialises Quill, wires up toolbar buttons and
 *          all file / media operations.
 */

// ── Quill font & size whitelists ───────────────────────────────────────────

const Font = Quill.import('formats/font');
Font.whitelist = [
  'georgia', 'arial', 'times-new-roman',
  'courier-new', 'verdana', 'trebuchet-ms',
];
Quill.register(Font, true);

const Size = Quill.import('formats/size');
Size.whitelist = [
  '10px','12px','14px','16px','18px',
  '20px','24px','28px','32px','36px','48px',
];
Quill.register(Size, true);

// ── Quill initialisation ───────────────────────────────────────────────────

const quill = new Quill('#editor', {
  theme: 'snow',
  placeholder: 'Start writing…',
  modules: {
    toolbar: '#toolbar',
    history: { delay: 500, maxStack: 200, userOnly: true },
  },
});

// ── DOM refs ───────────────────────────────────────────────────────────────

const docNameEl    = document.getElementById('doc-name');
const statusBar    = document.getElementById('status-bar');
const toast        = document.getElementById('toast');

const btnNew       = document.getElementById('btn-new');
const btnOpen      = document.getElementById('btn-open');
const btnSave      = document.getElementById('btn-save');

const btnClearHl   = document.getElementById('btn-clear-hl');

const btnAudio     = document.getElementById('btn-audio');
const btnVideo     = document.getElementById('btn-video');
const btnYoutube   = document.getElementById('btn-youtube');
const btnImage     = document.getElementById('btn-image');

const audioInput   = document.getElementById('audio-input');
const videoInput   = document.getElementById('video-input');
const imageInput   = document.getElementById('image-input');

// Modals
const ytModal      = document.getElementById('yt-modal');
const ytUrlInput   = document.getElementById('yt-url-input');
const ytConfirm    = document.getElementById('yt-confirm');
const ytCancel     = document.getElementById('yt-cancel');

const saveasModal  = document.getElementById('saveas-modal');
const saveasInput  = document.getElementById('saveas-input');
const saveasConfirm= document.getElementById('saveas-confirm');
const saveasCancel = document.getElementById('saveas-cancel');

const openModal    = document.getElementById('open-modal');
const docList      = document.getElementById('doc-list');
const openCancel   = document.getElementById('open-cancel');

// ── State ──────────────────────────────────────────────────────────────────

let currentFilename = null;   // null = unsaved

// ── Toast helper ───────────────────────────────────────────────────────────

let _toastTimer = null;
function showToast(msg, type = 'info') {
  toast.textContent  = msg;
  toast.className    = type;         // 'success' | 'error' | ''
  toast.hidden       = false;
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => { toast.hidden = true; }, 3000);
}

function setStatus(msg) { statusBar.textContent = msg; }

// ── Clear highlight ────────────────────────────────────────────────────────

btnClearHl.addEventListener('click', () => {
  quill.format('background', false);
});

// ── New document ───────────────────────────────────────────────────────────

btnNew.addEventListener('click', () => {
  if (!confirm('Discard current document and start fresh?')) return;
  quill.setContents([]);
  currentFilename = null;
  docNameEl.textContent = 'Untitled';
  setStatus('New document.');
});

// ── Save ───────────────────────────────────────────────────────────────────

btnSave.addEventListener('click', () => {
  if (currentFilename) {
    doSave(currentFilename);
  } else {
    saveasInput.value = '';
    saveasModal.hidden = false;
    saveasInput.focus();
  }
});

saveasConfirm.addEventListener('click', () => {
  const name = saveasInput.value.trim();
  if (!name) { saveasInput.focus(); return; }
  saveasModal.hidden = true;
  currentFilename = name;
  doSave(name);
});

saveasCancel.addEventListener('click', () => { saveasModal.hidden = true; });

saveasModal.addEventListener('keydown', e => {
  if (e.key === 'Enter')  saveasConfirm.click();
  if (e.key === 'Escape') saveasModal.hidden = true;
});

async function doSave(filename) {
  setStatus('Saving…');
  try {
    const delta = quill.getContents();
    await saveDocument(filename, delta);
    docNameEl.textContent = filename;
    showToast(`Saved "${filename}"`, 'success');
    setStatus(`Saved: ${filename}.txe`);
  } catch (err) {
    showToast(`Save failed: ${err.message}`, 'error');
    setStatus('Save failed.');
  }
}

// ── Open ───────────────────────────────────────────────────────────────────

btnOpen.addEventListener('click', async () => {
  docList.innerHTML = '<li style="color:var(--text-muted);padding:8px">Loading…</li>';
  openModal.hidden = false;
  try {
    const { documents } = await listDocuments();
    if (documents.length === 0) {
      docList.innerHTML = '<li class="empty">No saved documents yet.</li>';
    } else {
      docList.innerHTML = documents
        .map(d => `<li data-name="${d}">${d}</li>`)
        .join('');
      docList.querySelectorAll('li[data-name]').forEach(li => {
        li.addEventListener('click', () => {
          openModal.hidden = true;
          doOpen(li.dataset.name);
        });
      });
    }
  } catch (err) {
    docList.innerHTML = `<li class="empty">Error: ${err.message}</li>`;
  }
});

openCancel.addEventListener('click', () => { openModal.hidden = true; });

async function doOpen(filename) {
  setStatus(`Opening "${filename}"…`);
  try {
    const doc = await loadDocument(filename);
    quill.setContents(doc.delta);
    currentFilename = filename;
    docNameEl.textContent = filename;
    showToast(`Opened "${filename}"`, 'success');
    setStatus(`Opened: ${filename}.txe`);
  } catch (err) {
    showToast(`Open failed: ${err.message}`, 'error');
    setStatus('Open failed.');
  }
}

// ── Audio upload ───────────────────────────────────────────────────────────

btnAudio.addEventListener('click', () => audioInput.click());

audioInput.addEventListener('change', async () => {
  const file = audioInput.files[0];
  if (!file) return;
  audioInput.value = '';
  setStatus(`Uploading audio: ${file.name}…`);
  btnAudio.disabled = true;
  try {
    const { url, filename } = await uploadAudio(file);
    const range = quill.getSelection(true);
    quill.insertEmbed(range.index, 'audio-embed', { url, filename }, Quill.sources.USER);
    quill.setSelection(range.index + 1, Quill.sources.SILENT);
    showToast(`Audio embedded: ${filename}`, 'success');
    setStatus(`Audio uploaded: ${filename}`);
  } catch (err) {
    showToast(`Audio upload failed: ${err.message}`, 'error');
    setStatus('Audio upload failed.');
  } finally {
    btnAudio.disabled = false;
  }
});

// ── Video upload ───────────────────────────────────────────────────────────

btnVideo.addEventListener('click', () => videoInput.click());

videoInput.addEventListener('change', async () => {
  const file = videoInput.files[0];
  if (!file) return;
  videoInput.value = '';
  setStatus(`Uploading video: ${file.name}…`);
  btnVideo.disabled = true;
  try {
    const { url, filename } = await uploadVideo(file);
    const range = quill.getSelection(true);
    quill.insertEmbed(range.index, 'video-embed', { url, filename }, Quill.sources.USER);
    quill.setSelection(range.index + 1, Quill.sources.SILENT);
    showToast(`Video embedded: ${filename}`, 'success');
    setStatus(`Video uploaded: ${filename}`);
  } catch (err) {
    showToast(`Video upload failed: ${err.message}`, 'error');
    setStatus('Video upload failed.');
  } finally {
    btnVideo.disabled = false;
  }
});

// ── YouTube embed ──────────────────────────────────────────────────────────

btnYoutube.addEventListener('click', () => {
  ytUrlInput.value = '';
  ytModal.hidden = false;
  ytUrlInput.focus();
});

ytConfirm.addEventListener('click', () => {
  const url = ytUrlInput.value.trim();
  if (!url) { ytUrlInput.focus(); return; }
  ytModal.hidden = true;
  const range = quill.getSelection(true);
  quill.insertEmbed(range.index, 'youtube-embed', { url }, Quill.sources.USER);
  quill.setSelection(range.index + 1, Quill.sources.SILENT);
  setStatus('YouTube video embedded.');
});

ytCancel.addEventListener('click', () => { ytModal.hidden = true; });

ytModal.addEventListener('keydown', e => {
  if (e.key === 'Enter')  ytConfirm.click();
  if (e.key === 'Escape') ytModal.hidden = true;
});

// ── Image upload ───────────────────────────────────────────────────────────

btnImage.addEventListener('click', () => imageInput.click());

imageInput.addEventListener('change', async () => {
  const file = imageInput.files[0];
  if (!file) return;
  imageInput.value = '';
  setStatus(`Uploading image: ${file.name}…`);
  btnImage.disabled = true;
  try {
    const { url, filename } = await uploadImage(file);
    const range = quill.getSelection(true);
    quill.insertEmbed(range.index, 'image-embed', { url, filename }, Quill.sources.USER);
    quill.setSelection(range.index + 1, Quill.sources.SILENT);
    showToast(`Image embedded: ${filename}`, 'success');
    setStatus(`Image uploaded: ${filename}`);
  } catch (err) {
    showToast(`Image upload failed: ${err.message}`, 'error');
    setStatus('Image upload failed.');
  } finally {
    btnImage.disabled = false;
  }
});

// ── Close modals on overlay click ──────────────────────────────────────────

[ytModal, saveasModal, openModal].forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.hidden = true;
  });
});

// ── Keyboard shortcuts ─────────────────────────────────────────────────────

document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    btnSave.click();
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
    e.preventDefault();
    btnOpen.click();
  }
});
