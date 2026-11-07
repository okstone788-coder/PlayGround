import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

import { PALETTES, FACES, STAMPS, SPIRITS, RUSH_ACCESSORIES, ALBUM_KEY, TIER_LABEL } from './data.js';
import { createWorld } from './world.js';
import { Pumpkin } from './pumpkin.js';
import { Ghost } from './ghost.js';
import { Sfx } from './audio.js';
import { UI } from './ui.js';

// ---------------------------------------------------------------- renderer
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.98;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(36, window.innerWidth / window.innerHeight, 0.1, 120);
camera.position.set(0, 1.9, 5);
camera.lookAt(0, 1.5, 0);

const world = createWorld(scene, renderer);
const pumpkin = new Pumpkin(scene);
const ghost = new Ghost(scene);
ghost.group.visible = false;

const sfx = new Sfx();
const state = {
  mode: 'menu',
  score: 0,
  streak: 0,
  multiplier: 1,
  bestCombo: 1,
  perfectCount: 0,
  orders: [],
  orderIndex: 0,
  order: null,
  maxTime: 0,
  timeLeft: 0,
  serving: false,
  serveTimer: 0,
  mirror: false,
  stampType: 'star',
  stampTotal: 0,
  paused: false,
  photo: false,
  muted: false,
  palette: pumpkin.paletteKey,
  face: pumpkin.faceKey,
  accessory: pumpkin.accessoryKey,
};

// ---------------------------------------------------------------- post fx
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  window.innerWidth < 900 ? 0.42 : 0.5,
  0.65,
  0.82,
);
composer.addPass(bloom);
composer.addPass(new OutputPass());

// ---------------------------------------------------------------- sparkles
function makeSparkTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 30);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.25, 'rgba(255,255,255,0.85)');
  g.addColorStop(0.6, 'rgba(255,255,255,0.18)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(32, 6); ctx.lineTo(32, 58);
  ctx.moveTo(6, 32); ctx.lineTo(58, 32);
  ctx.stroke();
  return new THREE.CanvasTexture(c);
}
const sparkTex = makeSparkTexture();
const bursts = [];

function spawnBurst(position, color, count = 22, spread = 1) {
  const positions = new Float32Array(count * 3);
  const velocities = [];
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 0.08;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 0.08;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 0.08;
    const a = Math.random() * Math.PI * 2;
    const speed = (0.4 + Math.random() * 1.1) * spread;
    velocities.push(new THREE.Vector3(
      Math.cos(a) * speed * 0.7,
      0.5 + Math.random() * 1.2 * spread,
      Math.sin(a) * speed * 0.7,
    ));
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({
    color,
    size: 0.11,
    map: sparkTex,
    transparent: true,
    opacity: 1,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });
  const pts = new THREE.Points(geo, mat);
  pts.position.copy(position);
  scene.add(pts);
  bursts.push({ pts, velocities, age: 0, life: 1.15 + Math.random() * 0.3 });
}

function updateBursts(dt) {
  for (let i = bursts.length - 1; i >= 0; i--) {
    const b = bursts[i];
    b.age += dt;
    const pos = b.pts.geometry.attributes.position;
    for (let j = 0; j < b.velocities.length; j++) {
      const v = b.velocities[j];
      pos.setXYZ(
        j,
        pos.getX(j) + v.x * dt,
        pos.getY(j) + v.y * dt,
        pos.getZ(j) + v.z * dt,
      );
      v.y -= dt * 0.85;
      v.x *= 1 - dt * 0.7;
      v.z *= 1 - dt * 0.7;
    }
    pos.needsUpdate = true;
    const t = b.age / b.life;
    b.pts.material.opacity = Math.max(0, 1 - t * t);
    b.pts.material.size = 0.11 * (1 - t * 0.4);
    if (b.age >= b.life) {
      scene.remove(b.pts);
      b.pts.geometry.dispose();
      b.pts.material.dispose();
      bursts.splice(i, 1);
    }
  }
}

// ---------------------------------------------------------------- UI wiring
const ui = new UI({
  onStartRush: () => startRush(),
  onStartFree: () => startFree(),
  onServe: () => serve(false),
  onReplay: () => startRush(),
  onFreeFromResults: () => startFree(),
  onColor: (key) => {
    pumpkin.setPalette(key);
    state.palette = key;
    sfx.click();
    syncUI(true);
  },
  onFace: (key) => {
    pumpkin.setFace(key);
    state.face = key;
    sfx.chime();
    syncUI(true);
  },
  onAcc: (key) => {
    pumpkin.setAccessory(key);
    state.accessory = key;
    sfx.click();
    syncUI(true);
  },
  onStamp: (key) => {
    state.stampType = key;
    sfx.click();
    syncUI(true);
  },
  onMirror: () => {
    state.mirror = !state.mirror;
    sfx.click();
    syncUI(false);
  },
  onUndo: () => {
    if (pumpkin.undoStamp()) {
      sfx.plop();
      state.stampTotal = pumpkin.stamps.length;
      syncUI(true);
      if (state.order) ui.updateWish(pumpkin.getStats(), state.order);
    }
  },
  onClear: () => {
    pumpkin.clearStamps();
    state.stampTotal = 0;
    sfx.swoosh();
    syncUI(true);
    if (state.order) ui.updateWish(pumpkin.getStats(), state.order);
  },
  onSound: () => {
    state.muted = !state.muted;
    sfx.init();
    sfx.setMuted(state.muted);
    ui.toggleSound(state.muted);
    if (!state.muted) sfx.chime();
  },
  onPhoto: () => {
    state.photo = !state.photo;
    ui.setPhotoMode(state.photo);
    if (!state.photo) sfx.click();
  },
});

function syncUI(force = false) {
  state.palette = pumpkin.paletteKey;
  state.face = pumpkin.faceKey;
  state.accessory = pumpkin.accessoryKey;
  state.stampTotal = pumpkin.stamps.length;
  ui.sync(state, force);
}

window.addEventListener('parlor:tab', () => pumpkin.hidePreview());

// ---------------------------------------------------------------- game flow
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makeOrders() {
  const spirits = shuffle(SPIRITS).slice(0, 5);
  const colors = shuffle(Object.keys(PALETTES));
  const faces = shuffle(Object.keys(FACES));
  const accessories = shuffle(RUSH_ACCESSORIES);
  const stamps = shuffle(Object.keys(STAMPS));
  const counts = [2, 3, 3, 4, 5];
  const times = [48, 44, 40, 36, 33];
  return spirits.map((spirit, i) => ({
    spirit,
    color: colors[i % colors.length],
    face: faces[i % faces.length],
    accessory: accessories[i % accessories.length],
    stamp: { type: stamps[i % stamps.length], count: counts[i] },
    time: times[i],
    line: spirit.line,
  }));
}

function resetPumpkin() {
  pumpkin.clearStamps();
  pumpkin.setPalette('ember');
  pumpkin.setFace('happy');
  pumpkin.setAccessory('none');
  pumpkin.root.rotation.y = 0;
  pumpkin.root.rotation.x = 0;
  state.palette = 'ember';
  state.face = 'happy';
  state.accessory = 'none';
  state.stampTotal = 0;
  state.stampType = 'star';
  state.mirror = false;
}

function startRush() {
  sfx.init();
  resetPumpkin();
  state.mode = 'play';
  document.body.classList.remove('in-menu', 'in-results');
  state.score = 0;
  state.streak = 0;
  state.multiplier = 1;
  state.bestCombo = 1;
  state.perfectCount = 0;
  state.orders = makeOrders();
  state.orderIndex = 0;
  state.serving = false;
  state.serveTimer = 0;
  state.photo = false;
  ui.setPhotoMode(false);
  ui.hideStart();
  ui.hideResults();
  ui.setFreeMode(false);
  ui.setServeEnabled(true);
  beginOrder(0);
  syncUI(true);
  sfx.swoosh();
}

function beginOrder(index) {
  state.orderIndex = index;
  state.order = state.orders[index];
  state.maxTime = state.order.time;
  state.timeLeft = state.maxTime;
  state.serving = false;
  state.serveTimer = 0;

  pumpkin.clearStamps();
  state.stampTotal = 0;
  pumpkin.root.rotation.y = 0;

  ui.startOrder(state.order, index, state.orders.length);
  ui.updateWish(pumpkin.getStats(), state.order);
  ui.updateTimer(state.timeLeft, state.maxTime);
  ui.setServeEnabled(true);
  ui.sync(state, true);
}

function startFree() {
  sfx.init();
  resetPumpkin();
  state.mode = 'free';
  document.body.classList.remove('in-menu', 'in-results');
  state.order = null;
  state.serving = false;
  state.score = 0;
  state.streak = 0;
  state.multiplier = 1;
  state.bestCombo = 1;
  state.perfectCount = 0;
  state.photo = false;
  ui.setPhotoMode(false);
  ui.hideStart();
  ui.hideResults();
  ui.setFreeMode(true);
  syncUI(true);
  ui.toast('Free play — take your time and make something adorable ✨', 'info');
  sfx.chime();
}

function serve(auto = false) {
  if (state.mode !== 'play' || !state.order || state.serving) return;
  state.serving = true;
  ui.setServeEnabled(false);

  const req = state.order;
  const stats = pumpkin.getStats();
  const checks = {
    color: stats.palette === req.color,
    face: stats.face === req.face,
    acc: stats.accessory === req.accessory,
    stamp: (stats.counts[req.stamp.type] || 0) >= req.stamp.count,
  };
  const hit = Object.values(checks).filter(Boolean).length;
  const stampN = Math.min(stats.counts[req.stamp.type] || 0, req.stamp.count);
  const timeBonus = Math.round(Math.max(0, state.timeLeft) * 3);
  const perfect = hit === 4;
  const usedMult = state.multiplier;
  let pts = hit * 110 + stampN * 45 + timeBonus + (perfect ? 180 : 0);
  pts = Math.round(pts * usedMult);

  state.score += pts;
  if (perfect) state.perfectCount += 1;
  if (hit >= 3) state.streak += 1;
  else state.streak = 0;
  state.multiplier = Math.min(2, 1 + state.streak * 0.25);
  state.bestCombo = Math.max(state.bestCombo, state.multiplier);

  ui.updateHud(state);
  ui.updateWish(stats, req);

  const title = perfect ? 'PERFECT WISH!' : hit >= 3 ? 'So cute!' : 'A little wobbly…';
  const kind = perfect ? 'perfect' : hit >= 3 ? 'good' : 'bad';
  const extra = auto ? 'The moon set… ' : '';
  ui.toast(`<b>+${pts}</b> · ${extra}${title}`, kind);

  if (hit >= 3) {
    ghost.react('happy');
    sfx.success();
    if (perfect) sfx.perfect();
    const gp = ghost.group.position.clone();
    spawnBurst(gp.add(new THREE.Vector3(0, 0.15, 0.25)), perfect ? '#ffe9a3' : '#ffc2df', perfect ? 34 : 20, 1.1);
    if (perfect) {
      spawnBurst(new THREE.Vector3(pumpkin.root.position.x, 1.55, 0.9), '#ffe27a', 44, 1.35);
    }
  } else {
    ghost.react('meh');
    sfx.fail();
  }

  state.serveTimer = 2.05;
}

function finishRush() {
  state.mode = 'results';
  document.body.classList.add('in-results');
  document.body.classList.remove('in-menu');
  state.order = null;
  state.serving = false;
  ui.setServeEnabled(false);

  let best = 0;
  try {
    best = Number(localStorage.getItem(ALBUM_KEY) || 0);
  } catch { best = 0; }
  let newBest = false;
  if (state.score > best) {
    newBest = true;
    try { localStorage.setItem(ALBUM_KEY, String(state.score)); } catch { /* ignore */ }
  }

  const tier = TIER_LABEL.find((t) => state.score >= t.min) || TIER_LABEL[TIER_LABEL.length - 1];
  const line = newBest ? `${tier.line} New personal best!` : tier.line;
  ui.showResults({
    rank: tier.rank,
    title: tier.title,
    line,
    score: state.score,
    bestCombo: state.bestCombo,
    perfect: state.perfectCount,
  });
  sfx.perfect();
  spawnBurst(new THREE.Vector3(pumpkin.root.position.x, 1.7, 1), '#ffd36e', 50, 1.5);
  spawnBurst(new THREE.Vector3(ghost.group.position.x, ghost.group.position.y, ghost.group.position.z), '#ffc2df', 30, 1.2);
}

// ---------------------------------------------------------------- layout
let isMobile = window.innerWidth < 900;
let hideGhost = window.innerWidth < 640;
let camDist = 5;

function layout() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  isMobile = w < 900;
  hideGhost = w < 640;

  camera.aspect = w / h;
  camera.updateProjectionMatrix();

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(w, h);
  composer.setSize(w, h);

  const short = h < 740;
  camDist = isMobile ? (short ? 7.2 : 6.6) : (short ? 6.1 : 5.6);
  camera.position.set(0, 1.9, camDist);
  camera.lookAt(0, 1.44, 0);
  bloom.strength = isMobile ? 0.42 : 0.5;

  pumpkin.root.position.y = 1.36;
  if (isMobile) {
    pumpkin.root.scale.setScalar(0.9);
    ghost.base.set(0.55, 2.16, 0.45);
  } else {
    pumpkin.root.scale.setScalar(1);
    ghost.base.set(0.78, 2.34, 0.5);
  }
  ghost.group.visible = !hideGhost && (state.mode === 'play' || state.mode === 'free');
}

window.addEventListener('resize', layout);
layout();

// ---------------------------------------------------------------- pointer
const raycaster = new THREE.Raycaster();
const pointerNdc = new THREE.Vector2();
const activePointers = new Map();
let drag = null;
let spinVel = 0;
let pinchPrev = 0;
let lastInteraction = performance.now();
let hoverRaf = 0;

function setPointerFromEvent(e) {
  const rect = canvas.getBoundingClientRect();
  pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointerNdc, camera);
}

function canDecorate() {
  return (state.mode === 'play' || state.mode === 'free') && !state.serving && !state.photo;
}

function updateHover(e) {
  if (!canDecorate() || ui.tab !== 'stamp' || !state.stampType || drag) {
    pumpkin.hidePreview();
    return;
  }
  setPointerFromEvent(e);
  const hit = pumpkin.raycast(raycaster);
  if (!hit) {
    pumpkin.hidePreview();
    return;
  }
  const local = pumpkin.root.worldToLocal(hit.point.clone());
  const normal = hit.face.normal.clone().normalize();
  pumpkin.setPreview(state.stampType, local, normal, state.mirror);
}

function stampAt(e) {
  if (!canDecorate()) return;
  if (ui.tab !== 'stamp') {
    setPointerFromEvent(e);
    const h = pumpkin.raycast(raycaster);
    if (h) ui.toast('Pick a charm in the Glow Stamps tab first ✨', 'info');
    return;
  }
  setPointerFromEvent(e);
  const hit = pumpkin.raycast(raycaster);
  if (!hit) return;

  const local = pumpkin.root.worldToLocal(hit.point.clone());
  const normal = hit.face.normal.clone().normalize();
  const res = pumpkin.addStamp(state.stampType, local, normal, { mirror: state.mirror });
  if (res === 'full') {
    ui.toast('The pumpkin is covered in charms! Undo or clear a few ✨', 'info');
    return;
  }
  if (!res) return;

  state.stampTotal = pumpkin.stamps.length;
  sfx.plop();
  spawnBurst(hit.point.clone().addScaledVector(hit.face.normal, 0.1), STAMPS[state.stampType].glow, 12, 0.55);
  if (state.order) ui.updateWish(pumpkin.getStats(), state.order);
  ui.sync(state, true);
  lastInteraction = performance.now();
}

canvas.addEventListener('pointerdown', (e) => {
  sfx.init();
  lastInteraction = performance.now();
  activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  canvas.setPointerCapture(e.pointerId);

  if (activePointers.size === 2) {
    const pts = [...activePointers.values()];
    pinchPrev = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
    drag = null;
    pumpkin.hidePreview();
    return;
  }

  drag = {
    id: e.pointerId,
    lastX: e.clientX,
    lastY: e.clientY,
    moved: 0,
    start: performance.now(),
  };
  spinVel = 0;
  pumpkin.hidePreview();
});

canvas.addEventListener('pointermove', (e) => {
  if (activePointers.has(e.pointerId)) {
    activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  }

  if (activePointers.size >= 2) {
    const pts = [...activePointers.values()];
    const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
    if (pinchPrev > 0 && dist > 0) {
      camDist = Math.max(3.6, Math.min(7.6, camDist * (pinchPrev / dist)));
      camera.position.z = camDist;
    }
    pinchPrev = dist;
    return;
  }

  if (drag && drag.id === e.pointerId) {
    const dx = e.clientX - drag.lastX;
    const dy = e.clientY - drag.lastY;
    drag.lastX = e.clientX;
    drag.lastY = e.clientY;
    drag.moved += Math.abs(dx) + Math.abs(dy);
    if (drag.moved > 5) {
      pumpkin.root.rotation.y += dx * 0.0085;
      spinVel = dx * 0.0085;
    }
  } else {
    if (hoverRaf) return;
    hoverRaf = requestAnimationFrame(() => {
      hoverRaf = 0;
      updateHover(e);
    });
  }
});

function endPointer(e) {
  activePointers.delete(e.pointerId);
  if (activePointers.size < 2) pinchPrev = 0;
  if (!drag || drag.id !== e.pointerId) {
    if (activePointers.size === 0) drag = null;
    return;
  }
  const moved = drag.moved;
  const elapsed = performance.now() - drag.start;
  drag = null;
  if (moved < 9 && elapsed < 650) {
    stampAt(e);
  }
}

canvas.addEventListener('pointerup', endPointer);
canvas.addEventListener('pointercancel', endPointer);
canvas.addEventListener('pointerleave', () => {
  if (!drag) pumpkin.hidePreview();
});

canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  camDist = Math.max(3.6, Math.min(7.6, camDist + e.deltaY * 0.0022));
  camera.position.z = camDist;
}, { passive: false });

// ---------------------------------------------------------------- loop
let lastFrame = performance.now();
let elapsed = 0;
let wishAcc = 0;
let tickAcc = 0;

function animate() {
  requestAnimationFrame(animate);
  const now = performance.now();
  const dt = Math.min(0.05, (now - lastFrame) / 1000);
  lastFrame = now;
  elapsed += dt;

  const t = elapsed;
  world.update(dt, t);
  pumpkin.update(dt, t);
  ghost.update(dt, t);
  updateBursts(dt);

  if (!drag) {
    pumpkin.root.rotation.y += spinVel;
    spinVel *= 0.94;
    if (Math.abs(spinVel) < 0.0002) spinVel = 0;
  }

  const paused = state.paused || state.photo || document.hidden;

  if (state.mode === 'menu') {
    pumpkin.root.rotation.y = Math.sin(t * 0.32) * 0.26;
  }

  if (state.mode === 'play' && !paused) {
    if (state.serving) {
      state.serveTimer -= dt;
      if (state.serveTimer <= 0) {
        if (state.orderIndex + 1 >= state.orders.length) finishRush();
        else beginOrder(state.orderIndex + 1);
      }
    } else {
      state.timeLeft = Math.max(0, state.timeLeft - dt);
      if (state.timeLeft <= 0) {
        serve(true);
      }
      if (state.timeLeft < 10.5) {
        tickAcc += dt;
        if (tickAcc > 0.5) {
          tickAcc = 0;
          sfx.tick();
        }
      }
    }
    ui.updateTimer(state.timeLeft, state.maxTime);
    wishAcc += dt;
    if (wishAcc > 0.12) {
      wishAcc = 0;
      if (state.order) ui.updateWish(pumpkin.getStats(), state.order);
    }
  }

  // ease the pumpkin between menu and play positions
  const menu = state.mode === 'menu';
  const targetX = menu ? 0.62 : (isMobile ? 0 : -0.58);
  pumpkin.root.position.x += (targetX - pumpkin.root.position.x) * Math.min(1, dt * 4.5);
  ghost.group.visible = !hideGhost && (state.mode === 'play' || state.mode === 'free');

  // little camera sway
  camera.position.x = Math.sin(t * 0.22) * 0.045;
  camera.position.y = 1.9 + Math.sin(t * 0.31) * 0.025;
  camera.lookAt(0, 1.44, 0);

  composer.render();
}

document.body.classList.add('in-menu');
animate();

// debug handle for visual checks
window.__parlor = { scene, camera, pumpkin, ghost, state, ui, composer, renderer };

// pause when the tab hides
document.addEventListener('visibilitychange', () => {
  lastFrame = performance.now();
});

// first interaction unlocks audio
window.addEventListener('pointerdown', () => sfx.init(), { once: true });
