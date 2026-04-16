/**
 * blots.js — Inline chip blots for Audio, Video, YouTube, Image.
 *
 * Each blot renders as a small clickable inline badge inside the text flow.
 * Clicking expands a popover with the actual media player/viewer.
 */

const Embed = Quill.import('blots/embed');   // inline-level embed

// ── Shared helpers ─────────────────────────────────────────────────────────

function shortName(name, max = 22) {
  return name.length > max ? name.slice(0, max - 1) + '…' : name;
}

function ytVideoId(url) {
  const m = url.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

/** Remove any open popover that isn't inside `except` */
function closeOtherPopovers(except) {
  document.querySelectorAll('.media-popover').forEach(p => {
    if (p !== except) p.remove();
  });
}

/**
 * Build and attach a floating popover anchored below `chipEl`.
 * `contentHtml` goes inside the popover body.
 */
function attachPopover(chipEl, contentHtml) {
  closeOtherPopovers(null);

  const existing = chipEl.querySelector('.media-popover');
  if (existing) { existing.remove(); return; }   // toggle off

  const pop = document.createElement('div');
  pop.className = 'media-popover';
  pop.innerHTML = contentHtml;
  chipEl.appendChild(pop);

  // Close when clicking outside
  setTimeout(() => {
    document.addEventListener('click', function handler(e) {
      if (!chipEl.contains(e.target)) {
        pop.remove();
        document.removeEventListener('click', handler);
      }
    });
  }, 0);
}

// ── AudioChip ──────────────────────────────────────────────────────────────

class AudioChip extends Embed {
  static create(value) {
    const node = super.create();
    node.dataset.url      = value.url;
    node.dataset.filename = value.filename;
    node.contentEditable  = 'false';
    node.classList.add('media-chip', 'audio-chip');
    node.title = value.filename;

    node.innerHTML = `
      <span class="chip-icon">♪</span>
      <span class="chip-label">${shortName(value.filename)}</span>
    `;

    node.addEventListener('click', (e) => {
      e.stopPropagation();
      attachPopover(node, `
        <div class="pop-title">♪ ${shortName(value.filename, 32)}</div>
        <audio controls autoplay style="width:100%;margin-top:8px">
          <source src="${value.url}" />
        </audio>
      `);
    });

    return node;
  }

  static value(node) {
    return { url: node.dataset.url, filename: node.dataset.filename };
  }
}
AudioChip.blotName  = 'audio-embed';
AudioChip.tagName   = 'span';
AudioChip.className = 'audio-chip';
Quill.register(AudioChip);


// ── VideoChip ──────────────────────────────────────────────────────────────

class VideoChip extends Embed {
  static create(value) {
    const node = super.create();
    node.dataset.url      = value.url;
    node.dataset.filename = value.filename;
    node.contentEditable  = 'false';
    node.classList.add('media-chip', 'video-chip');
    node.title = value.filename;

    node.innerHTML = `
      <span class="chip-icon">&#127916;</span>
      <span class="chip-label">${shortName(value.filename)}</span>
    `;

    node.addEventListener('click', (e) => {
      e.stopPropagation();
      attachPopover(node, `
        <div class="pop-title">&#127916; ${shortName(value.filename, 32)}</div>
        <video controls autoplay style="width:100%;margin-top:8px;border-radius:6px;max-height:260px">
          <source src="${value.url}" />
        </video>
      `);
    });

    return node;
  }

  static value(node) {
    return { url: node.dataset.url, filename: node.dataset.filename };
  }
}
VideoChip.blotName  = 'video-embed';
VideoChip.tagName   = 'span';
VideoChip.className = 'video-chip';
Quill.register(VideoChip);


// ── YouTubeChip ────────────────────────────────────────────────────────────

class YouTubeChip extends Embed {
  static create(value) {
    const node = super.create();
    node.dataset.url     = value.url;
    node.contentEditable = 'false';
    node.classList.add('media-chip', 'yt-chip');
    node.title = value.url;

    const vid   = ytVideoId(value.url);
    const thumb = vid ? `https://img.youtube.com/vi/${vid}/mqdefault.jpg` : '';

    node.innerHTML = `
      <span class="chip-icon yt-icon">&#9654;</span>
      <span class="chip-label">YouTube</span>
    `;

    node.addEventListener('click', (e) => {
      e.stopPropagation();
      attachPopover(node, `
        <div class="pop-title">&#9654; YouTube</div>
        ${thumb ? `<img src="${thumb}" style="width:100%;border-radius:6px;margin-top:8px;display:block" />` : ''}
        <a href="${value.url}" target="_blank" class="pop-open-btn">Open in Browser</a>
      `);
    });

    return node;
  }

  static value(node) {
    return { url: node.dataset.url };
  }
}
YouTubeChip.blotName  = 'youtube-embed';
YouTubeChip.tagName   = 'span';
YouTubeChip.className = 'yt-chip';
Quill.register(YouTubeChip);


// ── ImageChip ──────────────────────────────────────────────────────────────

class ImageChip extends Embed {
  static create(value) {
    const node = super.create();
    node.dataset.url      = value.url;
    node.dataset.filename = value.filename;
    node.contentEditable  = 'false';
    node.classList.add('media-chip', 'image-chip');
    node.title = value.filename;

    node.innerHTML = `
      <img class="chip-thumb" src="${value.url}" alt="${shortName(value.filename)}" />
      <span class="chip-label">${shortName(value.filename)}</span>
    `;

    node.addEventListener('click', (e) => {
      e.stopPropagation();
      attachPopover(node, `
        <div class="pop-title">&#128247; ${shortName(value.filename, 32)}</div>
        <img src="${value.url}"
             style="width:100%;border-radius:6px;margin-top:8px;display:block;max-height:320px;object-fit:contain" />
      `);
    });

    return node;
  }

  static value(node) {
    return { url: node.dataset.url, filename: node.dataset.filename };
  }
}
ImageChip.blotName  = 'image-embed';
ImageChip.tagName   = 'span';
ImageChip.className = 'image-chip';
Quill.register(ImageChip);
