// Compact the raw tg-manifest into curation groups: one group per post
// that has usable visual material. Junk thumbs (<4kb) are dropped when a
// better source (photo / extracted frame) exists.
import fs from 'node:fs';
import path from 'node:path';

const WORK = path.resolve('./public/work');
const manifest = JSON.parse(fs.readFileSync('./tg-manifest.json', 'utf8'));

const groups = [];
for (const post of manifest) {
  const photos = post.files.filter((f) => f.kind === 'photo').map((f) => f.file);
  const videos = post.files.filter((f) => f.kind === 'video').map((f) => f.file);
  const frames = videos
    .map((v, i) => `post${post.id}_frame${i}.jpg`)
    .filter((f) => fs.existsSync(path.join(WORK, f)));
  const goodThumbs = post.files
    .filter((f) => f.kind === 'videoThumb' && f.bytes > 6000)
    .map((f) => f.file);

  const stills = [...photos, ...frames, ...goodThumbs];
  if (!stills.length) continue;

  groups.push({
    post: post.id,
    date: post.date ? post.date.slice(0, 10) : null,
    caption: post.caption || '',
    photos,
    frames,
    thumbs: goodThumbs,
    videos,
  });
}

fs.writeFileSync('./tg-groups.json', JSON.stringify(groups, null, 2));
console.log('groups:', groups.length);
console.log('with photos:', groups.filter((g) => g.photos.length).length);
console.log('with videos:', groups.filter((g) => g.videos.length).length);
console.log('total stills:', groups.reduce((s, g) => s + g.photos.length + g.frames.length, 0));
