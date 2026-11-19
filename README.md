# Vice Coast Cover Studio

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Kiowayyy2109/makefun-gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Kiowayyy2109/makefun-gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

An offline web app that turns any photo + caption into GTA-style multi-panel
poster cover art — Vice City sunset and neon grades, bold Anton lettering with a
neon Pacifico subtitle — and exports it as a PNG to share.

Built for the make.fun competition
[**Make GTA 6 Cover Art**](https://make.fun/c/gta6-cover-art-01)
(`gta6-cover-art-01`, $250, top 50 paid). Entry title: **Vice Coast Cover Studio**.
Repository: https://github.com/Kiowayyy2109/makefun-gta6-cover-art-01

## What it does

- **6 multi-panel layouts** — Vice Grid, Hero + Trio, Tilted Snapshots (polaroids),
  Full Bleed + Strip, Comic Nine, Sunset Duo.
- **5 colour grades** — Vice Sunset, Neon Nights, Gold Hour, Midnight Vice, Noir Pink.
- **Any photo** — upload up to 4 photos from your machine (nothing is uploaded
  anywhere), one photo can fill several panels; drag to pan and scroll to zoom
  each panel, with the pan clamped so the photo always covers its panel.
- **Editable caption** — bold Anton title, neon Pacifico subtitle, tagline,
  halftone title band, a ★ VICE COAST ★ badge and a 5-star heat meter.
- **Fast export** — one click exports a PNG in **1080 × 1080**, **1080 × 1350** or
  **1920 × 1080**, or all three at once.
- **Undo / redo** for every change (Ctrl+Z / Ctrl+Y).
- **Fully offline** — static files under `app/`, no network request. Fonts
  (Anton, Pacifico) are vendored under the SIL Open Font License; sample photos
  are the kit's, made with an image model and free to use.

No Rockstar Games logo, artwork or font is used anywhere.

## Try it

```sh
node serve.ts
# open http://localhost:8080
```

Pick a layout and a grade, load photos (or keep the samples), edit the caption,
drag a panel to reposition its photo, then **Export PNG**.

## Hand in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` (Node 22) copies `app/` and `screenshots/` to `/output` and writes
`/output/dossier.json` with the vendored `vendor/makefun-app.ts`.

## Files

- `main.ts` — entry program (Node 22, standard library only)
- `serve.ts` — tiny static server for local testing
- `app/index.html`, `app/style.css` — the editor page
- `app/src/cover.js` — the cover renderer (layouts, grades, lettering, grain)
- `app/src/main.js` — the editor (photos, drag/zoom, undo/redo, export)
- `app/src/shots.js` — screenshot scenes (`?shot=cover`, `?shot=editor`) and the
  headless export probe (`?probe=export`)
- `app/fonts/` — Anton + Pacifico (OFL, texts beside them)
- `app/samples/` — boulevard.jpg, pier.jpg (kit samples)
- `screenshots/` — 3–4 screenshots taken from this app

## License

MIT — see [LICENSE](LICENSE). SPDX-License-Identifier: MIT.

---

*Built by [@kiowayyy](https://make.fun/) for Panji — referral code `8b9bbsfs`.*
