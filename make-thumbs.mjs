// Re-extract HQ card covers for projects whose cover is a video frame:
// from the ORIGINAL (pre-compression) video when available, using ffmpeg's
// representative-frame selection at up to 1600px / q2 — sharper and better
// composed than the quick fixed-timestamp frames.
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const WORK = './public/work';
const ORIG = './work-archive/originals';
const { PROJECTS } = await import('./src/projects.js');

let made = 0;
for (const p of PROJECTS) {
  const m = (p.cover || '').match(/post(\d+)_frame(\d+)\.jpg$/);
  if (!m) continue; // photo covers keep their source quality
  const video = `post${m[1]}_video${m[2]}.mp4`;
  const src = fs.existsSync(path.join(ORIG, video)) ? path.join(ORIG, video) : path.join(WORK, video);
  if (!fs.existsSync(src)) { console.log('no video for', p.id); continue; }
  const out = path.join(WORK, `post${m[1]}_cover${m[2]}.jpg`);
  try {
    // seek past intros, then let the thumbnail filter pick the most
    // representative (non-blurred, non-transition) frame of the next ~60
    execSync(
      `ffmpeg -y -ss 1 -i "${src}" -vf "thumbnail=60,scale='min(1600,iw)':-2" -frames:v 1 -q:v 2 "${out}" -loglevel error`
    );
    console.log(p.id, '->', path.basename(out), Math.round(fs.statSync(out).size / 1024) + 'kb');
    made++;
  } catch { console.log('ffmpeg failed for', p.id); }
}
console.log('HQ covers:', made);
