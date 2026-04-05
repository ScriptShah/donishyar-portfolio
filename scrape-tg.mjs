// Scrape the public Telegram channel web preview (t.me/s/<channel>)
// Collects photos, video sources/thumbs and captions across all pages,
// downloads assets into public/work/, writes tg-manifest.json
import fs from 'node:fs';
import path from 'node:path';

const CHANNEL = 'donishyarportfolio';
const OUT_DIR = path.resolve('./public/work');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36';

fs.mkdirSync(OUT_DIR, { recursive: true });

async function fetchPage(before) {
  const url = `https://t.me/s/${CHANNEL}` + (before ? `?before=${before}` : '');
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`${res.status} for ${url}`);
  return await res.text();
}

function decodeEntities(s) {
  return s
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&nbsp;/g, ' ')
    .trim();
}

function parsePosts(html) {
  const posts = [];
  // split on message wrappers
  const chunks = html.split('class="tgme_widget_message_wrap').slice(1);
  for (const chunk of chunks) {
    const idM = chunk.match(/data-post="[^"]*\/(\d+)"/);
    if (!idM) continue;
    const id = +idM[1];
    const dateM = chunk.match(/<time datetime="([^"]+)"/);
    const photos = [...chunk.matchAll(/tgme_widget_message_photo_wrap[^"]*"[^>]*style="[^"]*background-image:url\('([^']+)'\)/g)].map(m => m[1]);
    const videoSrcs = [...chunk.matchAll(/<video[^>]+src="([^"]+)"/g)].map(m => m[1]);
    const videoThumbs = [...chunk.matchAll(/tgme_widget_message_video_thumb[^"]*"[^>]*style="[^"]*background-image:url\('([^']+)'\)/g)].map(m => m[1]);
    const roundThumbs = [...chunk.matchAll(/tgme_widget_message_roundvideo_thumb[^"]*"[^>]*style="[^"]*background-image:url\('([^']+)'\)/g)].map(m => m[1]);
    const durM = chunk.match(/tgme_widget_message_video_duration[^>]*>([^<]+)</);
    const textM = chunk.match(/tgme_widget_message_text[^>]*>([\s\S]*?)<\/div>/);
    posts.push({
      id,
      date: dateM ? dateM[1] : null,
      photos,
      videoSrcs,
      videoThumbs: [...videoThumbs, ...roundThumbs],
      duration: durM ? durM[1].trim() : null,
      caption: textM ? decodeEntities(textM[1]) : '',
    });
  }
  return posts;
}

async function download(url, file) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) { console.log('  !! failed', res.status, url.slice(0, 80)); return false; }
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(file, buf);
  return buf.length;
}

const all = new Map();
let before = null;
for (let page = 0; page < 30; page++) {
  const html = await fetchPage(before);
  const posts = parsePosts(html);
  if (!posts.length) break;
  let added = 0;
  for (const p of posts) if (!all.has(p.id)) { all.set(p.id, p); added++; }
  const minId = Math.min(...posts.map(p => p.id));
  console.log(`page ${page}: ${posts.length} posts (new ${added}), minId ${minId}`);
  if (!added || minId <= 2) break;
  before = minId;
  await new Promise(r => setTimeout(r, 400));
}

const posts = [...all.values()].sort((a, b) => a.id - b.id);
console.log(`TOTAL posts: ${posts.length}`);

// download assets
const manifest = [];
for (const p of posts) {
  const entry = { ...p, files: [] };
  let i = 0;
  for (const u of p.photos) {
    const f = `post${p.id}_photo${i++}.jpg`;
    const size = await download(u, path.join(OUT_DIR, f));
    if (size) entry.files.push({ file: f, kind: 'photo', bytes: size });
  }
  i = 0;
  for (const u of p.videoThumbs) {
    const f = `post${p.id}_vthumb${i++}.jpg`;
    const size = await download(u, path.join(OUT_DIR, f));
    if (size) entry.files.push({ file: f, kind: 'videoThumb', bytes: size });
  }
  i = 0;
  for (const u of p.videoSrcs) {
    const f = `post${p.id}_video${i++}.mp4`;
    const size = await download(u, path.join(OUT_DIR, f));
    if (size) entry.files.push({ file: f, kind: 'video', bytes: size });
  }
  manifest.push(entry);
  if (entry.files.length) console.log(`post ${p.id}: ${entry.files.map(f => f.file + ' (' + Math.round(f.bytes / 1024) + 'kb)').join(', ')} | ${p.caption.slice(0, 60)}`);
}

fs.writeFileSync('./tg-manifest.json', JSON.stringify(manifest, null, 2));
console.log('manifest written');
