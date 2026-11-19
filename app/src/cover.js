// Vice Coast Cover Studio — the cover engine.
//
// Draws a GTA-poster-style multi-panel cover onto any 2D canvas: the
// person's photos fill inked panels, a sunset or neon grade washes over
// them, and a bold Anton title with a Pacifico neon subtitle sits in a
// halftone title band. Everything here is original art: no Rockstar logo,
// artwork or font is used anywhere in the app.
//
// A cover state looks like:
//   { layout, grade, title, subtitle, tagline,
//     photos: [Image|null, ...] (four slots, A-D),
//     panels: [{ photo, zoom, dx, dy }, ...] (nine slots, one per panel) }
// Panels are addressed by index; each layout uses a prefix of them.

export const LAYOUTS = {
  grid: { name: 'Vice Grid', panels: 4, blurb: 'Four equal panels, the classic poster grid.' },
  hero: { name: 'Hero + Trio', panels: 4, blurb: 'One big hero panel beside three stacked moments.' },
  tilted: { name: 'Tilted Snapshots', panels: 3, blurb: 'Overlapping tilted snapshots on a sunset sky.' },
  strip: { name: 'Full Bleed + Strip', panels: 4, blurb: 'One full-bleed photo over a strip of three.' },
  nine: { name: 'Comic Nine', panels: 9, blurb: 'Nine panels, a comic-page cover.' },
  duo: { name: 'Sunset Duo', panels: 2, blurb: 'Two tall halves split by the title band.' },
};

export const GRADES = {
  sunset: { name: 'Vice Sunset', blurb: 'Orange gold melting into hot pink.' },
  neon: { name: 'Neon Nights', blurb: 'Magenta and cyan night-street glow.' },
  gold: { name: 'Gold Hour', blurb: 'Warm gold with cool teal shadows.' },
  midnight: { name: 'Midnight Vice', blurb: 'Deep blue night under violet neon.' },
  mono: { name: 'Noir Pink', blurb: 'Black-and-white photo, one hot-pink accent.' },
};

export const SIZES = [
  { id: 'square', label: 'Square 1080 × 1080', width: 1080, height: 1080 },
  { id: 'portrait', label: 'Portrait 1080 × 1350', width: 1080, height: 1350 },
  { id: 'wide', label: 'Wide 1920 × 1080', width: 1920, height: 1080 },
];

/** A fresh default cover state (no photos yet). */
export function defaultState() {
  return {
    layout: 'grid',
    grade: 'sunset',
    title: 'VICE COAST',
    subtitle: 'Neon Nights',
    tagline: 'VICE CITY  •  EST. 2026',
    photos: [null, null, null, null],
    panels: Array.from({ length: 9 }, (_, i) => ({ photo: i % 4, zoom: 1, dx: 0, dy: 0 })),
  };
}

/** Panel rectangles (in canvas pixels) for a layout, plus the title band. */
export function layoutPanels(layout, W, H) {
  const m = Math.round(W * 0.032);
  const g = Math.max(4, Math.round(W * 0.013));
  const x0 = m, y0 = m, x1 = W - m;
  // Panels end just above the title band (a small overlap keeps the layered
  // poster look without burying a whole panel row under the lettering).
  const y1 = H - Math.round(H * 0.20);
  const w = x1 - x0, h = y1 - y0;
  const third = (n) => (w - g * (n - 1)) / n;
  switch (layout) {
    case 'hero': {
      const heroW = Math.round(w * 0.6);
      const sideX = x0 + heroW + g;
      const sideW = x1 - sideX;
      const rowH = (h - g * 2) / 3;
      return {
        panels: [
          { x: x0, y: y0, w: heroW, h },
          { x: sideX, y: y0, w: sideW, h: rowH },
          { x: sideX, y: y0 + rowH + g, w: sideW, h: rowH },
          { x: sideX, y: y0 + (rowH + g) * 2, w: sideW, h: rowH },
        ],
        title: titleBand(W, H),
      };
    }
    case 'tilted': {
      const bw = Math.round(w * 0.56), bh = Math.round(h * 0.52);
      return {
        panels: [
          { x: x0 + w * 0.02, y: y0 + h * 0.03, w: bw, h: bh, rot: -0.07, polaroid: true },
          { x: x0 + w * 0.44, y: y0 + h * 0.10, w: bw, h: bh, rot: 0.06, polaroid: true },
          { x: x0 + w * 0.24, y: y0 + h * 0.44, w: bw, h: bh, rot: -0.02, polaroid: true },
        ],
        title: titleBand(W, H),
      };
    }
    case 'strip': {
      const topH = Math.round(h * 0.6);
      const stripY = y0 + topH + g;
      const stripH = y1 - stripY;
      const cw = third(3);
      return {
        panels: [
          { x: x0, y: y0, w, h: topH },
          { x: x0, y: stripY, w: cw, h: stripH },
          { x: x0 + cw + g, y: stripY, w: cw, h: stripH },
          { x: x0 + (cw + g) * 2, y: stripY, w: cw, h: stripH },
        ],
        title: titleBand(W, H),
      };
    }
    case 'nine': {
      const cw = third(3), ch = (h - g * 2) / 3;
      const panels = [];
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          panels.push({ x: x0 + c * (cw + g), y: y0 + r * (ch + g), w: cw, h: ch });
        }
      }
      return { panels, title: titleBand(W, H) };
    }
    case 'duo': {
      const cw = (w - g) / 2;
      return {
        panels: [
          { x: x0, y: y0, w: cw, h },
          { x: x0 + cw + g, y: y0, w: cw, h },
        ],
        title: titleBand(W, H),
      };
    }
    case 'grid':
    default: {
      const cw = (w - g) / 2, ch = (h - g) / 2;
      return {
        panels: [
          { x: x0, y: y0, w: cw, h: ch },
          { x: x0 + cw + g, y: y0, w: cw, h: ch },
          { x: x0, y: y0 + ch + g, w: cw, h: ch },
          { x: x0 + cw + g, y: y0 + ch + g, w: cw, h: ch },
        ],
        title: titleBand(W, H),
      };
    }
  }
}

/** The title band sits across the lower part of the cover. */
function titleBand(W, H) {
  const bh = Math.round(H * 0.235);
  return { x: 0, y: H - bh, w: W, h: bh };
}

/** Which panel (index) contains canvas point (px, py), or -1. */
export function panelAt(layout, W, H, px, py) {
  const { panels } = layoutPanels(layout, W, H);
  for (let i = panels.length - 1; i >= 0; i--) {
    const r = panels[i];
    if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) return i;
  }
  return -1;
}

// ---------------------------------------------------------------- grain

let grainPattern = null;
function grain(ctx, W, H) {
  if (!grainPattern) {
    const n = document.createElement('canvas');
    n.width = 140; n.height = 140;
    const c = n.getContext('2d');
    const img = c.createImageData(140, 140);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = 110 + Math.floor(Math.random() * 90);
      img.data[i] = v; img.data[i + 1] = v; img.data[i + 2] = v; img.data[i + 3] = 255;
    }
    c.putImageData(img, 0, 0);
    grainPattern = ctx.createPattern(n, 'repeat');
  }
  ctx.save();
  ctx.globalAlpha = 0.09;
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = grainPattern;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

function vignette(ctx, W, H) {
  const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.78);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(10,0,20,0.42)');
  ctx.save();
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

// ---------------------------------------------------------------- panels

/** Draws one photo into one panel rect, cover-fit, with zoom and pan. */
function drawPanelPhoto(ctx, img, r, cfg, grade) {
  ctx.save();
  const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
  if (r.rot) ctx.translate(cx, cy), ctx.rotate(r.rot), ctx.translate(-cx, -cy);
  ctx.beginPath();
  ctx.rect(r.x, r.y, r.w, r.h);
  ctx.clip();
  const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
  const base = Math.max(r.w / iw, r.h / ih);
  const s = base * (cfg.zoom || 1);
  const pw = iw * s, ph = ih * s;
  // Clamp the pan so the photo always covers the whole panel: a tall panel
  // (photo as tall as the panel) simply ignores vertical panning instead of
  // sliding open a gap, and a wide panel pans only within its spare height.
  const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
  const px = clamp(cx + (cfg.dx || 0) * r.w - pw / 2, r.x + r.w - pw, r.x);
  const py = clamp(cy + (cfg.dy || 0) * r.h - ph / 2, r.y + r.h - ph, r.y);
  if (grade === 'mono') ctx.filter = 'grayscale(1) contrast(1.12) brightness(1.04)';
  ctx.drawImage(img, px, py, pw, ph);
  ctx.filter = 'none';
  gradeWash(ctx, r, grade);
  ctx.restore();
}

/** The colour grade washed over a photo already drawn in rect r. */
function gradeWash(ctx, r, grade) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(r.x, r.y, r.w, r.h);
  ctx.clip();
  if (grade === 'sunset') {
    const g = ctx.createLinearGradient(0, r.y, 0, r.y + r.h);
    g.addColorStop(0, 'rgba(255,190,90,0.10)');
    g.addColorStop(0.55, 'rgba(255,110,60,0.05)');
    g.addColorStop(1, 'rgba(214,40,120,0.34)');
    ctx.fillStyle = g;
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = 'rgba(255,120,60,0.16)';
    ctx.fillRect(r.x, r.y, r.w, r.h);
  } else if (grade === 'neon') {
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = 'rgba(255,0,170,0.20)';
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.fillStyle = 'rgba(0,220,255,0.16)';
    const g = ctx.createLinearGradient(r.x, r.y, r.x + r.w, r.y + r.h);
    g.addColorStop(0, 'rgba(0,220,255,0.20)');
    g.addColorStop(1, 'rgba(0,220,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.globalCompositeOperation = 'source-over';
    const d = ctx.createLinearGradient(0, r.y + r.h, 0, r.y);
    d.addColorStop(0, 'rgba(20,0,50,0.30)');
    d.addColorStop(1, 'rgba(20,0,50,0)');
    ctx.fillStyle = d;
    ctx.fillRect(r.x, r.y, r.w, r.h);
  } else if (grade === 'gold') {
    ctx.globalCompositeOperation = 'soft-light';
    ctx.fillStyle = 'rgba(255,176,0,0.55)';
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.globalCompositeOperation = 'multiply';
    const g = ctx.createLinearGradient(0, r.y, 0, r.y + r.h);
    g.addColorStop(0, 'rgba(0,90,100,0)');
    g.addColorStop(1, 'rgba(0,70,90,0.28)');
    ctx.fillStyle = g;
    ctx.fillRect(r.x, r.y, r.w, r.h);
  } else if (grade === 'midnight') {
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = 'rgba(52,52,180,0.30)';
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = 'rgba(170,60,255,0.22)';
    ctx.fillRect(r.x, r.y, r.w, r.h);
  } else if (grade === 'mono') {
    ctx.globalCompositeOperation = 'source-over';
    const g = ctx.createLinearGradient(0, r.y, 0, r.y + r.h);
    g.addColorStop(0, 'rgba(255,0,130,0)');
    g.addColorStop(1, 'rgba(255,0,130,0.28)');
    ctx.fillStyle = g;
    ctx.fillRect(r.x, r.y, r.w, r.h);
  }
  ctx.restore();
}

/** The inked poster frame around a panel (strokes only; backing is separate). */
function framePanel(ctx, r, W) {
  ctx.save();
  const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
  if (r.rot) ctx.translate(cx, cy), ctx.rotate(r.rot), ctx.translate(-cx, -cy);
  const outer = Math.max(3, W * 0.005);
  ctx.lineWidth = outer;
  ctx.strokeStyle = '#ffffff';
  ctx.strokeRect(r.x, r.y, r.w, r.h);
  ctx.lineWidth = Math.max(1.5, W * 0.0016);
  ctx.strokeStyle = 'rgba(0,0,0,0.85)';
  ctx.strokeRect(r.x + outer + 1, r.y + outer + 1, r.w - outer * 2 - 2, r.h - outer * 2 - 2);
  ctx.restore();
}

/** The white polaroid card behind a tilted panel — drawn BEFORE its photo. */
function backingPanel(ctx, r, W) {
  if (!r.polaroid) return;
  ctx.save();
  const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
  ctx.translate(cx, cy);
  ctx.rotate(r.rot);
  ctx.translate(-cx, -cy);
  const pad = Math.max(8, W * 0.011), foot = Math.max(26, W * 0.032);
  ctx.fillStyle = '#fdf8ef';
  ctx.shadowColor = 'rgba(0,0,0,0.45)';
  ctx.shadowBlur = W * 0.02;
  ctx.shadowOffsetY = W * 0.008;
  ctx.fillRect(r.x - pad, r.y - pad, r.w + pad * 2, r.h + pad + foot);
  ctx.restore();
}

/** An empty panel: striped placeholder asking for a photo. */
function emptyPanel(ctx, r, i) {
  ctx.save();
  const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
  if (r.rot) ctx.translate(cx, cy), ctx.rotate(r.rot), ctx.translate(-cx, -cy);
  const g = ctx.createLinearGradient(r.x, r.y, r.x + r.w, r.y + r.h);
  g.addColorStop(0, '#3a1440');
  g.addColorStop(1, '#160a24');
  ctx.fillStyle = g;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = 'rgba(255,255,255,0.10)';
  ctx.lineWidth = Math.max(2, r.w * 0.01);
  for (let d = -r.h; d < r.w; d += Math.max(18, r.w * 0.09)) {
    ctx.beginPath();
    ctx.moveTo(r.x + d, r.y + r.h);
    ctx.lineTo(r.x + d + r.h, r.y);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = `bold ${Math.max(14, r.w * 0.05)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(`PANEL ${i + 1}`, cx, cy - r.h * 0.02);
  ctx.font = `${Math.max(11, r.w * 0.032)}px sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.fillText('ADD A PHOTO', cx, cy + r.h * 0.07);
  ctx.restore();
}

// ---------------------------------------------------------------- title

/** Halftone dots fading across the title band. */
function halftone(ctx, band, W) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(band.x, band.y, band.w, band.h);
  ctx.clip();
  const step = Math.max(12, W * 0.013);
  for (let y = band.y + step / 2; y < band.y + band.h; y += step) {
    for (let x = band.x + step / 2; x < band.x + band.w; x += step) {
      const t = (x - band.x) / band.w;
      const rad = step * (0.10 + 0.22 * t);
      ctx.fillStyle = 'rgba(255,255,255,0.16)';
      ctx.beginPath();
      ctx.arc(x, y, rad, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

/** The title band: gradient, halftone, Anton title, Pacifico subtitle. */
function drawTitleBand(ctx, state, W, H) {
  const band = titleBand(W, H);
  const g = ctx.createLinearGradient(band.x, band.y, band.x + band.w, band.y + band.h);
  if (state.grade === 'neon') {
    g.addColorStop(0, '#ff2e88'); g.addColorStop(0.5, '#7b2ff7'); g.addColorStop(1, '#00c2ff');
  } else if (state.grade === 'midnight') {
    g.addColorStop(0, '#1b1040'); g.addColorStop(0.5, '#4b1d8f'); g.addColorStop(1, '#0e2a5e');
  } else if (state.grade === 'gold') {
    g.addColorStop(0, '#ff9a1f'); g.addColorStop(0.5, '#ff5e62'); g.addColorStop(1, '#7b2ff7');
  } else if (state.grade === 'mono') {
    g.addColorStop(0, '#111111'); g.addColorStop(0.55, '#2b2b2b'); g.addColorStop(1, '#ff2e88');
  } else {
    g.addColorStop(0, '#ff7e1f'); g.addColorStop(0.45, '#ff3d77'); g.addColorStop(1, '#7b2ff7');
  }
  ctx.save();
  ctx.fillStyle = g;
  ctx.fillRect(band.x, band.y, band.w, band.h);
  halftone(ctx, band, W);
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fillRect(band.x, band.y, band.w, Math.max(2, H * 0.004));

  const cx = band.x + band.w / 2;
  const title = (state.title || '').trim().toUpperCase();
  if (title) {
    let size = band.h * 0.46;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    const fit = () => {
      ctx.font = `${size}px Anton, 'Arial Narrow', sans-serif`;
      return ctx.measureText(title).width;
    };
    while (fit() > band.w * 0.94 && size > 14) size -= 2;
    const ty = band.y + band.h * 0.52;
    const off = Math.max(2, size * 0.035);
    ctx.font = `${size}px Anton, 'Arial Narrow', sans-serif`;
    // Chromatic offset shadows, then ink outline, then white fill.
    ctx.fillStyle = '#00e5ff';
    ctx.fillText(title, cx - off, ty - off * 0.4);
    ctx.fillStyle = '#ff2e88';
    ctx.fillText(title, cx + off, ty + off * 0.6);
    ctx.lineWidth = Math.max(2, size * 0.07);
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#14061f';
    ctx.strokeText(title, cx, ty);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(title, cx, ty);
  }

  const sub = (state.subtitle || '').trim();
  if (sub) {
    const size = Math.max(16, band.h * 0.19);
    ctx.font = `${size}px Pacifico, cursive`;
    ctx.textAlign = 'center';
    ctx.shadowColor = '#ff2e88';
    ctx.shadowBlur = size * 0.55;
    ctx.fillStyle = '#ffe14d';
    ctx.fillText(sub, cx, band.y + band.h * 0.82);
    ctx.shadowBlur = 0;
  }

  const tag = (state.tagline || '').trim().toUpperCase();
  if (tag) {
    const size = Math.max(10, band.h * 0.085);
    ctx.font = `bold ${size}px sans-serif`;
    ctx.textAlign = 'center';
    try { ctx.letterSpacing = `${Math.max(2, size * 0.28)}px`; } catch { /* older canvas */ }
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.fillText(tag, cx, band.y + band.h * 0.985 - size * 0.4);
    try { ctx.letterSpacing = '0px'; } catch { /* ignore */ }
  }
  ctx.restore();
}

/** Badge ribbon top-left and the five-star heat meter top-right. */
function drawBadges(ctx, W, H) {
  const s = Math.max(11, W * 0.011);
  ctx.save();
  ctx.font = `bold ${s}px sans-serif`;
  ctx.textAlign = 'left';
  const label = '★ VICE COAST';
  const pad = s * 0.9;
  const tw = ctx.measureText(label).width;
  const bx = W * 0.032, by = H * 0.032;
  ctx.fillStyle = 'rgba(12,4,24,0.82)';
  ctx.beginPath();
  ctx.roundRect(bx, by, tw + pad * 2, s * 2.1, s);
  ctx.fill();
  ctx.fillStyle = '#ffe14d';
  ctx.fillText(label, bx + pad, by + s * 1.48);

  // Heat meter: five filled stars on a dark pill, the fifth dimmed.
  const starSize = s * 1.15;
  ctx.font = `${starSize}px sans-serif`;
  const starW = ctx.measureText('★★★★★').width;
  const sx = W - W * 0.032 - starW - pad * 2;
  const sy = by;
  ctx.fillStyle = 'rgba(12,4,24,0.82)';
  ctx.beginPath();
  ctx.roundRect(sx, sy, starW + pad * 2, s * 2.1, s);
  ctx.fill();
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffe14d';
  ctx.shadowColor = '#ff2e88';
  ctx.shadowBlur = s * 0.5;
  ctx.fillText('★★★★', sx + pad, sy + s * 1.48);
  const fourW = ctx.measureText('★★★★').width;
  ctx.fillStyle = 'rgba(255,225,77,0.45)';
  ctx.fillText('★', sx + pad + fourW, sy + s * 1.48);
  ctx.shadowBlur = 0;
  ctx.restore();
}

// ---------------------------------------------------------------- entry

/** Draws the whole cover for `state` onto `canvas` (its own pixel size). */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  // Sunset sky behind everything (shows between tilted panels).
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  if (state.grade === 'neon') {
    sky.addColorStop(0, '#160a33'); sky.addColorStop(0.55, '#4b1d8f'); sky.addColorStop(1, '#ff2e88');
  } else if (state.grade === 'midnight') {
    sky.addColorStop(0, '#060a24'); sky.addColorStop(1, '#241145');
  } else if (state.grade === 'mono') {
    sky.addColorStop(0, '#1c1c1c'); sky.addColorStop(1, '#000000');
  } else if (state.grade === 'gold') {
    sky.addColorStop(0, '#2b1a4d'); sky.addColorStop(0.6, '#c2502e'); sky.addColorStop(1, '#ffb347');
  } else {
    sky.addColorStop(0, '#3d1a5e'); sky.addColorStop(0.5, '#c22769'); sky.addColorStop(1, '#ff8c42');
  }
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);
  // A low sun disc glowing behind the panels.
  const sun = ctx.createRadialGradient(W * 0.5, H * 0.42, 0, W * 0.5, H * 0.42, W * 0.34);
  sun.addColorStop(0, 'rgba(255,214,120,0.55)');
  sun.addColorStop(0.5, 'rgba(255,120,80,0.18)');
  sun.addColorStop(1, 'rgba(255,120,80,0)');
  ctx.fillStyle = sun;
  ctx.fillRect(0, 0, W, H);

  const { panels } = layoutPanels(state.layout, W, H);
  const count = LAYOUTS[state.layout]?.panels ?? 4;
  for (let i = 0; i < count; i++) {
    const r = panels[i];
    const cfg = state.panels[i] || { photo: 0, zoom: 1, dx: 0, dy: 0 };
    const img = state.photos[cfg.photo];
    backingPanel(ctx, r, W);
    if (img) drawPanelPhoto(ctx, img, r, cfg, state.grade);
    else emptyPanel(ctx, r, i);
    framePanel(ctx, r, W);
  }

  drawTitleBand(ctx, state, W, H);
  drawBadges(ctx, W, H);
  grain(ctx, W, H);
  vignette(ctx, W, H);
}
