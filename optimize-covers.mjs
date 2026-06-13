// Make a light WebP version of every card cover (≤768px, q72) so the loader
// downloads ~1.2MB instead of ~2.7MB of full-res JPEGs. The card textures
// are only 512–1024px anyway, so there's no visible quality loss.
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const WORK = path.resolve('./public/work');
const { PROJECTS } = await import('./src/projects.js');

const covers = [...new Set(PROJECTS.map((p) => p.cover.replace('/work/', '')))];
let made = 0, before = 0, after = 0;
for (const f of covers) {
  const src = path.join(WORK, f);
  if (!fs.existsSync(src)) continue;
  const out = path.join(WORK, f.replace(/\.(jpg|jpeg|png)$/i, '.opt.webp'));
  before += fs.statSync(src).size;
  try {
    execSync(`ffmpeg -y -i "${src}" -vf "scale='min(768,iw)':-2" -q:v 72 "${out}" -loglevel error`);
    after += fs.statSync(out).size;
    made++;
  } catch { console.log('failed:', f); }
}
console.log(`opt covers: ${made} | ${Math.round(before / 1024)}KB -> ${Math.round(after / 1024)}KB`);
