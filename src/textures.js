/* ============================================================
   Procedural poster artwork + card label composition
   Every card texture is generated at runtime on <canvas>.
   ============================================================ */

export function mulberry32(seed) {
  let a = seed | 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashCode(s) {
  let h = 9;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 387420489);
  return h ^ (h >>> 9);
}

export const PALETTES = [
  { bg: '#0e0e10', fg: '#f1ede4', ac: '#ff4d00' }, // 0 ink / orange
  { bg: '#e9e5db', fg: '#161616', ac: '#2742ff' }, // 1 paper / blue
  { bg: '#ff4d00', fg: '#140d0a', ac: '#ffe8d6' }, // 2 orange field
  { bg: '#101012', fg: '#ececec', ac: '#c9ff3d' }, // 3 acid
  { bg: '#17112e', fg: '#ece6ff', ac: '#7a5cff' }, // 4 violet
  { bg: '#0c2b22', fg: '#e9f4ec', ac: '#ffd23e' }, // 5 forest / gold
  { bg: '#efddd2', fg: '#20100b', ac: '#b3331d' }, // 6 blush / oxide
  { bg: '#14249f', fg: '#eef0ff', ac: '#ff7a1a' }, // 7 cobalt
  { bg: '#161616', fg: '#f5f5f5', ac: '#9b9b9b' }, // 8 mono
  { bg: '#9e1316', fg: '#fff3e2', ac: '#ffd23e' }, // 9 cola red
];

const MONO = '"Space Mono", monospace';
const SANS = '"Space Grotesk", sans-serif';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
  else ctx.rect(x, y, w, h);
}

function grain(ctx, w, h, rnd, alpha = 0.05) {
  const t = document.createElement('canvas');
  t.width = t.height = 96;
  const tc = t.getContext('2d');
  const img = tc.createImageData(96, 96);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = rnd() * 255;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  tc.putImageData(img, 0, 0);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = ctx.createPattern(t, 'repeat');
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

function microMeta(ctx, w, h, P, p, rnd) {
  ctx.font = `400 ${Math.round(w * 0.018)}px ${MONO}`;
  ctx.fillStyle = P.fg;
  ctx.globalAlpha = 0.7;
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.fillText(`N°${String(Math.floor(rnd() * 89) + 10)}`, w * 0.045, h * 0.058);
  ctx.textAlign = 'right';
  ctx.fillText(p.year, w * 0.955, h * 0.058);
  ctx.globalAlpha = 1;
}

/* ---------------- archetype painters ---------------- */

const painters = {
  typePoster(ctx, w, h, rnd, P, p) {
    ctx.fillStyle = P.bg;
    ctx.fillRect(0, 0, w, h);
    const words = p.title.toUpperCase().split(' ');
    const size = w * (words.length > 2 ? 0.19 : 0.225);
    ctx.font = `700 ${size}px ${SANS}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    let y = h * 0.3;
    words.forEach((word, i) => {
      ctx.fillStyle = i === words.length - 1 ? P.ac : P.fg;
      let s = size;
      while (ctx.measureText(word).width > w * 0.9 && s > 10) {
        s -= 4;
        ctx.font = `700 ${s}px ${SANS}`;
      }
      ctx.fillText(word, w * 0.05, y);
      y += s * 0.98;
      ctx.font = `700 ${size}px ${SANS}`;
    });
    // big outlined index number
    ctx.strokeStyle = P.fg;
    ctx.lineWidth = Math.max(2, w * 0.004);
    ctx.globalAlpha = 0.5;
    ctx.font = `700 ${w * 0.42}px ${SANS}`;
    ctx.textAlign = 'right';
    ctx.strokeText(p.year.slice(2), w * 0.97, h * 0.95);
    ctx.globalAlpha = 1;
    // rule lines
    ctx.fillStyle = P.fg;
    ctx.globalAlpha = 0.35;
    for (let i = 0; i < 3; i++) ctx.fillRect(w * 0.05, h * (0.62 + i * 0.035), w * 0.34, 2);
    ctx.globalAlpha = 1;
    ctx.fillStyle = P.ac;
    ctx.beginPath();
    ctx.arc(w * 0.08, h * 0.86, w * 0.035, 0, Math.PI * 2);
    ctx.fill();
    microMeta(ctx, w, h, P, p, rnd);
  },

  bauhaus(ctx, w, h, rnd, P, p) {
    ctx.fillStyle = P.bg;
    ctx.fillRect(0, 0, w, h);
    const cols = [P.fg, P.ac, P.fg];
    const n = 6 + Math.floor(rnd() * 3);
    for (let i = 0; i < n; i++) {
      const cx = w * (0.12 + rnd() * 0.76);
      const cy = h * (0.12 + rnd() * 0.7);
      const r = w * (0.08 + rnd() * 0.16);
      const kind = Math.floor(rnd() * 4);
      ctx.fillStyle = cols[Math.floor(rnd() * cols.length)];
      ctx.globalAlpha = 0.92;
      ctx.beginPath();
      if (kind === 0) ctx.arc(cx, cy, r, 0, Math.PI * 2);
      else if (kind === 1) ctx.arc(cx, cy, r, Math.PI * rnd() * 2, Math.PI * (1 + rnd()));
      else if (kind === 2) ctx.rect(cx - r, cy - r * 0.28, r * 2, r * 0.56);
      else {
        ctx.moveTo(cx, cy - r);
        ctx.lineTo(cx + r, cy + r);
        ctx.lineTo(cx - r, cy + r);
      }
      ctx.closePath();
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    // dotted grid corner
    ctx.fillStyle = P.fg;
    for (let gx = 0; gx < 5; gx++)
      for (let gy = 0; gy < 5; gy++) {
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.arc(w * 0.06 + gx * w * 0.028, h * 0.9 - gy * w * 0.028, w * 0.004, 0, Math.PI * 2);
        ctx.fill();
      }
    ctx.globalAlpha = 1;
    ctx.font = `700 ${w * 0.06}px ${SANS}`;
    ctx.fillStyle = P.fg;
    ctx.textAlign = 'left';
    ctx.fillText(p.title.toUpperCase().split(' ')[0], w * 0.05, h * 0.12);
    microMeta(ctx, w, h, P, p, rnd);
  },

  swiss(ctx, w, h, rnd, P, p) {
    ctx.fillStyle = P.bg;
    ctx.fillRect(0, 0, w, h);
    // grid
    ctx.strokeStyle = P.fg;
    ctx.globalAlpha = 0.14;
    ctx.lineWidth = 1;
    for (let i = 1; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo((w / 6) * i, 0);
      ctx.lineTo((w / 6) * i, h);
      ctx.stroke();
    }
    for (let i = 1; i < 8; i++) {
      ctx.beginPath();
      ctx.moveTo(0, (h / 8) * i);
      ctx.lineTo(w, (h / 8) * i);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    // headline
    const words = p.title.toUpperCase().split(' ');
    ctx.fillStyle = P.fg;
    let y = h * 0.22;
    words.slice(0, 3).forEach((word) => {
      let s = w * 0.13;
      ctx.font = `700 ${s}px ${SANS}`;
      while (ctx.measureText(word).width > w * 0.85 && s > 8) {
        s -= 3;
        ctx.font = `700 ${s}px ${SANS}`;
      }
      ctx.textAlign = 'left';
      ctx.fillText(word, w / 6 + 8, y);
      y += s * 1.05;
    });
    // accent block on grid
    ctx.fillStyle = P.ac;
    ctx.fillRect((w / 6) * 3, (h / 8) * 5, (w / 6) * 2, (h / 8) * 2);
    ctx.fillStyle = P.fg;
    ctx.fillRect(w / 6, (h / 8) * 6, w / 6, h / 8);
    // tick marks
    ctx.fillStyle = P.fg;
    for (let i = 0; i < 24; i++) {
      const tall = i % 6 === 0;
      ctx.fillRect(w * 0.08 + i * w * 0.032, h * 0.93, 2, tall ? h * 0.03 : h * 0.016);
    }
    microMeta(ctx, w, h, P, p, rnd);
  },

  orb(ctx, w, h, rnd, P, p) {
    ctx.fillStyle = P.bg;
    ctx.fillRect(0, 0, w, h);
    const cx = w * (0.35 + rnd() * 0.3);
    const cy = h * (0.34 + rnd() * 0.2);
    const r = w * 0.42;
    let g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, P.ac);
    g.addColorStop(0.55, P.ac + '55');
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    g = ctx.createRadialGradient(cx - r * 0.4, cy + r * 0.5, 0, cx - r * 0.4, cy + r * 0.5, r * 0.8);
    g.addColorStop(0, P.fg + '33');
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    // core
    ctx.fillStyle = P.ac;
    ctx.beginPath();
    ctx.arc(cx, cy, w * 0.13, 0, Math.PI * 2);
    ctx.fill();
    // ring + crosshair
    ctx.strokeStyle = P.fg;
    ctx.globalAlpha = 0.6;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, w * 0.24, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, cy);
    ctx.lineTo(w, cy);
    ctx.moveTo(cx, 0);
    ctx.lineTo(cx, h);
    ctx.stroke();
    ctx.globalAlpha = 1;
    // stars
    ctx.fillStyle = P.fg;
    for (let i = 0; i < 40; i++) {
      ctx.globalAlpha = 0.2 + rnd() * 0.6;
      ctx.fillRect(rnd() * w, rnd() * h, 2, 2);
    }
    ctx.globalAlpha = 1;
    ctx.font = `400 ${w * 0.034}px ${MONO}`;
    ctx.fillStyle = P.fg;
    ctx.textAlign = 'center';
    ctx.fillText(p.title.toUpperCase(), cx, h * 0.88);
    microMeta(ctx, w, h, P, p, rnd);
  },

  halftone(ctx, w, h, rnd, P, p) {
    ctx.fillStyle = P.bg;
    ctx.fillRect(0, 0, w, h);
    const cx = w * 0.5;
    const cy = h * 0.42;
    const R = w * 0.38;
    const cell = w * 0.035;
    for (let x = cx - R; x <= cx + R; x += cell)
      for (let y = cy - R; y <= cy + R; y += cell) {
        const d = Math.hypot(x - cx, y - cy);
        if (d > R) continue;
        const k = 1 - d / R;
        ctx.fillStyle = (x + y) % (cell * 4) < cell * 2 ? P.ac : P.fg;
        ctx.beginPath();
        ctx.arc(x, y, (cell / 2) * (0.25 + k * 0.85), 0, Math.PI * 2);
        ctx.fill();
      }
    // slice line
    ctx.fillStyle = P.bg;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-0.5);
    ctx.fillRect(-R * 1.2, -w * 0.012, R * 2.4, w * 0.024);
    ctx.restore();
    ctx.font = `700 ${w * 0.085}px ${SANS}`;
    ctx.fillStyle = P.fg;
    ctx.textAlign = 'center';
    ctx.fillText(p.title.toUpperCase().split(' ')[0], cx, h * 0.92);
    microMeta(ctx, w, h, P, p, rnd);
  },

  specimen(ctx, w, h, rnd, P, p) {
    ctx.fillStyle = P.bg;
    ctx.fillRect(0, 0, w, h);
    const ch = p.title[0].toUpperCase();
    // ghost outline
    ctx.font = `700 ${h * 0.78}px ${SANS}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = P.ac;
    ctx.lineWidth = Math.max(2, w * 0.005);
    ctx.strokeText(ch, w * 0.56, h * 0.52);
    ctx.fillStyle = P.fg;
    ctx.fillText(ch, w * 0.47, h * 0.5);
    // alphabet column
    ctx.font = `400 ${w * 0.028}px ${MONO}`;
    ctx.fillStyle = P.fg;
    ctx.globalAlpha = 0.55;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    const rows = ['ABCDEFGH', 'IJKLMNOP', 'QRSTUVWX', 'YZ&?!§@#', '01234567'];
    rows.forEach((r, i) => ctx.fillText(r.split('').join(' '), w * 0.06, h * (0.78 + i * 0.045)));
    ctx.globalAlpha = 1;
    // baseline marks
    ctx.strokeStyle = P.fg;
    ctx.globalAlpha = 0.3;
    ctx.lineWidth = 1;
    [0.18, 0.5, 0.82].forEach((t) => {
      ctx.beginPath();
      ctx.moveTo(w * 0.05, h * t);
      ctx.lineTo(w * 0.95, h * t);
      ctx.stroke();
    });
    ctx.globalAlpha = 1;
    microMeta(ctx, w, h, P, p, rnd);
  },

  editorial(ctx, w, h, rnd, P, p) {
    ctx.fillStyle = P.bg;
    ctx.fillRect(0, 0, w, h);
    // headline
    ctx.fillStyle = P.fg;
    const words = p.title.toUpperCase().split(' ');
    let y = h * 0.16;
    words.slice(0, 2).forEach((word) => {
      let s = w * 0.15;
      ctx.font = `700 ${s}px ${SANS}`;
      while (ctx.measureText(word).width > w * 0.9 && s > 8) {
        s -= 3;
        ctx.font = `700 ${s}px ${SANS}`;
      }
      ctx.textAlign = 'left';
      ctx.fillText(word, w * 0.06, y);
      y += s * 1.04;
    });
    // image block (gradient)
    const ix = w * 0.06, iy = y - w * 0.04, iw = w * 0.55, ih = h * 0.34;
    const g = ctx.createLinearGradient(ix, iy, ix + iw, iy + ih);
    g.addColorStop(0, P.ac);
    g.addColorStop(1, P.fg);
    ctx.fillStyle = g;
    ctx.fillRect(ix, iy, iw, ih);
    // text columns
    ctx.fillStyle = P.fg;
    const colX = [w * 0.66, w * 0.06];
    const colY = [iy, iy + ih + h * 0.05];
    const colW = [w * 0.28, w * 0.88];
    colX.forEach((cxx, ci) => {
      let ty = colY[ci];
      const lines = ci === 0 ? 16 : 7;
      for (let i = 0; i < lines; i++) {
        ctx.globalAlpha = 0.32;
        ctx.fillRect(cxx, ty, colW[ci] * (0.65 + rnd() * 0.35), Math.max(2, h * 0.008));
        ty += h * 0.022;
      }
    });
    ctx.globalAlpha = 1;
    ctx.fillStyle = P.ac;
    ctx.fillRect(w * 0.06, h * 0.94, w * 0.12, h * 0.012);
    microMeta(ctx, w, h, P, p, rnd);
  },

  waves(ctx, w, h, rnd, P, p) {
    ctx.fillStyle = P.bg;
    ctx.fillRect(0, 0, w, h);
    const layers = 14;
    for (let i = 0; i < layers; i++) {
      const t = i / layers;
      const baseY = h * (0.12 + t * 0.8);
      const amp = h * (0.05 + 0.09 * Math.sin(t * Math.PI));
      const phase = rnd() * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(-10, baseY);
      for (let x = 0; x <= w + 10; x += 8)
        ctx.lineTo(x, baseY + Math.sin(x / (w * 0.21) + phase + i * 0.4) * amp);
      const mix = i % 3;
      ctx.strokeStyle = mix === 0 ? P.ac : mix === 1 ? P.fg : P.fg + '66';
      ctx.lineWidth = Math.max(1.5, h * 0.006);
      ctx.stroke();
    }
    ctx.font = `400 ${w * 0.026}px ${MONO}`;
    ctx.fillStyle = P.fg;
    ctx.textAlign = 'right';
    ctx.fillText(p.title.toUpperCase(), w * 0.95, h * 0.1);
    microMeta(ctx, w, h, P, p, rnd);
  },

  bottle(ctx, w, h, rnd, P, p) {
    ctx.fillStyle = P.bg;
    ctx.fillRect(0, 0, w, h);
    // halo
    const g = ctx.createRadialGradient(w / 2, h * 0.5, 0, w / 2, h * 0.5, w * 0.55);
    g.addColorStop(0, P.fg + '22');
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    // big circle behind
    ctx.fillStyle = P.ac;
    ctx.beginPath();
    ctx.arc(w / 2, h * 0.48, w * 0.3, 0, Math.PI * 2);
    ctx.fill();
    // bottle silhouette
    const bw = w * 0.2, bx = w / 2 - bw / 2, by = h * 0.18, bh = h * 0.62;
    ctx.fillStyle = P.fg;
    ctx.beginPath();
    const neck = bw * 0.42;
    ctx.moveTo(w / 2 - neck / 2, by);
    ctx.lineTo(w / 2 + neck / 2, by);
    ctx.lineTo(w / 2 + neck / 2, by + bh * 0.12);
    ctx.bezierCurveTo(bx + bw * 1.05, by + bh * 0.3, bx + bw, by + bh * 0.42, bx + bw, by + bh * 0.55);
    ctx.lineTo(bx + bw, by + bh - bw * 0.25);
    ctx.quadraticCurveTo(bx + bw, by + bh, bx + bw * 0.75, by + bh);
    ctx.lineTo(bx + bw * 0.25, by + bh);
    ctx.quadraticCurveTo(bx, by + bh, bx, by + bh - bw * 0.25);
    ctx.lineTo(bx, by + bh * 0.55);
    ctx.bezierCurveTo(bx, by + bh * 0.42, bx - bw * 0.05, by + bh * 0.3, w / 2 - neck / 2, by + bh * 0.12);
    ctx.closePath();
    ctx.fill();
    // cap
    ctx.fillRect(w / 2 - neck * 0.62, by - h * 0.025, neck * 1.24, h * 0.025);
    // label band
    ctx.fillStyle = P.bg;
    ctx.fillRect(bx - 2, by + bh * 0.58, bw + 4, bh * 0.14);
    ctx.font = `700 ${bw * 0.24}px ${SANS}`;
    ctx.fillStyle = P.fg;
    ctx.textAlign = 'center';
    ctx.fillText(p.client.toUpperCase().split(' ')[0], w / 2, by + bh * 0.675);
    // bubbles
    ctx.fillStyle = P.fg;
    for (let i = 0; i < 26; i++) {
      ctx.globalAlpha = 0.25 + rnd() * 0.5;
      ctx.beginPath();
      ctx.arc(w * (0.2 + rnd() * 0.6), h * (0.1 + rnd() * 0.75), 1.5 + rnd() * w * 0.008, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.font = `700 ${w * 0.07}px ${SANS}`;
    ctx.textAlign = 'center';
    ctx.fillStyle = P.fg;
    ctx.fillText(p.title.toUpperCase(), w / 2, h * 0.94);
    microMeta(ctx, w, h, P, p, rnd);
  },

  phone(ctx, w, h, rnd, P, p) {
    ctx.fillStyle = P.bg;
    ctx.fillRect(0, 0, w, h);
    // glow
    const g = ctx.createRadialGradient(w / 2, h * 0.45, 0, w / 2, h * 0.45, w * 0.7);
    g.addColorStop(0, P.ac + '2e');
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    // device
    const pw = w * 0.62, ph = h * 0.78, px = w / 2 - pw / 2, py = h * 0.09;
    ctx.fillStyle = '#0a0a0a';
    rr(ctx, px, py, pw, ph, w * 0.07);
    ctx.fill();
    ctx.strokeStyle = P.fg;
    ctx.lineWidth = Math.max(2, w * 0.006);
    rr(ctx, px, py, pw, ph, w * 0.07);
    ctx.stroke();
    // screen content
    const sx = px + pw * 0.07, sw = pw * 0.86;
    let sy = py + ph * 0.06;
    // status row
    ctx.fillStyle = P.fg;
    ctx.font = `400 ${pw * 0.05}px ${MONO}`;
    ctx.textAlign = 'left';
    ctx.fillText('9:41', sx, sy + pw * 0.05);
    ctx.textAlign = 'right';
    ctx.fillText('***', sx + sw, sy + pw * 0.05);
    sy += ph * 0.07;
    // hero block
    ctx.fillStyle = P.ac;
    rr(ctx, sx, sy, sw, ph * 0.3, w * 0.03);
    ctx.fill();
    ctx.fillStyle = P.bg;
    ctx.font = `700 ${pw * 0.13}px ${SANS}`;
    ctx.textAlign = 'left';
    const word = p.title.toUpperCase().split(' ')[0];
    ctx.fillText(word, sx + sw * 0.07, sy + ph * 0.13);
    ctx.fillText(p.title.toUpperCase().split(' ')[1] || p.year, sx + sw * 0.07, sy + ph * 0.23);
    sy += ph * 0.34;
    // list rows
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = P.fg;
      ctx.globalAlpha = 0.14;
      rr(ctx, sx, sy, sw, ph * 0.085, w * 0.02);
      ctx.fill();
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.arc(sx + sw * 0.08, sy + ph * 0.042, pw * 0.04, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.5;
      ctx.fillRect(sx + sw * 0.18, sy + ph * 0.028, sw * (0.3 + rnd() * 0.3), ph * 0.012);
      ctx.fillRect(sx + sw * 0.18, sy + ph * 0.052, sw * (0.2 + rnd() * 0.2), ph * 0.012);
      ctx.globalAlpha = 1;
      sy += ph * 0.105;
    }
    // CTA
    ctx.fillStyle = P.fg;
    rr(ctx, sx, sy + ph * 0.01, sw, ph * 0.09, ph * 0.05);
    ctx.fill();
    ctx.fillStyle = '#0a0a0a';
    ctx.font = `700 ${pw * 0.06}px ${SANS}`;
    ctx.textAlign = 'center';
    ctx.fillText('OPEN PROJECT', sx + sw / 2, sy + ph * 0.068);
    microMeta(ctx, w, h, P, p, rnd);
  },
};

/* ---------------- card composition ---------------- */

const ART_W = 1024;
const PAD_TOP = 132;
const PAD_BOT = 172;

export function paintArt(ctx, w, h, p) {
  const rnd = mulberry32(hashCode(p.id));
  const P = PALETTES[p.pal % PALETTES.length];
  const painter = painters[p.arch] || painters.typePoster;
  painter(ctx, w, h, rnd, P, p);
  grain(ctx, w, h, rnd, 0.07);
}

/** Full card canvas: title/client above, artwork middle, year+chips below. */
export function makeCardCanvas(p) {
  const artH = Math.round(ART_W / p.aspect);
  const W = ART_W;
  const H = artH + PAD_TOP + PAD_BOT;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');

  // artwork (slightly rounded corners via clip)
  ctx.save();
  rr(ctx, 0, PAD_TOP, W, artH, 10);
  ctx.clip();
  ctx.translate(0, PAD_TOP);
  paintArt(ctx, W, artH, p);
  ctx.restore();

  if ('letterSpacing' in ctx) ctx.letterSpacing = '3px';

  // --- top labels ---
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = 'rgba(240,240,240,0.96)';
  ctx.font = `400 30px ${MONO}`;
  ctx.textAlign = 'left';
  ctx.fillText(p.title.toUpperCase(), 4, PAD_TOP - 30);

  ctx.textAlign = 'right';
  ctx.font = `700 36px ${SANS}`;
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
  ctx.fillText(p.client, W - 4, PAD_TOP - 28);
  if ('letterSpacing' in ctx) ctx.letterSpacing = '3px';

  // --- bottom: year + tag chips ---
  const by = PAD_TOP + artH + 28;
  const chipH = 56;
  ctx.textAlign = 'left';
  ctx.font = `400 30px ${MONO}`;
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.fillText(p.year, 4, by + chipH / 2 + 11);
  let x = 4 + ctx.measureText(p.year).width + 30;

  ctx.font = `400 25px ${MONO}`;
  for (const tag of p.tags) {
    const tw = ctx.measureText(tag).width;
    const cw = tw + 46;
    if (x + cw > W) break;
    ctx.fillStyle = 'rgba(12,12,12,0.82)';
    rr(ctx, x, by, cw, chipH, chipH / 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.28)';
    ctx.lineWidth = 2;
    rr(ctx, x, by, cw, chipH, chipH / 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(235,235,235,0.95)';
    ctx.fillText(tag, x + 23, by + chipH / 2 + 9);
    x += cw + 14;
  }

  return c;
}

/** High-res artwork only, for the detail page hero. */
export function makeHeroCanvas(p, width = 1680) {
  const c = document.createElement('canvas');
  c.width = width;
  c.height = Math.round(width / p.aspect);
  paintArt(c.getContext('2d'), c.width, c.height, p);
  return c;
}

/* ============================================================
   V2 — real-image cards.
   The artwork and the labels live on separate textures so the
   artwork can be swapped for a live <video> texture on hover.
   ============================================================ */

/** Cover-fit a real image into a card-artwork canvas (rounded corners). */
export function makeImageArtCanvas(img, aspect, width = 1024) {
  const c = document.createElement('canvas');
  c.width = width;
  c.height = Math.round(width / aspect);
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high'; // best resampling for HQ covers
  ctx.save();
  rr(ctx, 0, 0, c.width, c.height, 12);
  ctx.clip();
  const s = Math.max(c.width / img.naturalWidth, c.height / img.naturalHeight);
  const dw = img.naturalWidth * s;
  const dh = img.naturalHeight * s;
  ctx.drawImage(img, (c.width - dw) / 2, (c.height - dh) / 2, dw, dh);
  // subtle vignette so labels & edges read on bright photos
  const g = ctx.createLinearGradient(0, c.height * 0.72, 0, c.height);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.22)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.restore();
  return c;
}

/**
 * Transparent label layer sized to match an artwork of the given aspect:
 * title + client above, year + colored category chips below, and a small
 * play badge for video projects. Geometry contract: the label canvas adds
 * PAD_TOP/PAD_BOT around the artwork area exactly like makeCardCanvas.
 */
export function makeLabelCanvas(p, aspect, accent = '#ffffff') {
  const artH = Math.round(ART_W / aspect);
  const W = ART_W;
  const H = artH + PAD_TOP + PAD_BOT;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');

  if ('letterSpacing' in ctx) ctx.letterSpacing = '1px';
  ctx.textBaseline = 'alphabetic';

  // --- top labels: large enough to read on small windows ---
  ctx.fillStyle = 'rgba(238,243,255,1)';
  ctx.font = `700 54px ${MONO}`;
  ctx.textAlign = 'left';
  let title = p.title.toUpperCase();
  while (ctx.measureText(title).width > W * 0.6 && title.length > 6) title = title.slice(0, -2);
  if (title !== p.title.toUpperCase()) title += '…';
  ctx.fillText(title, 4, PAD_TOP - 42);

  ctx.textAlign = 'right';
  let clientSize = 52;
  ctx.font = `700 ${clientSize}px ${SANS}`;
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
  while (ctx.measureText(p.client).width > W * 0.34 && clientSize > 34) {
    clientSize -= 2;
    ctx.font = `700 ${clientSize}px ${SANS}`;
  }
  ctx.fillStyle = 'rgba(200,214,248,0.95)';
  ctx.fillText(p.client, W - 4, PAD_TOP - 42);
  if ('letterSpacing' in ctx) ctx.letterSpacing = '1px';

  // --- bottom: year + chips (first chip tinted by category accent) ---
  const by = PAD_TOP + artH + 28;
  const chipH = 92;
  ctx.textAlign = 'left';
  ctx.font = `700 46px ${MONO}`;
  ctx.fillStyle = 'rgba(170,190,240,0.85)';
  ctx.fillText(p.year, 4, by + chipH / 2 + 16);
  let x = 4 + ctx.measureText(p.year).width + 32;

  ctx.font = `700 40px ${MONO}`;
  p.tags.forEach((tag, ti) => {
    const tw = ctx.measureText(tag).width;
    const cw = tw + 60;
    if (x + cw > W) return;
    ctx.fillStyle = ti === 0 ? accent : 'rgba(8,12,24,0.92)';
    rr(ctx, x, by, cw, chipH, chipH / 2);
    ctx.fill();
    ctx.strokeStyle = ti === 0 ? 'rgba(0,0,0,0.25)' : 'rgba(130,160,255,0.45)';
    ctx.lineWidth = 3;
    rr(ctx, x, by, cw, chipH, chipH / 2);
    ctx.stroke();
    ctx.fillStyle = ti === 0 ? 'rgba(6,8,16,0.96)' : 'rgba(236,241,255,0.98)';
    ctx.fillText(tag, x + 30, by + chipH / 2 + 14);
    x += cw + 18;
  });

  // --- play badge for video work ---
  if (p.media?.some((m) => m.type === 'video')) {
    const r = 46;
    const cx = W - r - 14;
    const cy = PAD_TOP + artH - r - 14;
    ctx.fillStyle = 'rgba(10,10,10,0.65)';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.28, cy - r * 0.42);
    ctx.lineTo(cx + r * 0.5, cy);
    ctx.lineTo(cx - r * 0.28, cy + r * 0.42);
    ctx.closePath();
    ctx.fill();
  }

  return { canvas: c, artTop: PAD_TOP / H, artBottom: (PAD_TOP + artH) / H };
}

export const CARD_PADS = { top: PAD_TOP, bottom: PAD_BOT, width: ART_W };
