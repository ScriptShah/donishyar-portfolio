/* ============================================================
   DONISHYAR® — ORBIT v2
   A spherical gallery of real work (scraped from the artist's
   own portfolio channel), evolved beyond the phantom.land
   reference: two-layer cards (artwork + label), hover video
   previews, shared-element open transition, azimuth compass,
   custom cursor, category color-coding, true load progress.
   ============================================================ */
import './style.css';
import '@fontsource/space-mono/400.css';
import '@fontsource/space-mono/700.css';
import '@fontsource/space-grotesk/400.css';
import '@fontsource/space-grotesk/500.css';
import '@fontsource/space-grotesk/700.css';

import * as THREE from 'three';
import gsap from 'gsap';
import { SITE } from './data.js';
import { PROJECTS, CATEGORIES, CAT_COLOR } from './projects.js';
import { makeLabelCanvas, makeImageArtCanvas, CARD_PADS } from './textures.js';

/* ---------------- constants ---------------- */
const R = 14;
const FOV_BASE = 72;
const FOV_FOCUS = 40;

// phantom-style infinite wrapped grid: the world never rotates rigidly —
// scroll offsets shift every card's angular position around the fixed
// camera, wrapping horizontally at 2π and vertically at the grid period,
// so cards stay upright forever and there are no poles to flip over.
const ROW_STEP = 0.52;                // vertical angle of one grid cell
const N_ROWS = 4;
const COLS = 13;                      // 13 x 4 = 52 cells = 26 projects x 2
const V_PERIOD = ROW_STEP * N_ROWS;   // vertical wrap period
const TWO_PI = Math.PI * 2;
const CELL_W = TWO_PI / COLS;         // horizontal angle of one grid cell
const wrapPi = (a) => ((a % TWO_PI) + TWO_PI * 1.5) % TWO_PI - Math.PI;
const wrapV = (a) => ((a % V_PERIOD) + V_PERIOD * 1.5) % V_PERIOD - V_PERIOD / 2;

const $ = (s) => document.querySelector(s);
const canvas = $('#gl');

// resolve asset paths against Vite's base URL so the site also works when
// hosted under a sub-path (e.g. GitHub Pages /repo/)
const ASSET = (p) => import.meta.env.BASE_URL + String(p).replace(/^\//, '');

/* ---------------- renderer / scene / camera ---------------- */
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x050810, 1);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(FOV_BASE, window.innerWidth / window.innerHeight, 0.1, 80);
camera.rotation.order = 'YXZ';
const maxAniso = renderer.capabilities.getMaxAnisotropy();

/* ---------------- curved geometry ----------------
   Plane bent onto the sphere interior. yShift (world units)
   slides the plane vertically before bending so a taller label
   layer can align its artwork region with the artwork mesh.   */
function curvedPlaneGeometry(w, h, radius, segs = 24, yShift = 0) {
  const geo = new THREE.PlaneGeometry(w, h, segs, segs);
  geo.translate(0, yShift, 0);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const a = pos.getX(i) / radius;
    const b = pos.getY(i) / radius;
    pos.setXYZ(
      i,
      radius * Math.sin(a) * Math.cos(b),
      radius * Math.sin(b),
      -radius * Math.cos(a) * Math.cos(b)
    );
  }
  geo.computeVertexNormals();
  return geo;
}

/* ---------------- asset preload (drives the loader) ---------------- */
const loaded = new Map(); // id -> HTMLImageElement
async function preloadCovers(onProgress) {
  let done = 0;
  await Promise.all(PROJECTS.map(async (p) => {
    try {
      const img = new Image();
      img.src = ASSET(p.cover);
      await img.decode();
      loaded.set(p.id, img);
    } catch { /* missing cover -> card skipped */ }
    onProgress(++done / PROJECTS.length);
  }));
}

/* ---------------- build gallery ---------------- */
const cards = []; // { group, lift, artMesh, labelMesh, artMat, labelMat, p, theta, phi, on, index, video }

function buildGallery() {
  // Phantom-style strict cell grid: 13 columns x 4 rows of equal angular
  // cells tiling the whole wrap surface. Each card is contain-fit inside
  // its cell; thin grid lines run along the cell boundaries.

  // interleave categories so neighbours differ
  const byCat = {};
  PROJECTS.forEach((p) => (byCat[p.cat] ??= []).push(p));
  const queues = Object.values(byCat);
  const ordered = [];
  while (ordered.length < PROJECTS.length)
    for (const q of queues) if (q.length) ordered.push(q.shift());

  // Every project appears twice: copy A fills rows 0-1, copy B mirrors it
  // in rows 2-3 shifted 6 columns (~166 deg) so copies never share a view.
  const place = [];
  ordered.forEach((p, i) => {
    place.push({ p, row: Math.floor(i / COLS), col: i % COLS, primary: true });
    place.push({ p, row: Math.floor(i / COLS) + 2, col: ((i % COLS) + 6) % COLS, primary: false });
  });

  place.forEach(({ p, row, col, primary }) => {
    const rowPhi = (1.5 - row) * ROW_STEP;
    const img = loaded.get(p.id);
    const aspect = img
      ? THREE.MathUtils.clamp(img.naturalWidth / img.naturalHeight, 0.62, 1.85)
      : 0.8;
    const cellW = CELL_W * R * Math.cos(rowPhi);
    const cellH = ROW_STEP * R;
    // contain-fit the artwork in its cell, leaving air for the labels
    const hArt = Math.min(cellH * 0.62, (cellW * 0.8) / aspect);
    const theta = (col + 0.5) * CELL_W;
    addCard(p, img, aspect, hArt * aspect, hArt, theta, rowPhi, primary, { w: cellW, h: cellH });
  });

  addGridLines();
}

/* thin curved seam lines along the cell boundaries, phantom-style */
const gridLines = { meridians: [], circles: [] };
function addGridLines() {
  const mat = new THREE.LineBasicMaterial({ color: 0x6388ff, transparent: true, opacity: 0.16 });
  const LR = R + 0.3; // just behind the cards
  // column boundaries: meridian arcs, rotated into place each frame
  const arcPts = [];
  for (let a = -1.35; a <= 1.351; a += 0.05)
    arcPts.push(new THREE.Vector3(0, Math.sin(a) * LR, -Math.cos(a) * LR));
  const arcGeo = new THREE.BufferGeometry().setFromPoints(arcPts);
  for (let c = 0; c < COLS; c++) {
    const line = new THREE.Line(arcGeo, mat);
    scene.add(line);
    gridLines.meridians.push({ line, theta: c * CELL_W });
  }
  // row boundaries: horizontal circles, repositioned/rescaled each frame
  const circPts = [];
  for (let a = 0; a <= TWO_PI + 0.01; a += 0.05)
    circPts.push(new THREE.Vector3(Math.cos(a), 0, Math.sin(a)));
  const circGeo = new THREE.BufferGeometry().setFromPoints(circPts);
  for (let k = 0; k < N_ROWS; k++) {
    const line = new THREE.Line(circGeo, mat);
    scene.add(line);
    gridLines.circles.push({ line, phi: k * ROW_STEP - V_PERIOD / 2 });
  }
}

/* far blue starfield — slow parallax behind the grid for depth */
const stars = (() => {
  const N = 800;
  const pos = new Float32Array(N * 3);
  let seed = 42;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  for (let i = 0; i < N; i++) {
    const t = rnd() * TWO_PI;
    const u = rnd() * 2 - 1;
    const rr = 26 + rnd() * 22;
    const s = Math.sqrt(1 - u * u);
    pos[i * 3] = Math.cos(t) * s * rr;
    pos[i * 3 + 1] = u * rr;
    pos[i * 3 + 2] = Math.sin(t) * s * rr;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({
    color: 0x7fa3ff, size: 0.09, sizeAttenuation: true,
    transparent: true, opacity: 0.55, depthWrite: false,
  });
  const pts = new THREE.Points(geo, mat);
  pts.rotation.order = 'YXZ';
  scene.add(pts);
  return pts;
})();

function addCard(p, img, aspect, w, hArt, theta, phi, primary = true, cell = null) {
  const accent = CAT_COLOR[p.cat] || '#ffffff';

  // artwork layer
  const artCanvas = img ? makeImageArtCanvas(img, aspect) : null;
  if (!artCanvas) return;
  const artTex = new THREE.CanvasTexture(artCanvas);
  artTex.colorSpace = THREE.SRGBColorSpace;
  artTex.anisotropy = maxAniso;
  const artMat = new THREE.MeshBasicMaterial({ map: artTex, transparent: true, opacity: 0 });
  const artMesh = new THREE.Mesh(curvedPlaneGeometry(w, hArt, R, 22), artMat);

  // label layer (slightly nearer sphere shell so it never z-fights)
  const { canvas: labCanvas } = makeLabelCanvas(p, aspect, accent);
  const pxToWorld = hArt / Math.round(1024 / aspect);
  const hLab = labCanvas.height * pxToWorld * (1024 / labCanvas.width); // width identical => scale by px
  const labTex = new THREE.CanvasTexture(labCanvas);
  labTex.colorSpace = THREE.SRGBColorSpace;
  labTex.anisotropy = maxAniso;
  const labelMat = new THREE.MeshBasicMaterial({ map: labTex, transparent: true, opacity: 0 });
  // the art region sits (bottom-top)/2 px above the label canvas centre
  const padShift = (CARD_PADS.bottom - CARD_PADS.top) / 2;
  const labelMesh = new THREE.Mesh(
    curvedPlaneGeometry(w, hLab, R - 0.06, 24, -padShift * pxToWorld),
    labelMat
  );

  const lift = new THREE.Group();
  lift.add(artMesh);
  lift.add(labelMesh);
  lift.position.z = -2.5; // intro fly-in

  const group = new THREE.Group();
  group.rotation.order = 'YXZ';
  group.rotation.y = theta;
  group.rotation.x = phi;
  group.add(lift);

  // cell backdrop — a soft blue glow behind the hovered card
  let panelMat = null;
  if (cell) {
    panelMat = new THREE.MeshBasicMaterial({ color: 0x2a55c8, transparent: true, opacity: 0 });
    const panel = new THREE.Mesh(
      curvedPlaneGeometry(cell.w * 0.96, cell.h * 0.96, R + 0.18, 12),
      panelMat
    );
    group.add(panel); // outside the lift: the cell stays put, the card lifts
  }
  scene.add(group);

  const card = {
    group, lift, artMesh, labelMesh, artMat, labelMat, panelMat,
    p, theta, phi, on: true, index: cards.length, accent, primary, aspect,
    video: null, videoTex: null,
  };
  artMesh.userData.card = card;
  labelMesh.userData.card = card;
  cards.push(card);
}

/* ---------------- hover video preview ---------------- */
// crop the video texture to cover-fill the card (CSS object-fit: cover)
function fitTextureToCard(tex, vw, vh, cardAspect) {
  if (!vw || !vh) return;
  const va = vw / vh;
  if (va > cardAspect) {
    const r = cardAspect / va;
    tex.repeat.set(r, 1);
    tex.offset.set((1 - r) / 2, 0);
  } else {
    const r = va / cardAspect;
    tex.repeat.set(1, r);
    tex.offset.set(0, (1 - r) / 2);
  }
}

function startPreview(card) {
  if (!card.p.preview) return;
  if (!card.video) {
    const v = document.createElement('video');
    v.src = ASSET(card.p.preview);
    v.muted = true;
    v.loop = true;
    v.playsInline = true;
    v.preload = 'auto';
    card.video = v;
    const tex = new THREE.VideoTexture(v);
    tex.colorSpace = THREE.SRGBColorSpace;
    card.videoTex = tex;
  }
  card.video.play().then(() => {
    fitTextureToCard(card.videoTex, card.video.videoWidth, card.video.videoHeight, card.aspect);
    if (hovered === card) {
      card.artMat.map = card.videoTex;
      card.artMat.needsUpdate = true;
    }
  }).catch(() => {});
}
function stopPreview(card) {
  if (!card.video) return;
  card.video.pause();
  if (card._baseMap) { card.artMat.map = card._baseMap; card.artMat.needsUpdate = true; }
}

/* ---------------- camera control (lenis-style inertia) ---------------- */
const rot = { yaw: 0.25, pitch: -0.03, tYaw: 0.25, tPitch: -0.03 };
const par = { x: 0, y: 0, tx: 0, ty: 0 };
let mode = 'intro'; // intro | sphere | page | list
let dragging = false;
let dragDist = 0;
let downTime = 0;
let lastX = 0, lastY = 0;
let velX = 0, velY = 0;
let lastInteract = 0;

const sens = () => (THREE.MathUtils.degToRad(FOV_BASE) * 1.15) / window.innerHeight;

canvas.addEventListener('pointerdown', (e) => {
  if (mode !== 'sphere') return;
  dragging = true;
  dragDist = 0;
  downTime = performance.now();
  lastX = e.clientX;
  lastY = e.clientY;
  velX = velY = 0;
  canvas.classList.add('dragging');
  cursor.press(true);
  canvas.setPointerCapture(e.pointerId);
  hideHint();
});

window.addEventListener('pointermove', (e) => {
  par.tx = e.clientX / window.innerWidth - 0.5;
  par.ty = e.clientY / window.innerHeight - 0.5;
  cursor.move(e.clientX, e.clientY);
  if (mode !== 'sphere') return;
  if (dragging) {
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    dragDist += Math.abs(dx) + Math.abs(dy);
    const s = sens();
    rot.tYaw += dx * s;
    rot.tPitch += dy * s; // free 360° vertical orbit
    velX = velX * 0.72 + dx * 0.28;
    velY = velY * 0.72 + dy * 0.28;
    lastInteract = performance.now();
  } else {
    updateHover(e.clientX, e.clientY);
  }
});

canvas.addEventListener('pointerup', (e) => {
  cursor.press(false);
  if (!dragging) return;
  dragging = false;
  canvas.classList.remove('dragging');
  const s = sens();
  rot.tYaw += velX * s * 8;
  rot.tPitch += velY * s * 8;
  lastInteract = performance.now();
  if (dragDist < 7 && performance.now() - downTime < 400) {
    const hit = raycast(e.clientX, e.clientY);
    if (hit) openProject(hit);
  }
});

canvas.addEventListener('wheel', (e) => {
  if (mode !== 'sphere') return;
  e.preventDefault();
  rot.tYaw += e.deltaX * 0.00055;
  rot.tPitch -= e.deltaY * 0.00045; // wheel scrolls the rows, like a page
  lastInteract = performance.now();
  hideHint();
}, { passive: false });

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { closeOverlays(); return; }
  if (mode !== 'sphere') return;
  const step = 0.22;
  if (e.key === 'ArrowLeft') rot.tYaw -= step;
  if (e.key === 'ArrowRight') rot.tYaw += step;
  if (e.key === 'ArrowUp') rot.tPitch += step;
  if (e.key === 'ArrowDown') rot.tPitch -= step;
  lastInteract = performance.now();
});

/* ---------------- raycast / hover ---------------- */
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
let hovered = null;

function raycast(cx, cy) {
  ndc.set((cx / window.innerWidth) * 2 - 1, -(cy / window.innerHeight) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  const meshes = cards.filter((c) => c.on && c.group.visible).map((c) => c.artMesh);
  const hits = raycaster.intersectObjects(meshes, false);
  return hits.length ? hits[0].object.userData.card : null;
}

const hoverInfo = {
  el: $('#hover-info'),
  set(p, accent) {
    this.el.querySelector('.hi-title').textContent = p.title;
    this.el.querySelector('.hi-meta').textContent = `${p.client} — ${p.year} — ${p.role}`;
    this.el.querySelector('.hi-tags').innerHTML =
      `<i class="cat" style="background:${accent}">${p.cat}</i>` +
      p.tags.map((t) => `<i>${t}</i>`).join('');
    this.el.classList.add('show');
  },
  clear() { this.el.classList.remove('show'); },
};

function updateHover(cx, cy) {
  const card = mode === 'sphere' ? raycast(cx, cy) : null;
  if (card === hovered) return;
  if (hovered) {
    gsap.to(hovered.lift.position, { z: 0, duration: 0.6, ease: 'power3.out' });
    if (hovered.panelMat) gsap.to(hovered.panelMat, { opacity: 0, duration: 0.45 });
    stopPreview(hovered);
  }
  hovered = card;
  cursor.setState(card ? 'view' : mode === 'sphere' ? 'drag' : '');
  if (card) {
    gsap.to(card.lift.position, { z: 0.45, duration: 0.6, ease: 'power3.out' });
    if (card.panelMat) gsap.to(card.panelMat, { opacity: 0.22, duration: 0.45 });
    card._baseMap = card.artMat.map;
    hoverInfo.set(card.p, card.accent);
    startPreview(card);
    audio.tick();
  } else {
    hoverInfo.clear();
  }
}

/* ---------------- custom cursor ---------------- */
const cursor = {
  el: $('#cursor'),
  label: document.querySelector('#cursor .c-label'),
  x: innerWidth / 2, y: innerHeight / 2, tx: innerWidth / 2, ty: innerHeight / 2,
  shown: false,
  move(x, y) {
    this.tx = x; this.ty = y;
    if (!this.shown) {
      this.shown = true;
      this.x = x; this.y = y;
      document.body.classList.add('has-cursor');
      gsap.to(this.el, { opacity: 1, duration: 0.3 });
    }
  },
  setState(s) {
    this.el.classList.toggle('is-view', s === 'view');
    this.el.classList.toggle('is-drag', s === 'drag-active');
    this.label.textContent = s === 'view' ? 'VIEW' : s === 'drag-active' ? 'DRAG' : '';
  },
  press(p) { this.el.classList.toggle('is-press', p); },
  tick(dt) {
    const e = 1 - Math.exp(-14 * dt);
    this.x += (this.tx - this.x) * e;
    this.y += (this.ty - this.y) * e;
    this.el.style.transform = `translate(${this.x}px, ${this.y}px)`;
  },
};
// grow ring over interactive DOM
document.addEventListener('mouseover', (e) => {
  if (e.target.closest('a, button, .list-row')) cursor.el.classList.add('is-press');
});
document.addEventListener('mouseout', (e) => {
  if (e.target.closest('a, button, .list-row')) cursor.el.classList.remove('is-press');
});

/* ---------------- compass ---------------- */
const compassEl = $('#compass');
const notches = [];
function buildCompass() {
  cards.filter((c) => c.primary).forEach((card) => {
    const n = document.createElement('button');
    n.className = 'notch';
    n.style.background = card.accent;
    n.setAttribute('aria-label', card.p.title);
    n.addEventListener('click', () => {
      if (mode !== 'sphere') return;
      const ty = rot.tYaw + wrapPi(card.theta - rot.tYaw);
      const tp = rot.tPitch + wrapV(card.phi - rot.tPitch);
      gsap.to(rot, { tYaw: ty, tPitch: tp, duration: 0.4, ease: 'power2.out' });
    });
    compassEl.appendChild(n);
    notches.push({ el: n, card });
  });
}
function updateCompass() {
  for (const { el, card } of notches) {
    const d = wrapPi(card.theta - rot.yaw);
    const x = (d / (Math.PI * 0.55)) * 160;
    const vis = Math.abs(d) < Math.PI * 0.55;
    el.style.transform = `translateX(${x.toFixed(1)}px)`;
    el.style.opacity = vis ? (card.on ? 1 : 0.25) : 0;
    el.classList.toggle('near', Math.abs(d) < 0.12);
  }
}

/* ---------------- render loop ---------------- */
let lastT = performance.now();
let frame = 0;
function tick(t) {
  const dt = Math.min((t - lastT) / 1000, 0.05);
  lastT = t;

  if (mode === 'sphere' && !dragging && t - lastInteract > 4500) rot.tYaw += dt * 0.02;

  const e = 1 - Math.exp(-5.6 * dt);
  rot.yaw += (rot.tYaw - rot.yaw) * e;
  rot.pitch += (rot.tPitch - rot.pitch) * e;
  const ep = 1 - Math.exp(-3 * dt);
  par.x += (par.tx - par.x) * ep;
  par.y += (par.ty - par.y) * ep;

  // wrapped-grid placement: cards stream past the fixed camera and re-enter
  // on the other side — endless in both axes, always upright
  for (const c of cards) {
    const dT = wrapPi(c.theta - rot.yaw);
    const dP = wrapV(c.phi - rot.pitch);
    c.group.rotation.y = dT;
    c.group.rotation.x = dP;
    c.group.visible = Math.abs(dT) < 1.9; // behind-the-camera cull
  }
  // grid seams scroll with the world
  for (const m of gridLines.meridians) {
    const dT = wrapPi(m.theta - rot.yaw);
    m.line.rotation.y = dT;
    m.line.visible = Math.abs(dT) < 1.8;
  }
  for (const cl of gridLines.circles) {
    const phiD = wrapV(cl.phi - rot.pitch);
    const rr = (R + 0.3) * Math.cos(phiD);
    cl.line.scale.set(rr, 1, rr);
    cl.line.position.y = (R + 0.3) * Math.sin(phiD);
  }
  // starfield drifts at quarter speed — depth parallax
  stars.rotation.y = -rot.yaw * 0.25;
  stars.rotation.x = -rot.pitch * 0.25;

  // camera carries only parallax + a touch of velocity roll
  camera.rotation.y = -par.x * 0.05;
  camera.rotation.x = -par.y * 0.04;
  const rollT = THREE.MathUtils.clamp((rot.tYaw - rot.yaw) * 0.05, -0.035, 0.035);
  camera.rotation.z += (rollT - camera.rotation.z) * e;

  cursor.tick(dt);
  if ((frame++ & 1) === 0) updateCompass();
  // the grid streams under a stationary cursor — keep hover in sync
  if ((frame & 7) === 0 && mode === 'sphere' && !dragging && cursor.shown)
    updateHover(cursor.tx, cursor.ty);
  // safety net: catch any resize/zoom the events missed (canvas must always fill)
  if ((frame & 31) === 0 &&
      (canvas.clientWidth !== window.innerWidth || canvas.clientHeight !== window.innerHeight))
    fitViewport();

  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}

function fitViewport() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // zoom changes DPR
  renderer.setSize(w, h);
}
window.addEventListener('resize', fitViewport);
window.visualViewport?.addEventListener('resize', fitViewport);

/* ---------------- helpers ---------------- */
function dimOthers(except, dur = 0.6) {
  cards.forEach((c) => {
    if (c === except) return;
    gsap.to([c.artMat, c.labelMat], { opacity: 0.04, duration: dur, ease: 'power2.out' });
  });
}
function restoreCards(dur = 0.7) {
  cards.forEach((c) => {
    gsap.to([c.artMat, c.labelMat], { opacity: c.on ? 1 : 0.05, duration: dur, ease: 'power2.out' });
  });
}

/* ---------------- detail page ---------------- */
const pageEl = $('#page');
const pageWrap = $('#page-wrap');
const pageIndex = $('#page-index');
let currentProject = null;

function mediaStackHTML(p) {
  // every media cell is sized by its REAL aspect ratio from the data, so
  // boxes are full-size immediately — no collapsed players while videos
  // wait for metadata. Landscape leads full-width; portrait pieces get a
  // tall fixed-height box and pair up; squares share rows.
  const items = p.media.map((m, i) => {
    const portrait = m.w && m.h ? m.h > m.w : false;
    const ar = m.w && m.h ? `${m.w} / ${m.h}` : '16 / 9';
    const cls = portrait ? 'is-portrait' : i === 0 || p.media.length <= 2 ? 'span-2' : '';
    const inner = m.type === 'video'
      ? `<video src="${ASSET(m.src)}" ${m.poster ? `poster="${ASSET(m.poster)}"` : ''} controls muted loop playsinline preload="metadata"></video>`
      : `<img src="${ASSET(m.src)}" alt="${p.title} — ${i + 1}" loading="lazy" />`;
    return `<div class="m-cell ${cls}" style="aspect-ratio:${ar}">${inner}</div>`;
  }).join('');
  return `<div class="media-stack ${p.media.length > 1 ? 'grid-2' : ''}">${items}</div>`;
}

function projectPageHTML(p, i) {
  return `
    <div class="rv"><h1>${p.title}</h1></div>
    <div class="meta-row mono">
      <div>CLIENT<b>${p.client}</b></div>
      <div>YEAR<b>${p.year}</b></div>
      <div>ROLE<b>${p.role}</b></div>
      <div>TOOLS<b>${p.tools}</b></div>
      <div class="chips">${p.tags.map((t, ti) => `<span style="${ti === 0 ? `background:${CAT_COLOR[p.cat] || '#fff'};color:#000;border-color:transparent` : ''}">${t}</span>`).join('')}</div>
    </div>
    ${mediaStackHTML(p)}
    <div class="cols">
      <div>${p.blurb.map((b) => `<p>${b}</p>`).join('')}</div>
      <div class="facts mono">
        <div class="fact"><span>DISCIPLINE</span><span>${p.cat}</span></div>
        <div class="fact"><span>PIECES</span><span>${p.media.length}</span></div>
        <div class="fact"><span>INDEX</span><span>${String(i + 1).padStart(2, '0')} / ${PROJECTS.length}</span></div>
        <div class="fact"><span>DESIGNER</span><span>${SITE.brand}®</span></div>
      </div>
    </div>
    <button class="next" data-next>
      <span class="mono">NEXT PROJECT →</span>
      <span class="nt">${PROJECTS[(i + 1) % PROJECTS.length].title}</span>
    </button>`;
}

function aboutPageHTML() {
  return `
    <div class="rv"><h1>${SITE.name.split(' ').slice(0, 2).join(' ')}<br>${SITE.name.split(' ').slice(2).join(' ')}</h1></div>
    <p class="big-lede">${SITE.summary}</p>
    <div class="sec"><h3>Experience</h3>
      ${SITE.experience.map((x) => `
        <div class="xp">
          <span class="mono">${x.years}</span>
          <div><div class="role">${x.role}</div><div class="co">${x.co}</div>
            <p style="color:#9a9a9a;margin-top:8px;font-size:15px;line-height:1.5">${x.note}</p></div>
        </div>`).join('')}
    </div>
    <div class="sec"><h3>Education</h3>
      ${SITE.education.map((x) => `
        <div class="xp"><span class="mono">${x.year}</span><div class="role">${x.title}</div></div>`).join('')}
    </div>
    <div class="sec"><h3>Capabilities</h3>
      <div class="skill-chips">${SITE.skills.map((s) => `<span>${s}</span>`).join('')}</div>
    </div>
    <a class="dl-cv" href="${ASSET('/TShahabi-CV.pdf')}" download="Ahmad-Shah-Donishyar-CV.pdf">Download CV ↓</a>`;
}

function contactPageHTML() {
  return `
    <div class="rv"><h1>Let's make<br>something loud.</h1></div>
    <p class="big-lede">Available for identities, campaigns, motion and everything in between.</p>
    <a class="mail-big" href="mailto:${SITE.email}">${SITE.email}</a>
    <div class="sec mono" style="display:grid;gap:10px">
      <span>TEL — ${SITE.phone}</span>
      <span>BASE — KABUL, AF · WORKING WORLDWIDE</span>
    </div>
    <div class="socials mono">
      <a href="https://t.me/donishyarportfolio" target="_blank" rel="noopener">TELEGRAM ↗</a>
      <a href="#">INSTAGRAM ↗</a><a href="#">BEHANCE ↗</a>
    </div>`;
}

function animatePageIn() {
  pageEl.style.display = 'block';
  pageEl.setAttribute('aria-hidden', 'false');
  gsap.fromTo(pageEl, { clipPath: 'inset(100% 0% 0% 0%)' },
    { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.85, ease: 'power4.inOut' });
  gsap.fromTo(pageWrap.children, { y: 60, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.9, ease: 'power3.out', stagger: 0.07, delay: 0.45 });
}

function openProject(card) {
  if (!card || (mode !== 'sphere' && mode !== 'list')) return;
  const fromList = mode === 'list';
  if (fromList) hideList(true);
  mode = 'page';
  currentProject = card;
  setDock('work');
  cursor.setState('');
  stopPreview(card);
  if (card.panelMat) gsap.to(card.panelMat, { opacity: 0, duration: 0.3 });
  hovered = null;
  hoverInfo.clear();

  gsap.killTweensOf(rot);
  gsap.killTweensOf(camera);
  const ty = rot.yaw + wrapPi(card.theta - rot.yaw);
  const tp = rot.pitch + wrapV(card.phi - rot.pitch);
  gsap.to(rot, { yaw: ty, tYaw: ty, pitch: tp, tPitch: tp, duration: 0.85, ease: 'power3.inOut' });
  gsap.to(camera, {
    fov: FOV_FOCUS, duration: 0.9, ease: 'power3.inOut',
    onUpdate: () => camera.updateProjectionMatrix(),
  });
  // shared-element feel: the card flies toward the viewer as the page rises
  gsap.to(card.lift.position, { z: 5.2, duration: 0.95, ease: 'power3.inOut' });
  gsap.to(card.labelMat, { opacity: 0, duration: 0.4 });
  dimOthers(card, 0.7);
  audio.whoosh();

  pageIndex.textContent = `${String(card.index + 1).padStart(2, '0')} / ${PROJECTS.length}`;
  pageWrap.innerHTML = projectPageHTML(card.p, PROJECTS.indexOf(card.p));
  pageWrap.querySelector('[data-next]').addEventListener('click', () => {
    const next = cards.find((c) => c.p === PROJECTS[(PROJECTS.indexOf(card.p) + 1) % PROJECTS.length]);
    closePage(true);
    setTimeout(() => openProject(next), 360);
  });
  pageWrap.scrollTop = 0;
  setTimeout(animatePageIn, fromList ? 150 : 420);
  // park the card back once hidden behind the page
  setTimeout(() => {
    if (mode !== 'page') return;
    gsap.killTweensOf(card.lift.position);
    card.lift.position.z = 0;
    card.labelMat.opacity = 0.04;
  }, 1600);
}

function openStatic(kind) {
  if (mode === 'list') hideList(true);
  mode = 'page';
  currentProject = null;
  gsap.killTweensOf(camera);
  pageIndex.textContent = kind.toUpperCase();
  pageWrap.innerHTML = kind === 'about' ? aboutPageHTML() : contactPageHTML();
  pageWrap.scrollTop = 0;
  dimOthers(null, 0.7);
  gsap.to(camera, { fov: 58, duration: 0.9, ease: 'power3.inOut', onUpdate: () => camera.updateProjectionMatrix() });
  animatePageIn();
}

function closePage(fast = false) {
  if (mode !== 'page') return;
  gsap.killTweensOf(camera);
  // pause any playing detail videos
  pageWrap.querySelectorAll('video').forEach((v) => v.pause());
  gsap.to(pageEl, {
    clipPath: 'inset(0% 0% 100% 0%)', duration: fast ? 0.4 : 0.7, ease: 'power4.inOut',
    onComplete: () => {
      pageEl.style.display = 'none';
      pageEl.setAttribute('aria-hidden', 'true');
      pageEl.style.clipPath = 'inset(100% 0% 0% 0%)';
    },
  });
  gsap.to(camera, { fov: FOV_BASE, duration: 0.9, ease: 'power3.inOut', onUpdate: () => camera.updateProjectionMatrix() });
  restoreCards();
  mode = 'sphere';
  setDock('work');
}

$('#page-back').addEventListener('click', () => closePage());

/* ---------------- list view ---------------- */
const listView = $('#list-view');
const listRows = $('#list-rows');

function buildList() {
  listRows.innerHTML = '';
  PROJECTS.forEach((p, i) => {
    const row = document.createElement('button');
    row.className = 'list-row';
    row.innerHTML = `
      <span class="mono">${String(i + 1).padStart(2, '0')}</span>
      <span class="t">${p.title}</span>
      <span class="mono lc">${p.client}</span>
      <span class="mono lcat" style="color:${CAT_COLOR[p.cat] || '#888'}">${p.cat}</span>
      <span class="mono">${p.year}</span>`;
    row.addEventListener('click', () => openProject(cards.find((c) => c.p === p)));
    listRows.appendChild(row);
  });
}

function showList() {
  if (mode === 'page') closePage(true);
  mode = 'list';
  cursor.setState('');
  hoverInfo.clear();
  listView.style.display = 'block';
  listView.setAttribute('aria-hidden', 'false');
  gsap.fromTo(listView, { opacity: 0 }, { opacity: 1, duration: 0.4 });
  gsap.fromTo('.list-row', { y: 34, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out', stagger: 0.025 });
  $('#btn-list').classList.add('active');
  $('#btn-sphere').classList.remove('active');
}
function hideList(instant = false) {
  if (instant) listView.style.display = 'none';
  else gsap.to(listView, { opacity: 0, duration: 0.3, onComplete: () => (listView.style.display = 'none') });
  listView.setAttribute('aria-hidden', 'true');
  $('#btn-list').classList.remove('active');
  $('#btn-sphere').classList.add('active');
  if (mode === 'list') mode = 'sphere';
}

$('#btn-list').addEventListener('click', showList);
$('#btn-sphere').addEventListener('click', () => closeOverlays());

/* ---------------- filter ---------------- */
const filterBtn = $('#filter-btn');
const filterPanel = $('#filter-panel');
let filterOpen = false;

function buildFilter() {
  CATEGORIES.forEach((cat) => {
    const b = document.createElement('button');
    b.className = 'chip' + (cat === 'ALL' ? ' active' : '');
    const dot = cat === 'ALL' ? '' : `<i style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${CAT_COLOR[cat]};margin-right:8px"></i>`;
    b.innerHTML = dot + cat;
    b.addEventListener('click', () => applyFilter(cat, b));
    filterPanel.appendChild(b);
  });
}

function applyFilter(cat, btn) {
  filterPanel.querySelectorAll('.chip').forEach((c) => c.classList.remove('active'));
  btn.classList.add('active');
  cards.forEach((c) => {
    c.on = cat === 'ALL' || c.p.cat === cat;
    gsap.to([c.artMat, c.labelMat], { opacity: c.on ? 1 : 0.05, duration: 0.7, ease: 'power2.inOut' });
    gsap.to(c.lift.position, { z: c.on ? 0 : -1.2, duration: 0.7, ease: 'power2.inOut' });
  });
  audio.tick();
}

function toggleFilter(force) {
  filterOpen = force !== undefined ? force : !filterOpen;
  filterBtn.classList.toggle('open', filterOpen);
  if (filterOpen) {
    filterPanel.style.visibility = 'visible';
    gsap.to(filterPanel, { opacity: 1, y: 0, duration: 0.45, ease: 'power3.out' });
    gsap.fromTo(filterPanel.children, { x: 24, opacity: 0 }, { x: 0, opacity: 1, duration: 0.4, stagger: 0.04, ease: 'power3.out' });
  } else {
    gsap.to(filterPanel, { opacity: 0, y: 14, duration: 0.3, onComplete: () => (filterPanel.style.visibility = 'hidden') });
  }
}
filterBtn.addEventListener('click', () => toggleFilter());

/* ---------------- dock nav ---------------- */
function setDock(which) {
  document.querySelectorAll('.dock button').forEach((b) =>
    b.classList.toggle('active', b.dataset.nav === which));
}
document.querySelectorAll('.dock button').forEach((b) => {
  b.addEventListener('click', () => {
    const nav = b.dataset.nav;
    setDock(nav);
    if (nav === 'work') closeOverlays();
    else { closePageInstantIfNeeded(); openStatic(nav); }
  });
});
function closePageInstantIfNeeded() {
  if (mode === 'page') {
    pageWrap.querySelectorAll('video').forEach((v) => v.pause());
    pageEl.style.display = 'none';
    pageEl.style.clipPath = 'inset(100% 0% 0% 0%)';
    mode = 'sphere';
  }
}
function closeOverlays() {
  if (mode === 'page') closePage();
  if (mode === 'list') hideList();
  if (filterOpen) toggleFilter(false);
  setDock('work');
}
$('#logo').addEventListener('click', (e) => { e.preventDefault(); closeOverlays(); });

/* ---------------- header: copy, clocks, talk ---------------- */
$('#intro-copy').textContent = SITE.intro;
$('#talk-btn').href = `mailto:${SITE.email}?subject=${encodeURIComponent("Let's talk")}`;

const clocksEl = $('#clocks');
function renderClocks() {
  clocksEl.innerHTML = SITE.cities.map((c) => {
    const time = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: c.tz }).format(new Date());
    const hour = +new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hour12: false, timeZone: c.tz }).format(new Date());
    const off = new Intl.DateTimeFormat('en-GB', { timeZoneName: 'shortOffset', timeZone: c.tz })
      .formatToParts(new Date()).find((p) => p.type === 'timeZoneName').value;
    const icon = hour >= 6 && hour < 18 ? '●' : '☾';
    return `<div class="row"><span>${icon}</span><span>${c.label}</span><span class="dim">${time} ${off}</span></div>`;
  }).join('');
}
renderClocks();
setInterval(renderClocks, 30000);

/* ---------------- sound (synthesized, no assets) ---------------- */
const audio = {
  ctx: null, master: null, on: false,
  ensure() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(this.ctx.destination);
    [55, 55.6, 110.3].forEach((f, i) => {
      const o = this.ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = f;
      const g = this.ctx.createGain();
      g.gain.value = i === 2 ? 0.012 : 0.03;
      o.connect(g).connect(this.master);
      o.start();
    });
    const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * 2, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const noise = this.ctx.createBufferSource();
    noise.buffer = buf;
    noise.loop = true;
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 160;
    const ng = this.ctx.createGain();
    ng.gain.value = 0.05;
    noise.connect(lp).connect(ng).connect(this.master);
    noise.start();
  },
  toggle() {
    this.ensure();
    this.ctx.resume();
    this.on = !this.on;
    this.master.gain.cancelScheduledValues(this.ctx.currentTime);
    this.master.gain.linearRampToValueAtTime(this.on ? 0.55 : 0, this.ctx.currentTime + 0.8);
    $('#sound-state').textContent = this.on ? 'ON' : 'OFF';
    $('#sound-btn').classList.toggle('on', this.on);
  },
  blip(freq, dur, gain) {
    if (!this.on || !this.ctx) return;
    const o = this.ctx.createOscillator();
    o.type = 'triangle';
    o.frequency.value = freq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gain, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + dur);
    o.connect(g).connect(this.ctx.destination);
    o.start();
    o.stop(this.ctx.currentTime + dur);
  },
  tick() { this.blip(1900, 0.06, 0.025); },
  whoosh() { this.blip(220, 0.5, 0.05); },
};
$('#sound-btn').addEventListener('click', () => audio.toggle());

/* ---------------- hint ---------------- */
let hintHidden = false;
function hideHint() {
  if (hintHidden) return;
  hintHidden = true;
  gsap.to('#hint', { opacity: 0, duration: 0.6, delay: 0.4 });
}

/* ---------------- loader / intro ---------------- */
async function start() {
  try {
    await Promise.all([
      document.fonts.load('400 30px "Space Mono"'),
      document.fonts.load('700 36px "Space Mono"'),
      document.fonts.load('700 60px "Space Grotesk"'),
      document.fonts.load('500 16px "Space Grotesk"'),
    ]);
  } catch { /* non-fatal */ }

  // real progress: cover images drive the counter
  const numEl = $('#loader-num');
  const t0 = performance.now();
  await preloadCovers((f) => (numEl.textContent = String(Math.round(f * 100)).padStart(3, '0')));

  buildGallery();
  buildList();
  buildFilter();
  buildCompass();

  const hero = cards[Math.floor(cards.length / 6)] || cards[0];
  rot.yaw = rot.tYaw = hero.theta - 0.35;
  rot.pitch = rot.tPitch = -0.02;

  window.__app = {
    rot, cards, camera, openProject, closePage,
    raycastAt: (x, y) => raycast(x, y)?.p?.id ?? null,
    state: () => ({ mode, dragging }),
  };

  requestAnimationFrame(tick);

  // hold the loader briefly so the counter reads as intentional
  const wait = Math.max(0, 900 - (performance.now() - t0));
  setTimeout(reveal, wait);
}

function reveal() {
  const tl = gsap.timeline();
  tl.to('#loader', {
    yPercent: -100, duration: 0.9, ease: 'power4.inOut',
    onComplete: () => ($('#loader').style.display = 'none'),
  });
  const mats = cards.flatMap((c) => [c.artMat, c.labelMat]);
  tl.to(mats, { opacity: 1, duration: 1.1, ease: 'power2.out', stagger: 0.018 }, 0.35);
  tl.to(cards.map((c) => c.lift.position), { z: 0, duration: 1.4, ease: 'power3.out', stagger: 0.035 }, 0.35);
  tl.add(() => { mode = 'sphere'; }, 0.6);
  tl.to(rot, { tYaw: rot.tYaw + 0.35, duration: 2.2, ease: 'power2.out' }, 0.5);
  tl.fromTo('#header > *', { y: -26, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', stagger: 0.06 }, 0.55);
  tl.fromTo(['.dock', '.view-toggle', '.filter-btn', '#hint', '.compass'], { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', stagger: 0.07 }, 0.7);
  lastInteract = performance.now();
}

start();
