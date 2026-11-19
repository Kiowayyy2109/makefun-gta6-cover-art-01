// Vice Coast Cover Studio — screenshot scenes + headless probe.
// ?shot=cover&layout=..&grade=..&size=WxH  renders one exported cover full-frame.
// ?shot=editor                            shows the editor with sample photos loaded.
// ?probe=export                            exports all three sizes and writes the
//                                           results into #probe-result for headless checks.
// None of this ships any network request; it only drives the same drawCover code.

import { renderCoverCanvas, sizeById } from './cover.js';

function params() {
  return new URLSearchParams(location.search);
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('shot image failed: ' + src));
    img.src = src;
  });
}

async function shotCover(state, images) {
  const q = params();
  const size = sizeById(q.get('size') || state.size);
  const scene = {
    ...state,
    layout: q.get('layout') || state.layout,
    grade: q.get('grade') || state.grade,
    title: q.get('title') || state.title,
    subtitle: q.get('subtitle') || state.subtitle,
    tagline: q.get('tagline') || state.tagline,
    heat: Number(q.get('heat') || state.heat),
  };
  const sampleImgs = images.slice();
  if (!sampleImgs[0]) sampleImgs[0] = await loadImage('samples/boulevard.jpg');
  if (!sampleImgs[1]) sampleImgs[1] = await loadImage('samples/pier.jpg');
  if (!sampleImgs[2]) sampleImgs[2] = sampleImgs[0];
  if (!sampleImgs[3]) sampleImgs[3] = sampleImgs[1];
  document.body.innerHTML = '';
  document.body.style.margin = '0';
  document.body.style.background = '#0b0618';
  const canvas = renderCoverCanvas(size.w, size.h, scene, sampleImgs, state.photos);
  canvas.style.display = 'block';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.objectFit = 'contain';
  document.body.appendChild(canvas);
  document.title = 'cover ready';
  return true;
}

async function shotEditor(state, images, drawPreview, syncControls) {
  // Editor with the demo photos already in, a strong layout/grade preset.
  state.layout = params().get('layout') || 'hero-trio';
  state.grade = params().get('grade') || 'sunset';
  state.size = params().get('size') || '1920x1080';
  if (!images[0]) images[0] = await loadImage('samples/boulevard.jpg');
  if (!images[1]) images[1] = await loadImage('samples/pier.jpg');
  if (!images[2]) images[2] = images[0];
  if (!images[3]) images[3] = images[1];
  syncControls();
  drawPreview();
  document.title = 'editor ready';
  return true;
}

async function probeExport() {
  const results = [];
  for (const id of ['1080x1080', '1080x1350', '1920x1080']) {
    const { canvas, size } = window.__viceCoast.exportCanvas(id);
    const bytes = await new Promise((resolve) => {
      canvas.toBlob((b) => resolve(b.size), 'image/png');
    });
    results.push({ size: `${size.w}x${size.h}`, width: canvas.width, height: canvas.height, bytes });
  }
  const pre = document.createElement('pre');
  pre.id = 'probe-result';
  pre.textContent = JSON.stringify(results);
  document.body.appendChild(pre);
  document.title = 'probe done';
  return true;
}

// Returns true when a scene took over the page.
export async function runShotScene(state, images, drawPreview, syncControls) {
  const q = params();
  try {
    await Promise.race([
      Promise.all([document.fonts.load('16px Anton'), document.fonts.load('16px Pacifico')]),
      new Promise((r) => setTimeout(r, 4000)),
    ]);
  } catch { /* fall back */ }
  if (q.get('probe') === 'export') return probeExport();
  if (q.get('shot') === 'cover') return shotCover(state, images);
  if (q.get('shot') === 'editor') return shotEditor(state, images, drawPreview, syncControls);
  return false;
}
