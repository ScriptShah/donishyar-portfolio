// Re-encode all portfolio videos for web: H.264 CRF 27, max 1280px wide,
// faststart. Same filenames (no code changes); originals are preserved in
// work-archive/originals/. Keeps whichever file is smaller.
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const WORK = path.resolve('./public/work');
const ORIG = path.resolve('./work-archive/originals');
fs.mkdirSync(ORIG, { recursive: true });

const vids = fs.readdirSync(WORK).filter((f) => f.endsWith('.mp4'));
let before = 0, after = 0, redone = 0, kept = 0;

for (const f of vids) {
  const src = path.join(WORK, f);
  const tmp = path.join(WORK, f.replace('.mp4', '.tmp.mp4'));
  const inSize = fs.statSync(src).size;
  before += inSize;
  // resumable: if the original is already archived, this file is done
  if (fs.existsSync(path.join(ORIG, f))) { after += inSize; continue; }
  try {
    execSync(
      `ffmpeg -y -i "${src}" -c:v libx264 -crf 27 -preset medium -vf "scale='min(1280,iw)':-2" -movflags +faststart -c:a aac -b:a 96k "${tmp}" -loglevel error`,
      { stdio: ['ignore', 'ignore', 'inherit'] }
    );
    const outSize = fs.statSync(tmp).size;
    if (outSize < inSize * 0.92) {
      fs.copyFileSync(src, path.join(ORIG, f)); // preserve original
      fs.rmSync(src);
      fs.renameSync(tmp, src);
      after += outSize;
      redone++;
      console.log(`${f}: ${(inSize / 1048576).toFixed(1)}MB -> ${(outSize / 1048576).toFixed(1)}MB`);
    } else {
      fs.rmSync(tmp); // not worth it, keep original
      after += inSize;
      kept++;
    }
  } catch (e) {
    if (fs.existsSync(tmp)) fs.rmSync(tmp);
    after += inSize;
    kept++;
    console.log(`${f}: ffmpeg failed, kept original`);
  }
}
console.log(`DONE. videos: ${vids.length}, re-encoded: ${redone}, kept: ${kept}`);
console.log(`total: ${(before / 1048576).toFixed(0)}MB -> ${(after / 1048576).toFixed(0)}MB`);
