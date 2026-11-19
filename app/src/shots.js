// Fixed scenes for screenshots: ?shot=cover shows the exported cover alone,
// ?shot=editor shows the editor with sample photos loaded. Query params:
//   layout, grade, size (square|portrait|wide), photo, photo2,
//   title, subtitle, tagline. window.__shotReady is set once painted.

export async function runShot(shot, query, api) {
  const layout = query.get('layout') ?? 'grid';
  const grade = query.get('grade') ?? 'sunset';
  const size = query.get('size') ?? (shot === 'cover' ? 'wide' : 'square');
  const title = query.get('title') ?? 'VICE COAST';
  const subtitle = query.get('subtitle') ?? 'Neon Nights';
  const tagline = query.get('tagline') ?? 'VICE CITY  •  EST. 2026';
  const photoA = query.get('photo') ?? 'boulevard';
  const photoB = query.get('photo2') ?? 'pier';

  if (shot === 'cover') document.body.classList.add('shot-cover');
  api.setSize(size);
  // A and B samples fill the panels in turn, so every panel shows a photo.
  await api.loadSample(0, photoA);
  await api.loadSample(1, photoB);
  await api.loadSample(2, photoA);
  await api.loadSample(3, photoB);
  api.setState({
    layout, grade, title, subtitle, tagline,
    // Both samples carry the face in the upper part of the frame, so the
    // panels are panned down (positive dy) to keep faces in the crop.
    // ?dy0 / ?dy1 override the pan per photo slot for a given scene.
    panels: [
      { photo: 0, zoom: 1.02, dx: 0, dy: Number(query.get('dy0') ?? 0.26) },
      { photo: 1, zoom: 1.02, dx: 0.03, dy: Number(query.get('dy1') ?? 0.18) },
      { photo: 1, zoom: 1.05, dx: -0.02, dy: Number(query.get('dy1') ?? 0.18) },
      { photo: 0, zoom: 1.02, dx: 0, dy: Number(query.get('dy0') ?? 0.26) },
      { photo: 1, zoom: 1.05, dx: 0, dy: Number(query.get('dy1') ?? 0.18) },
      { photo: 0, zoom: 1.02, dx: 0.04, dy: Number(query.get('dy0') ?? 0.26) },
      { photo: 1, zoom: 1.02, dx: 0, dy: Number(query.get('dy1') ?? 0.18) },
      { photo: 0, zoom: 1.05, dx: 0, dy: Number(query.get('dy0') ?? 0.26) },
      { photo: 1, zoom: 1.02, dx: -0.03, dy: Number(query.get('dy1') ?? 0.18) },
    ],
  });
  api.redraw();
  // Let the display fonts arrive, then repaint once with them.
  if (document.fonts) {
    try {
      await Promise.race([
        Promise.all([document.fonts.load('40px Anton'), document.fonts.load('20px Pacifico')]),
        new Promise((r) => setTimeout(r, 2500)),
      ]);
    } catch { /* fall back to system fonts */ }
    api.redraw();
  }
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
