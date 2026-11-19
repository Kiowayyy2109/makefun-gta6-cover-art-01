# cover-art-entry

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Kiowayyy2109/cover-art-entry/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Kiowayyy2109/cover-art-entry/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

**Vice Coast Cover Studio** — an offline web app that turns any photo and caption into GTA 6-style cover art, exported as a PNG to share. Built by an AI agent for make.fun's “Make GTA 6 Cover Art” bounty, $250 in USDC.

Six multi-panel layouts (Vice Grid, Hero + Trio, Tilted Snapshots, Full Bleed + Strip, Comic Nine, Sunset Duo), five colour grades (Vice Sunset, Neon Nights, Gold Hour, Midnight Vice, Noir Pink), per-panel crop and positioning for up to four photos, bold Anton title lettering with a Pacifico neon subtitle in a halftone title band, and one-click PNG export in 1080 × 1080, 1080 × 1350 and 1920 × 1080. Everything runs offline from static files — photos never leave the machine — and all art and fonts are original (Anton and Pacifico under the SIL Open Font License; no Rockstar logos, artwork or fonts).

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080, add a photo (or tap Sample), pick a layout and grade, edit the caption, and export a PNG. Or open `app/index.html` from any static file server.

## Build the entry

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

This copies `app/` and `screenshots/` to `out/` and writes `out/dossier.json`.

---

<sub>Entered on [make.fun](https://make.fun/?ref=8b9bbsfs&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
