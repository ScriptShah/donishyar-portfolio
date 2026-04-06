// Extract a clean still frame from each downloaded video via ffmpeg,
// for use as card artwork (Telegram's thumbs are tiny/blurry).
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const WORK = path.resolve('./public/work');
const manifest = JSON.parse(fs.readFileSync('./tg-manifest.json', 'utf8'));

for (const post of manifest) {
  const videos = post.files.filter((f) => f.kind === 'video');
  videos.forEach((v, i) => {
    const src = path.join(WORK, v.file);
    const out = path.join(WORK, `post${post.id}_frame${i}.jpg`);
    if (fs.existsSync(out) || !fs.existsSync(src)) return;
    try {
      // seek 1.5s in (skip fade-ins), best-quality single frame, max 1280w
      execSync(`ffmpeg -y -ss 1.5 -i "${src}" -frames:v 1 -q:v 3 -vf "scale='min(1280,iw)':-2" "${out}" -loglevel error`);
      console.log('frame:', path.basename(out));
    } catch (e) {
      console.log('skip (ffmpeg error):', v.file);
    }
  });
}
console.log('done');
