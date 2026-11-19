// Vice Coast Cover Studio — editor.
// Loads photos from the machine (or the kit samples), previews the cover live
// on canvas, and exports PNGs in the three post sizes. Offline, no uploads.

import { GRADES, LAYOUTS, SIZES, drawCover, gradeById, layoutGeometry, renderCoverCanvas, sizeById } from './cover.js';
import { runShotScene } from './shots.js';

const $ = (id) => document.getElementById(id);
const SAMPLES = ['samples/boulevard.jpg', 'samples/pier.jpg', 'samples/boulevard.jpg', 'samples/pier.jpg'];

const DEFAULT_STATE = {
  layout: 'hero-trio',
  grade: 'sunset',
  size: '1920x1080',
  title: 'VICE COAST',
  subtitle: 'Neon nights, palm dreams',
  tagline: 'A COVER MADE ON THE COAST',
  heat: 4,
  photos: [
    { key: 'boulevard', zoom: 1, cx: 0.5, cy: 0.5 },
    { key: 'pier', zoom: 1, cx: 0.5, cy: 0.38 },
    { key: 'boulevard', zoom: 1, cx: 0.42, cy: 0.5 },
    { key: 'pier', zoom: 1, cx: 0.55, cy: 0.6 },
  ],
};

let state = structuredClone(DEFAULT_STATE);
let images = [null, null, null, null];
let selectedSlot = 0;
let undoStack = [];
let redoStack = [];
let dragging = null;

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('could not load ' + src));
    img.src = src;
  });
}

async function loadSample(slot, key) {
  try {
    images[slot] = await loadImage(key === 'pier' ? SAMPLES[1] : SAMPLES[0]);
  } catch {
    images[slot] = null;
  }
}

async function loadAllSamples() {
  await Promise.all(state.photos.map((p, i) => loadSample(i, p.key)));
}

function snapshot() {
  return JSON.stringify({
    layout: state.layout, grade: state.grade, size: state.size,
    title: state.title, subtitle: state.subtitle, tagline: state.tagline,
    heat: state.heat, photos: state.photos,
  });
}

function restore(json) {
  const s = JSON.parse(json);
  const oldKeys = state.photos.map((p) => p.key);
  state = { ...s, photos: s.photos };
  state.photos.forEach((p, i) => {
    if (p.key !== oldKeys[i]) loadSample(i, p.key).then(drawPreview);
  });
  syncControls();
  drawPreview();
}

function pushHistory() {
  undoStack.push(snapshot());
  if (undoStack.length > 25) undoStack.shift();
  redoStack = [];
  updateUndoButtons();
}

function undo() {
  if (!undoStack.length) return;
  redoStack.push(snapshot());
  restore(undoStack.pop());
  updateUndoButtons();
}

function redo() {
  if (!redoStack.length) return;
  undoStack.push(snapshot());
  restore(redoStack.pop());
  updateUndoButtons();
}

function updateUndoButtons() {
  $('undoBtn').disabled = !undoStack.length;
  $('redoBtn').disabled = !redoStack.length;
}

// --- Preview ---

function previewSize() {
  const size = sizeById(state.size);
  const maxW = 680;
  const maxH = 620;
  const scale = Math.min(maxW / size.w, maxH / size.h);
  return { w: Math.round(size.w * scale), h: Math.round(size.h * scale) };
}

function drawPreview() {
  const canvas = $('preview');
  const { w, h } = previewSize();
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  drawCover(canvas.getContext('2d'), w, h, state, images, state.photos);
  highlightSelectedPanel();
}

function highlightSelectedPanel() {
  const canvas = $('preview');
  const ctx = canvas.getContext('2d');
  const geo = layoutGeometry(state.layout, canvas.width, canvas.height);
  const panel = geo.panels.find((p) => p.slot === selectedSlot);
  if (!panel) return;
  ctx.save();
  ctx.strokeStyle = '#0affef';
  ctx.lineWidth = 3;
  ctx.setLineDash([10, 6]);
  ctx.strokeRect(panel.x + 2, panel.y + 2, panel.w - 4, panel.h - 4);
  ctx.restore();
}

function panelAt(clientX, clientY) {
  const canvas = $('preview');
  const rect = canvas.getBoundingClientRect();
  const x = ((clientX - rect.left) / rect.width) * canvas.width;
  const y = ((clientY - rect.top) / rect.height) * canvas.height;
  const geo = layoutGeometry(state.layout, canvas.width, canvas.height);
  for (let i = geo.panels.length - 1; i >= 0; i--) {
    const p = geo.panels[i];
    if (x >= p.x && x <= p.x + p.w && y >= p.y && y <= p.y + p.h) return p;
  }
  return null;
}

// --- Export ---

function exportCanvas(sizeId) {
  const size = sizeById(sizeId);
  return { canvas: renderCoverCanvas(size.w, size.h, state, images, state.photos), size };
}

function downloadCanvas(canvas, filename) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      resolve({ bytes: blob.size, filename });
    }, 'image/png');
  });
}

async function exportOne(sizeId) {
  const { canvas, size } = exportCanvas(sizeId);
  const name = `vice-coast-cover-${size.w}x${size.h}.png`;
  const info = await downloadCanvas(canvas, name);
  setStatus(`Exported ${name} — ${size.w} × ${size.h} PNG (${Math.round(info.bytes / 1024)} KiB)`);
  return info;
}

async function exportAll() {
  setStatus('Exporting all three sizes…');
  for (const s of SIZES) await exportOne(s.id);
}

function setStatus(text) {
  $('status').textContent = text;
}

// --- Controls ---

function buildPickers() {
  const layoutBox = $('layoutPicker');
  for (const l of LAYOUTS) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'pick';
    b.dataset.layout = l.id;
    b.textContent = l.name;
    b.addEventListener('click', () => {
      if (state.layout === l.id) return;
      pushHistory();
      state.layout = l.id;
      syncControls();
      drawPreview();
    });
    layoutBox.appendChild(b);
  }
  const gradeBox = $('gradePicker');
  for (const g of GRADES) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'pick grade-pick';
    b.dataset.grade = g.id;
    b.innerHTML = `<span class="swatch" style="background:linear-gradient(135deg, ${g.sky[0]}, ${g.sky[1]} 55%, ${g.sky[2]})"></span>${g.name}`;
    b.addEventListener('click', () => {
      if (state.grade === g.id) return;
      pushHistory();
      state.grade = g.id;
      syncControls();
      drawPreview();
    });
    gradeBox.appendChild(b);
  }
  const sizeBox = $('sizePicker');
  for (const s of SIZES) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'pick';
    b.dataset.size = s.id;
    b.textContent = s.label;
    b.addEventListener('click', () => {
      if (state.size === s.id) return;
      pushHistory();
      state.size = s.id;
      syncControls();
      drawPreview();
    });
    sizeBox.appendChild(b);
  }
}

function buildSlots() {
  const box = $('slotList');
  for (let i = 0; i < 4; i++) {
    const row = document.createElement('div');
    row.className = 'slot';
    row.dataset.slot = i;
    row.innerHTML = `
      <button type="button" class="slot-name">Photo ${i + 1}</button>
      <label class="slot-btn">Upload <input type="file" accept="image/*" hidden></label>
      <button type="button" class="slot-btn sample-btn">Sample</button>
      <span class="slot-zoom">100%</span>`;
    const nameBtn = row.querySelector('.slot-name');
    nameBtn.addEventListener('click', () => {
      selectedSlot = i;
      syncControls();
      drawPreview();
    });
    const fileInput = row.querySelector('input[type=file]');
    fileInput.addEventListener('change', () => {
      const file = fileInput.files && fileInput.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        pushHistory();
        loadImage(reader.result).then((img) => {
          images[i] = img;
          state.photos[i] = { key: 'upload:' + file.name, zoom: 1, cx: 0.5, cy: 0.5 };
          selectedSlot = i;
          syncControls();
          drawPreview();
          setStatus(`Photo ${i + 1} loaded from ${file.name}`);
        });
      };
      reader.readAsDataURL(file);
    });
    row.querySelector('.sample-btn').addEventListener('click', async () => {
      pushHistory();
      const key = i % 2 === 0 ? 'boulevard' : 'pier';
      state.photos[i] = { key, zoom: 1, cx: 0.5, cy: 0.5 };
      await loadSample(i, key);
      selectedSlot = i;
      syncControls();
      drawPreview();
    });
    box.appendChild(row);
  }
}

function syncControls() {
  document.querySelectorAll('#layoutPicker .pick').forEach((b) => {
    b.classList.toggle('active', b.dataset.layout === state.layout);
  });
  document.querySelectorAll('#gradePicker .pick').forEach((b) => {
    b.classList.toggle('active', b.dataset.grade === state.grade);
  });
  document.querySelectorAll('#sizePicker .pick').forEach((b) => {
    b.classList.toggle('active', b.dataset.size === state.size);
  });
  $('titleInput').value = state.title;
  $('subtitleInput').value = state.subtitle;
  $('taglineInput').value = state.tagline;
  $('heatInput').value = state.heat;
  $('heatValue').textContent = '★'.repeat(state.heat) + '☆'.repeat(5 - state.heat);
  document.querySelectorAll('.slot').forEach((row, i) => {
    row.classList.toggle('selected', i === selectedSlot);
    const photo = state.photos[i];
    row.querySelector('.slot-zoom').textContent = `${Math.round(photo.zoom * 100)}%`;
    row.querySelector('.slot-name').textContent = `Photo ${i + 1} · ${photo.key.startsWith('upload:') ? photo.key.slice(7) : photo.key}`;
  });
  $('gradeName').textContent = gradeById(state.grade).name;
  $('layoutName').textContent = (LAYOUTS.find((l) => l.id === state.layout) || {}).name || '';
}

function bindControls() {
  // Caption fields: snapshot the pre-edit state on 'beforeinput', which fires
  // before the value changes for typing, paste and delete alike (a snapshot
  // taken on 'change' would hold the already-edited text and undo nothing).
  // One snapshot per edit session; 'change'/'blur' re-arms for the next one.
  for (const id of ['titleInput', 'subtitleInput', 'taglineInput']) {
    const el = $(id);
    let editing = false;
    el.addEventListener('beforeinput', () => {
      if (!editing) { editing = true; pushHistory(); }
    });
    el.addEventListener('change', () => { editing = false; });
    el.addEventListener('blur', () => { editing = false; });
  }
  $('titleInput').addEventListener('input', (e) => { state.title = e.target.value; drawPreview(); });
  $('subtitleInput').addEventListener('input', (e) => { state.subtitle = e.target.value; drawPreview(); });
  $('taglineInput').addEventListener('input', (e) => { state.tagline = e.target.value; drawPreview(); });
  // Heat slider: arm the snapshot on the gesture that starts the change
  // (pointer down or arrow key), before the value moves.
  const heatEl = $('heatInput');
  let heatEditing = false;
  const armHeat = () => { if (!heatEditing) { heatEditing = true; pushHistory(); } };
  heatEl.addEventListener('pointerdown', armHeat);
  heatEl.addEventListener('keydown', armHeat);
  heatEl.addEventListener('change', () => { heatEditing = false; });
  heatEl.addEventListener('input', (e) => {
    state.heat = Number(e.target.value);
    syncControls();
    drawPreview();
  });
  $('undoBtn').addEventListener('click', undo);
  $('redoBtn').addEventListener('click', redo);
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
    if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) { e.preventDefault(); redo(); }
  });
  $('exportBtn').addEventListener('click', () => exportOne(state.size));
  $('exportAllBtn').addEventListener('click', exportAll);
  $('resetBtn').addEventListener('click', async () => {
    pushHistory();
    state = structuredClone(DEFAULT_STATE);
    await loadAllSamples();
    selectedSlot = 0;
    syncControls();
    drawPreview();
    setStatus('Reset to the Vice Coast demo.');
  });

  const canvas = $('preview');
  let dragStartSnapshot = null;
  let dragMoved = false;
  canvas.addEventListener('pointerdown', (e) => {
    const panel = panelAt(e.clientX, e.clientY);
    if (!panel) return;
    selectedSlot = panel.slot;
    syncControls();
    drawPreview();
    // Snapshot before the drag, so Undo restores the pre-drag pan.
    dragStartSnapshot = snapshot();
    dragMoved = false;
    dragging = { x: e.clientX, y: e.clientY };
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const dx = (e.clientX - dragging.x) * scaleX;
    const dy = (e.clientY - dragging.y) * scaleY;
    dragging = { x: e.clientX, y: e.clientY };
    if (dx || dy) dragMoved = true;
    const photo = state.photos[selectedSlot];
    const img = images[selectedSlot];
    if (!img) return;
    const geo = layoutGeometry(state.layout, canvas.width, canvas.height);
    const panel = geo.panels.find((p) => p.slot === selectedSlot);
    if (!panel) return;
    const base = Math.max(panel.w / img.naturalWidth, panel.h / img.naturalHeight);
    const s = base * photo.zoom;
    photo.cx -= dx / (img.naturalWidth * s);
    photo.cy -= dy / (img.naturalHeight * s);
    photo.cx = Math.min(1, Math.max(0, photo.cx));
    photo.cy = Math.min(1, Math.max(0, photo.cy));
    drawPreview();
  });
  canvas.addEventListener('pointerup', () => {
    if (dragging && dragMoved && dragStartSnapshot) {
      undoStack.push(dragStartSnapshot);
      if (undoStack.length > 25) undoStack.shift();
      redoStack = [];
      updateUndoButtons();
    }
    dragStartSnapshot = null;
    dragging = null;
  });
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const photo = state.photos[selectedSlot];
    pushHistory();
    photo.zoom = Math.min(3, Math.max(1, photo.zoom * (e.deltaY < 0 ? 1.12 : 0.89)));
    syncControls();
    drawPreview();
  }, { passive: false });
}

// Exposed for the headless probe in shots.js.
window.__viceCoast = { exportCanvas, state: () => state, images: () => images };

async function init() {
  buildPickers();
  buildSlots();
  bindControls();
  try {
    await Promise.race([
      Promise.all([document.fonts.load('16px Anton'), document.fonts.load('16px Pacifico')]),
      new Promise((r) => setTimeout(r, 4000)),
    ]);
  } catch { /* fonts fall back to sans-serif */ }
  await loadAllSamples();
  if (await runShotScene(state, images, drawPreview, syncControls)) return;
  syncControls();
  updateUndoButtons();
  drawPreview();
  setStatus('Ready — drag a panel to pan, scroll to zoom, then export your cover.');
}

init();
