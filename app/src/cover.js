// Vice Coast Cover Studio — cover renderer.
// Draws a multi-panel GTA-poster-style cover on any 2D canvas, fully offline.
// No Rockstar art, logo or font: lettering is Anton + Pacifico (SIL OFL).
// Panels, grades, halftone title band, badge, heat meter, grain, vignette.

export const GRADES = [
  {
    id: 'sunset', name: 'Vice Sunset',
    sky: ['#ffd166', '#ff7a59', '#ff2e88', '#5b2a86'],
    wash: 'rgba(255, 94, 122, 0.16)', tint: 'rgba(255, 170, 60, 0.10)',
    title: ['#fff6c9', '#ffb347', '#ff5e7a'], glow: '#ff2e88',
    accent: '#ffd166', band: 'rgba(20, 8, 40, 0.72)',
  },
  {
    id: 'neon', name: 'Neon Nights',
    sky: ['#0affef', '#2b6cff', '#b537f2', '#12002e'],
    wash: 'rgba(64, 224, 255, 0.14)', tint: 'rgba(181, 55, 242, 0.12)',
    title: ['#d9fbff', '#0affef', '#ff2e88'], glow: '#0affef',
    accent: '#0affef', band: 'rgba(6, 0, 32, 0.78)',
  },
  {
    id: 'gold', name: 'Gold Hour',
    sky: ['#fff3b0', '#ffb347', '#e07b39', '#7a2d12'],
    wash: 'rgba(255, 179, 71, 0.16)', tint: 'rgba(255, 220, 120, 0.10)',
    title: ['#fffbe8', '#ffd166', '#ff8c42'], glow: '#ffb347',
    accent: '#fff3b0', band: 'rgba(40, 16, 0, 0.72)',
  },
  {
    id: 'midnight', name: 'Midnight Vice',
    sky: ['#1b2a6b', '#0e1a3d', '#12002e', '#000000'],
    wash: 'rgba(90, 120, 255, 0.14)', tint: 'rgba(43, 108, 255, 0.10)',
    title: ['#e8ecff', '#9db4ff', '#ff5e7a'], glow: '#7aa2ff',
    accent: '#9db4ff', band: 'rgba(2, 6, 26, 0.78)',
  },
  {
    id: 'noir', name: 'Noir Pink',
    sky: ['#ff9ebb', '#c9184a', '#2b0a1e', '#0d0208'],
    wash: 'rgba(255, 46, 136, 0.18)', tint: 'rgba(201, 24, 74, 0.12)',
    title: ['#ffe3ee', '#ff8fb1', '#ff2e88'], glow: '#ff5e7a',
    accent: '#ff8fb1', band: 'rgba(24, 2, 12, 0.78)',
  },
];

export const LAYOUTS = [
  { id: 'vice-grid', name: 'Vice Grid' },
  { id: 'hero-trio', name: 'Hero + Trio' },
  { id: 'tilted', name: 'Tilted Snapshots' },
  { id: 'full-bleed', name: 'Full Bleed + Strip' },
  { id: 'comic-nine', name: 'Comic Nine' },
  { id: 'sunset-duo', name: 'Sunset Duo' },
];

export const SIZES = [
  { id: '1080x1080', label: 'Square 1080 × 1080', w: 1080, h: 1080 },
  { id: '1080x1350', label: 'Portrait 1080 × 1350', w: 1080, h: 1350 },
  { id: '1920x1080', label: 'Wide 1920 × 1080', w: 1920, h: 1080 },
];

export function gradeById(id) {
  return GRADES.find((g) => g.id === id) || GRADES[0];
}

export function sizeById(id) {
  return SIZES.find((s) => s.id === id) || SIZES[0];
}

// Seeded random so the grain is identical on every run.
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let grainTile = null;
function getGrainTile() {
  if (grainTile) return grainTile;
  const rand = mulberry32(20261119);
  const tile = document.createElement('canvas');
  tile.width = 140; tile.height = 140;
  const c = tile.getContext('2d');
  const img = c.createImageData(140, 140);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.floor(rand() * 255);
    img.data[i] = v; img.data[i + 1] = v; img.data[i + 2] = v; img.data[i + 3] = 255;
  }
  c.putImageData(img, 0, 0);
  grainTile = tile;
  return tile;
}

// Layout geometry in pixels for a canvas of W x H.
// panels: {x, y, w, h, slot, rot (deg), frame ('plain' | 'polaroid')}
// title:  {x, y, w, h, align}   badge/heat: {x, y} anchor points.
export function layoutGeometry(layoutId, W, H) {
  const g = Math.round(W * 0.014);
  const half = (W - g * 3) / 2;
  const third = (W - g * 4) / 3;
  switch (layoutId) {
    case 'hero-trio': {
      const heroW = Math.round(W * 0.60);
      const sideX = heroW + g;
      const sideW = W - sideX - g;
      const rowH = (Math.round(H * 0.70) - g * 2) / 3;
      return {
        panels: [
          { x: g, y: g, w: heroW, h: Math.round(H * 0.70), slot: 0, rot: 0, frame: 'plain' },
          { x: sideX, y: g, w: sideW, h: rowH, slot: 1, rot: 0, frame: 'plain' },
          { x: sideX, y: g + rowH + g, w: sideW, h: rowH, slot: 2, rot: 0, frame: 'plain' },
          { x: sideX, y: g + (rowH + g) * 2, w: sideW, h: rowH, slot: 3, rot: 0, frame: 'plain' },
        ],
        title: { x: g, y: Math.round(H * 0.735), w: W - g * 2, h: Math.round(H * 0.24), align: 'left' },
        badge: { x: g, y: g }, heat: { x: W - g, y: g },
      };
    }
    case 'tilted': {
      return {
        panels: [
          { x: W * 0.04, y: H * 0.21, w: W * 0.42, h: H * 0.54, slot: 0, rot: -4, frame: 'polaroid' },
          { x: W * 0.34, y: H * 0.13, w: W * 0.40, h: H * 0.58, slot: 1, rot: 3, frame: 'polaroid' },
          { x: W * 0.60, y: H * 0.25, w: W * 0.36, h: H * 0.50, slot: 2, rot: -2, frame: 'polaroid' },
        ],
        title: { x: g, y: Math.round(H * 0.015), w: W - g * 2, h: Math.round(H * 0.10), align: 'center' },
        badge: { x: g, y: Math.round(H * 0.86) }, heat: { x: W - g, y: Math.round(H * 0.86) },
      };
    }
    case 'full-bleed': {
      const stripY = Math.round(H * 0.74);
      const stripH = H - stripY - g;
      return {
        panels: [
          { x: 0, y: 0, w: W, h: Math.round(H * 0.72), slot: 0, rot: 0, frame: 'plain' },
          { x: g, y: stripY, w: third, h: stripH, slot: 1, rot: 0, frame: 'plain' },
          { x: g * 2 + third, y: stripY, w: third, h: stripH, slot: 2, rot: 0, frame: 'plain' },
          { x: g * 3 + third * 2, y: stripY, w: third, h: stripH, slot: 3, rot: 0, frame: 'plain' },
        ],
        title: { x: g, y: Math.round(H * 0.56), w: W - g * 2, h: Math.round(H * 0.15), align: 'left' },
        badge: { x: g, y: g }, heat: { x: W - g, y: g },
      };
    }
    case 'comic-nine': {
      const cellW = (W - g * 4) / 3;
      const cellH = (H - g * 4) / 3;
      const panels = [];
      let slot = 0;
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          if (r === 1 && c === 1) continue; // centre cell is the title block
          panels.push({
            x: g + c * (cellW + g), y: g + r * (cellH + g),
            w: cellW, h: cellH, slot: slot++ % 4, rot: 0, frame: 'plain',
          });
        }
      }
      return {
        panels,
        title: {
          x: g + (cellW + g), y: g + (cellH + g),
          w: cellW, h: cellH, align: 'center', block: true,
        },
        badge: { x: g, y: g }, heat: { x: W - g, y: g },
      };
    }
    case 'sunset-duo': {
      return {
        panels: [
          { x: g, y: Math.round(H * 0.15), w: half, h: Math.round(H * 0.83), slot: 0, rot: 0, frame: 'plain' },
          { x: g * 2 + half, y: Math.round(H * 0.15), w: half, h: Math.round(H * 0.83), slot: 1, rot: 0, frame: 'plain' },
        ],
        title: { x: g, y: Math.round(H * 0.015), w: W - g * 2, h: Math.round(H * 0.115), align: 'center' },
        badge: { x: g, y: Math.round(H * 0.15) }, heat: { x: W - g, y: Math.round(H * 0.15) },
      };
    }
    case 'vice-grid':
    default: {
      const topH = Math.round(H * 0.345);
      const row2Y = g + topH + g;
      return {
        panels: [
          { x: g, y: g, w: half, h: topH, slot: 0, rot: 0, frame: 'plain' },
          { x: g * 2 + half, y: g, w: half, h: topH, slot: 1, rot: 0, frame: 'plain' },
          { x: g, y: row2Y, w: half, h: topH, slot: 2, rot: 0, frame: 'plain' },
          { x: g * 2 + half, y: row2Y, w: half, h: topH, slot: 3, rot: 0, frame: 'plain' },
        ],
        title: { x: g, y: Math.round(H * 0.735), w: W - g * 2, h: Math.round(H * 0.24), align: 'left' },
        badge: { x: g, y: g }, heat: { x: W - g, y: g },
      };
    }
  }
}

// Draw one photo into a panel rect with cover-fit, zoom and a clamped pan.
// cx/cy (0..1) is the point of the photo shown at the panel centre.
function drawPhotoInto(ctx, img, panel, photo) {
  const { x, y, w, h } = panel;
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const zoom = Math.max(1, photo?.zoom || 1);
  const base = Math.max(w / iw, h / ih);
  const s = base * zoom;
  const dw = iw * s;
  const dh = ih * s;
  const cx = photo?.cx ?? 0.5;
  const cy = photo?.cy ?? 0.5;
  let dx = x + w / 2 - cx * dw;
  let dy = y + h / 2 - cy * dh;
  dx = Math.min(x, Math.max(x + w - dw, dx));
  dy = Math.min(y, Math.max(y + h - dh, dy));
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

// Placeholder panel when a slot is empty: a little painted sunset.
function drawEmptyPanel(ctx, panel, grade) {
  const { x, y, w, h } = panel;
  const sky = ctx.createLinearGradient(x, y, x, y + h);
  sky.addColorStop(0, grade.sky[0]);
  sky.addColorStop(0.55, grade.sky[1]);
  sky.addColorStop(1, grade.sky[2]);
  ctx.fillStyle = sky;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  const r = Math.min(w, h) * 0.16;
  ctx.beginPath();
  ctx.arc(x + w / 2, y + h * 0.42, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(x, y + h * 0.62, w, h * 0.03);
  ctx.fillRect(x, y + h * 0.72, w, h * 0.03);
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.font = `700 ${Math.max(12, Math.round(w * 0.045))}px Anton, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('ADD A PHOTO', x + w / 2, y + h * 0.88);
}

function drawStar(ctx, cx, cy, r, fill) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * 0.45;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const px = cx + Math.cos(a) * rad;
    const py = cy + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.45)';
  ctx.lineWidth = Math.max(1, r * 0.08);
  ctx.stroke();
}

function fitFont(ctx, text, maxWidth, startPx, family, weight = 400) {
  let px = startPx;
  ctx.font = `${weight} ${px}px ${family}`;
  while (px > 10 && ctx.measureText(text).width > maxWidth) {
    px -= 2;
    ctx.font = `${weight} ${px}px ${family}`;
  }
  return px;
}

// The main entry: paint a full cover on ctx at W x H.
// state: {layout, grade, title, subtitle, tagline, heat}
// images: array of HTMLImageElement | null, one per photo slot.
// photos: array of {zoom, cx, cy} transforms, one per slot.
export function drawCover(ctx, W, H, state, images, photos) {
  const grade = gradeById(state.grade);
  const geo = layoutGeometry(state.layout, W, H);
  const u = W / 1080; // scale unit, so lettering scales with the export size

  // Sky background.
  const sky = ctx.createLinearGradient(0, 0, W * 0.25, H);
  grade.sky.forEach((c, i) => sky.addColorStop(i / (grade.sky.length - 1), c));
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);
  // Sun disc low on the sky, behind the panels.
  ctx.fillStyle = 'rgba(255, 246, 201, 0.9)';
  ctx.beginPath();
  ctx.arc(W * 0.78, H * 0.30, Math.min(W, H) * 0.11, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 246, 201, 0.35)';
  ctx.beginPath();
  ctx.arc(W * 0.78, H * 0.30, Math.min(W, H) * 0.16, 0, Math.PI * 2);
  ctx.fill();

  // Panels.
  const frameW = Math.max(3, Math.round(6 * u));
  for (const panel of geo.panels) {
    ctx.save();
    if (panel.rot) {
      ctx.translate(panel.x + panel.w / 2, panel.y + panel.h / 2);
      ctx.rotate((panel.rot * Math.PI) / 180);
      ctx.translate(-panel.w / 2, -panel.h / 2);
    } else {
      ctx.translate(panel.x, panel.y);
    }
    const px = panel.rot ? 0 : 0;
    const py = 0;
    const pw = panel.w;
    const ph = panel.h;
    ctx.shadowColor = 'rgba(0,0,0,0.45)';
    ctx.shadowBlur = 18 * u;
    ctx.shadowOffsetY = 6 * u;
    ctx.fillStyle = '#fff';
    if (panel.frame === 'polaroid') {
      const pad = Math.round(10 * u);
      const foot = Math.round(46 * u);
      ctx.fillRect(px - pad, py - pad, pw + pad * 2, ph + pad + foot);
      ctx.shadowColor = 'transparent';
      const img = images[panel.slot];
      const photo = photos[panel.slot];
      if (img) drawPhotoInto(ctx, img, { x: px, y: py, w: pw, h: ph }, photo);
      else drawEmptyPanel(ctx, { x: px, y: py, w: pw, h: ph }, grade);
      ctx.restore();
      continue;
    }
    ctx.fillRect(px - frameW / 2, py - frameW / 2, pw + frameW, ph + frameW);
    ctx.shadowColor = 'transparent';
    const img = images[panel.slot];
    const photo = photos[panel.slot];
    if (img) drawPhotoInto(ctx, img, { x: px, y: py, w: pw, h: ph }, photo);
    else drawEmptyPanel(ctx, { x: px, y: py, w: pw, h: ph }, grade);
    // Warm wash inside each panel for the grade.
    ctx.fillStyle = grade.wash;
    ctx.fillRect(px, py, pw, ph);
    ctx.restore();
  }

  // Grade wash + warm tint over the whole cover.
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  const wash = ctx.createLinearGradient(0, 0, 0, H);
  wash.addColorStop(0, grade.sky[1]);
  wash.addColorStop(1, grade.sky[2]);
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
  ctx.fillStyle = grade.tint;
  ctx.fillRect(0, 0, W, H);

  // Title band: dark band + halftone dots.
  const t = geo.title;
  if (!t.block) {
    ctx.fillStyle = grade.band;
    ctx.fillRect(t.x, t.y, t.w, t.h);
    ctx.save();
    ctx.beginPath();
    ctx.rect(t.x, t.y, t.w, t.h);
    ctx.clip();
    const step = Math.max(10, Math.round(16 * u));
    ctx.fillStyle = grade.accent;
    for (let yy = t.y + step / 2; yy < t.y + t.h; yy += step) {
      const row = Math.floor((yy - t.y) / step);
      for (let xx = t.x + step / 2 + (row % 2 ? step / 2 : 0); xx < t.x + t.w; xx += step) {
        const r = (step / 2.4) * (0.35 + 0.65 * ((yy - t.y) / t.h));
        ctx.globalAlpha = 0.10 + 0.16 * ((yy - t.y) / t.h);
        ctx.beginPath();
        ctx.arc(xx, yy, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  // Title lettering: Anton, uppercase, sunset gradient, dark outline.
  const titleText = (state.title || 'VICE COAST').toUpperCase();
  const titlePx = fitFont(ctx, titleText, t.w * (t.block ? 0.92 : 0.96), Math.round(t.h * (t.block ? 0.42 : 0.46)), 'Anton, sans-serif');
  const grad = ctx.createLinearGradient(t.x, t.y, t.x + t.w, t.y + t.h * 0.4);
  grade.title.forEach((c, i) => grad.addColorStop(i / (grade.title.length - 1), c));
  ctx.font = `${titlePx}px Anton, sans-serif`;
  try { ctx.letterSpacing = `${Math.round(2 * u)}px`; } catch { /* older canvas */ }
  ctx.textBaseline = 'middle';
  ctx.textAlign = t.align === 'center' ? 'center' : 'left';
  const tx = t.align === 'center' ? t.x + t.w / 2 : t.x + Math.round(10 * u);
  const ty = t.y + t.h * (t.block ? 0.34 : 0.38);
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(10, 2, 24, 0.9)';
  ctx.lineWidth = Math.max(2, Math.round(titlePx * 0.09));
  ctx.strokeText(titleText, tx, ty);
  ctx.fillStyle = grad;
  ctx.fillText(titleText, tx, ty);
  try { ctx.letterSpacing = '0px'; } catch { /* ignore */ }

  // Subtitle in neon Pacifico script with a glow.
  const sub = state.subtitle || '';
  if (sub) {
    const subPx = fitFont(ctx, sub, t.w * 0.94, Math.round(t.h * 0.18), 'Pacifico, cursive');
    ctx.font = `${subPx}px Pacifico, cursive`;
    ctx.shadowColor = grade.glow;
    ctx.shadowBlur = Math.round(18 * u);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(sub, tx, t.y + t.h * (t.block ? 0.68 : 0.68));
    ctx.shadowBlur = 0;
  }

  // Tagline in small tracked caps.
  const tag = state.tagline || '';
  if (tag && !t.block) {
    const tagPx = Math.max(11, Math.round(t.h * 0.11));
    ctx.font = `700 ${tagPx}px Anton, sans-serif`;
    try { ctx.letterSpacing = `${Math.round(6 * u)}px`; } catch { /* ignore */ }
    ctx.fillStyle = grade.accent;
    ctx.fillText(tag.toUpperCase(), tx, t.y + t.h * 0.92);
    try { ctx.letterSpacing = '0px'; } catch { /* ignore */ }
  }

  // Badge ribbon: "VICE COAST" pill, top corner.
  const b = geo.badge;
  ctx.font = `700 ${Math.max(12, Math.round(20 * u))}px Anton, sans-serif`;
  const badgeText = '★ VICE COAST ★';
  const bw = ctx.measureText(badgeText).width + Math.round(28 * u);
  const bh = Math.round(34 * u);
  ctx.fillStyle = 'rgba(8, 2, 20, 0.82)';
  ctx.fillRect(b.x, b.y, bw, bh);
  ctx.strokeStyle = grade.accent;
  ctx.lineWidth = Math.max(2, Math.round(2 * u));
  ctx.strokeRect(b.x, b.y, bw, bh);
  ctx.fillStyle = grade.accent;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(badgeText, b.x + Math.round(14 * u), b.y + bh / 2 + 1);

  // Heat meter: five stars + HEAT label on a dark pill, right-aligned inside
  // the canvas (never clipped at the edge, readable over any photo).
  const hp = geo.heat;
  const starR = Math.max(9, Math.round(13 * u));
  const gap = starR * 2.3;
  ctx.font = `700 ${Math.max(10, Math.round(14 * u))}px Anton, sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const labelW = ctx.measureText('HEAT').width;
  const padX = Math.round(12 * u);
  const meterW = padX * 2 + labelW + Math.round(10 * u) + gap * 4 + starR * 2;
  const meterH = bh;
  const mx = hp.x - meterW;
  const my = hp.y;
  ctx.fillStyle = 'rgba(8, 2, 20, 0.82)';
  ctx.fillRect(mx, my, meterW, meterH);
  ctx.strokeStyle = grade.accent;
  ctx.lineWidth = Math.max(2, Math.round(2 * u));
  ctx.strokeRect(mx, my, meterW, meterH);
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.fillText('HEAT', mx + padX, my + meterH / 2 + 1);
  const firstStarCx = mx + padX + labelW + Math.round(10 * u) + starR;
  for (let i = 0; i < 5; i++) {
    drawStar(ctx, firstStarCx + gap * i, my + meterH / 2, starR, i < (state.heat || 4) ? '#ffcf3f' : 'rgba(255,255,255,0.22)');
  }

  // Grain + vignette.
  const tile = getGrainTile();
  const pattern = ctx.createPattern(tile, 'repeat');
  ctx.save();
  ctx.globalAlpha = 0.08;
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
  const vig = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.75);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.38)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);
}

// Render a cover to a fresh canvas at W x H and return it.
export function renderCoverCanvas(W, H, state, images, photos) {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  drawCover(canvas.getContext('2d'), W, H, state, images, photos);
  return canvas;
}
