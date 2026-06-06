# DONISHYAR® — 3D Portfolio

Interactive 3D portfolio of **Ahmad Shah Donishyar** — multidisciplinary graphic designer (identities, campaigns, motion, 3D) based in Kabul.

The gallery is an endless grid of real client work wrapped around the viewer on the inside of a sphere — drag in any direction and it scrolls forever, always upright. Built with **Three.js** + **GSAP** + **Vite**, no framework.

## Features

- Infinite wrapped-grid gallery (13 × 4 cells, seamless in both axes)
- Live video previews on hover, playing directly on the 3D cards
- Cell-grid seam lines + blue hover glow
- Azimuth compass with per-project category-colored notches
- Custom cursor, inertial drag with lenis-style easing, velocity roll
- Project pages with full media galleries (images + videos at native aspect)
- List view, category filter, synthesized ambient sound, live city clocks
- Blue × black theme with parallax starfield

## Run

```bash
npm install
npm run dev     # http://localhost:5173
npm run build   # production build in dist/
```

## Content pipeline

All portfolio media is curated from my Telegram channel ([t.me/donishyarportfolio](https://t.me/donishyarportfolio)):

```bash
node scrape-tg.mjs          # download posts/photos/videos
node extract-frames.mjs     # ffmpeg poster frames from videos
node build-groups.mjs       # group posts into curation units
# (curation pass produces curation-result.json)
node generate-projects.mjs  # writes src/projects.js
node compress-videos.mjs    # re-encode videos for web
```

© 2018–2026 Ahmad Shah Donishyar. All artwork belongs to its respective clients.
