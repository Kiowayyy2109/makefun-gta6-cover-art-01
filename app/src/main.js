// Vice Coast Cover Studio — the editor.
//
// Wires the page: four photo slots, six layouts, five grades, caption
// editing, per-panel crop and position, undo and redo, and PNG export in
// the three post sizes. Photos are read on this machine only and never
// uploaded. A `?shot=` query sets up a fixed scene for a screenshot
// instead (./shots.js).

import { drawCover, defaultState, layoutPanels, panelAt, LAYOUTS, GRADES, SIZES } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const statusEl = document.getElementById('status');
const state = defaultState();
let selectedPanel = 0;
let currentSize = SIZES[0];
let undoStack = [];
let redoStack = [];
let sliderUndoArmed = true;

/** Pushes one undo snapshot at the start of a drag/type gesture, before it mutates. */
function armGestureUndo() {
  if (sliderUndoArmed) { pushUndo(); sliderUndoArmed = false; }
}

function disarmGestureUndo() { sliderUndoArmed = true; }

const $ = (id) => document.getElementById(id);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${url}`));
    img.src = url;
  });
}

function snapshot() {
  return JSON.stringify({
    layout: state.layout, grade: state.grade,
    title: state.title, subtitle: state.subtitle, tagline: state.tagline,
    panels: state.panels,
  });
}

function restore(json) {
  const s = JSON.parse(json);
  state.layout = s.layout; state.grade = s.grade;
  state.title = s.title; state.subtitle = s.subtitle; state.tagline = s.tagline;
  state.panels = s.panels;
  syncControls();
}

/** Pushes the pre-change state for undo (called before a change lands). */
function pushUndo() {
  undoStack.push(snapshot());
  if (undoStack.length > 60) undoStack.shift();
  redoStack = [];
  updateUndoButtons();
}

function updateUndoButtons() {
  $('undo').disabled = undoStack.length === 0;
  $('redo').disabled = redoStack.length === 0;
}

function doUndo() {
  if (!undoStack.length) return;
  redoStack.push(snapshot());
  restore(undoStack.pop());
  updateUndoButtons();
  redraw();
}

function doRedo() {
  if (!redoStack.length) return;
  undoStack.push(snapshot());
  restore(redoStack.pop());
  updateUndoButtons();
  redraw();
}

function setStatus(text) {
  statusEl.textContent = text;
}

/** Redraws the preview canvas at the current export size. */
export function redraw() {
  canvas.width = currentSize.width;
  canvas.height = currentSize.height;
  drawCover(canvas, state);
  syncPanelEditor();
}

function syncControls() {
  $('title').value = state.title;
  $('subtitle').value = state.subtitle;
  $('tagline').value = state.tagline;
  $$('[data-layout]').forEach((b) => b.classList.toggle('active', b.dataset.layout === state.layout));
  $$('[data-grade]').forEach((b) => b.classList.toggle('active', b.dataset.grade === state.grade));
  $$('[data-size]').forEach((b) => b.classList.toggle('active', b.dataset.size === currentSize.id));
  buildPanelList();
}

function buildPanelList() {
  const list = $('panel-list');
  list.innerHTML = '';
  const count = LAYOUTS[state.layout].panels;
  for (let i = 0; i < count; i++) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'panel-chip' + (i === selectedPanel ? ' active' : '');
    b.textContent = `Panel ${i + 1}`;
    b.addEventListener('click', () => { selectedPanel = i; syncPanelEditor(); buildPanelList(); });
    list.appendChild(b);
  }
  syncPanelEditor();
}

/** Syncs the per-panel crop/position editor to the selected panel. */
function syncPanelEditor() {
  const count = LAYOUTS[state.layout].panels;
  if (selectedPanel >= count) selectedPanel = 0;
  const cfg = state.panels[selectedPanel];
  $('panel-name').textContent = `Panel ${selectedPanel + 1} — ${LAYOUTS[state.layout].name}`;
  const sel = $('panel-photo');
  sel.value = String(cfg.photo);
  $('panel-zoom').value = String(cfg.zoom);
  $('panel-x').value = String(cfg.dx);
  $('panel-y').value = String(cfg.dy);
  $('zoom-val').textContent = `${Math.round(cfg.zoom * 100)}%`;
  $('x-val').textContent = `${Math.round(cfg.dx * 100)}`;
  $('y-val').textContent = `${Math.round(cfg.dy * 100)}`;
  const img = state.photos[cfg.photo];
  $('panel-hint').textContent = img
    ? `Photo ${'ABCD'[cfg.photo]} loaded — drag the sliders to crop and position it.`
    : 'No photo in this slot yet — add one in Photos above.';
}

/** Renders the cover at full size and returns a PNG blob. */
export function exportCoverPNG(width, height) {
  return new Promise((resolve) => {
    const off = document.createElement('canvas');
    off.width = width;
    off.height = height;
    drawCover(off, state);
    off.toBlob((blob) => resolve(blob), 'image/png');
  });
}

async function downloadPNG(size) {
  setStatus(`Exporting ${size.width} × ${size.height}…`);
  const blob = await exportCoverPNG(size.width, size.height);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `vice-coast-${size.width}x${size.height}.png`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  setStatus(`Saved vice-coast-${size.width}x${size.height}.png (${Math.round(blob.size / 1024)} KB)`);
}

/** Assigns photo slot `slot` from a File, then redraws. */
async function setPhotoFromFile(slot, file) {
  if (!file) return;
  const img = await loadImage(URL.createObjectURL(file));
  state.photos[slot] = img;
  $(`slot-${slot}`).classList.add('filled');
  $(`slot-${slot}-name`).textContent = file.name.length > 18 ? `${file.name.slice(0, 16)}…` : file.name;
  redraw();
  setStatus(`Photo ${'ABCD'[slot]} loaded — ${state.panels.filter((p) => p.photo === slot).length} panel(s) use it.`);
}

/** Loads one of the bundled samples into a photo slot. */
async function setPhotoFromSample(slot, name) {
  const img = await loadImage(`samples/${name}.jpg`);
  state.photos[slot] = img;
  $(`slot-${slot}`).classList.add('filled');
  $(`slot-${slot}-name`).textContent = `${name}.jpg (sample)`;
  redraw();
}

// ------------------------------------------------------------ controls

$$('[data-layout]').forEach((b) => b.addEventListener('click', () => {
  if (b.dataset.layout === state.layout) return;
  pushUndo();
  state.layout = b.dataset.layout;
  selectedPanel = 0;
  syncControls();
  redraw();
}));

$$('[data-grade]').forEach((b) => b.addEventListener('click', () => {
  if (b.dataset.grade === state.grade) return;
  pushUndo();
  state.grade = b.dataset.grade;
  syncControls();
  redraw();
}));

$$('[data-size]').forEach((b) => b.addEventListener('click', () => {
  currentSize = SIZES.find((s) => s.id === b.dataset.size);
  syncControls();
  redraw();
  setStatus(`Preview at ${currentSize.width} × ${currentSize.height} — export keeps full size.`);
}));

for (let slot = 0; slot < 4; slot++) {
  $(`photo-${slot}`).addEventListener('change', (e) => setPhotoFromFile(slot, e.target.files[0]));
  $(`sample-${slot}`).addEventListener('click', () => setPhotoFromSample(slot, slot % 2 === 0 ? 'boulevard' : 'pier'));
}

$('fill-all').addEventListener('click', () => {
  const slot = Number($('panel-photo').value);
  pushUndo();
  state.panels.forEach((p) => { p.photo = slot; });
  redraw();
  setStatus(`Every panel now uses photo ${'ABCD'[slot]}.`);
});

$('panel-photo').addEventListener('change', (e) => {
  pushUndo();
  state.panels[selectedPanel].photo = Number(e.target.value);
  redraw();
});
$('panel-zoom').addEventListener('input', (e) => {
  armGestureUndo();
  state.panels[selectedPanel].zoom = Number(e.target.value);
  redraw();
});
$('panel-zoom').addEventListener('change', disarmGestureUndo);
$('panel-x').addEventListener('input', (e) => {
  armGestureUndo();
  state.panels[selectedPanel].dx = Number(e.target.value);
  redraw();
});
$('panel-x').addEventListener('change', disarmGestureUndo);
$('panel-y').addEventListener('input', (e) => {
  armGestureUndo();
  state.panels[selectedPanel].dy = Number(e.target.value);
  redraw();
});
$('panel-y').addEventListener('change', disarmGestureUndo);

function bindCaption(id, key) {
  $(id).addEventListener('input', (e) => { armGestureUndo(); state[key] = e.target.value; redraw(); });
  $(id).addEventListener('change', disarmGestureUndo);
}
bindCaption('title', 'title');
bindCaption('subtitle', 'subtitle');
bindCaption('tagline', 'tagline');

$('export-one').addEventListener('click', () => downloadPNG(currentSize));
$('export-all').addEventListener('click', async () => {
  for (const size of SIZES) {
    // eslint-disable-next-line no-await-in-loop
    await downloadPNG(size);
  }
});
$('undo').addEventListener('click', doUndo);
$('redo').addEventListener('click', doRedo);
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) { e.preventDefault(); doUndo(); }
  if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) { e.preventDefault(); doRedo(); }
});

// Click a panel in the preview to select it for crop and position.
canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const px = ((e.clientX - rect.left) / rect.width) * canvas.width;
  const py = ((e.clientY - rect.top) / rect.height) * canvas.height;
  const hit = panelAt(state.layout, canvas.width, canvas.height, px, py);
  if (hit >= 0) {
    selectedPanel = hit;
    buildPanelList();
    $('panel-editor').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
});

// ------------------------------------------------------------ boot

async function boot() {
  syncControls();
  updateUndoButtons();
  const query = new URLSearchParams(location.search);
  const shot = query.get('shot');
  if (shot) {
    await runShot(shot, query, {
      loadSample: setPhotoFromSample,
      setState(patch) {
        pushUndo();
        Object.assign(state, patch);
        syncControls();
      },
      setSize(id) {
        currentSize = SIZES.find((s) => s.id === id) || SIZES[0];
        syncControls();
      },
      redraw,
    });
  } else {
    redraw();
  }
  // Redraw once the display fonts arrive so lettering uses Anton/Pacifico.
  if (document.fonts) {
    document.fonts.load('16px Anton').catch(() => {});
    document.fonts.load('16px Pacifico').catch(() => {});
    document.fonts.ready.then(() => redraw()).catch(() => {});
  }
}

window.__viceCoast = { state, redraw, exportCoverPNG, setPhotoFromSample, SIZES };
boot();
