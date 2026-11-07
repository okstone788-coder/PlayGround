import * as THREE from 'three';

// ---------- 2D shape builders (all lie in the XY plane, facing +Z) ----------

export function starShape(outer = 1, inner = 0.45, points = 5) {
  const s = new THREE.Shape();
  for (let i = 0; i < points * 2; i++) {
    const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 === 0 ? outer : inner;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) s.moveTo(x, y);
    else s.lineTo(x, y);
  }
  s.closePath();
  return s;
}

export function heartShape() {
  const s = new THREE.Shape();
  s.moveTo(0, -0.86);
  s.bezierCurveTo(-0.12, -0.68, -0.98, -0.18, -0.86, 0.3);
  s.bezierCurveTo(-0.76, 0.78, -0.2, 0.86, 0, 0.42);
  s.bezierCurveTo(0.2, 0.86, 0.76, 0.78, 0.86, 0.3);
  s.bezierCurveTo(0.98, -0.18, 0.12, -0.68, 0, -0.86);
  s.closePath();
  return s;
}

export function moonShape() {
  const s = new THREE.Shape();
  s.moveTo(0.5, 0.98);
  s.bezierCurveTo(-0.72, 0.72, -0.72, -0.72, 0.5, -0.98);
  s.bezierCurveTo(-0.08, -0.42, -0.08, 0.42, 0.5, 0.98);
  s.closePath();
  return s;
}

export function ellipseShape(rx = 0.5, ry = 0.5) {
  const s = new THREE.Shape();
  s.absellipse(0, 0, rx, ry, 0, Math.PI * 2, false, 0);
  return s;
}

export function triangleShape(w = 0.5, h = 0.5) {
  const s = new THREE.Shape();
  s.moveTo(-w, -h * 0.72);
  s.lineTo(w, -h * 0.72);
  s.lineTo(0, h * 0.72);
  s.closePath();
  return s;
}

export function zigzagShape(w = 0.9, h = 0.24, teeth = 4) {
  const s = new THREE.Shape();
  s.moveTo(-w, h * 0.2);
  const step = (w * 2) / teeth;
  for (let i = 0; i < teeth; i++) {
    s.lineTo(-w + step * (i + 0.5), -h);
    s.lineTo(-w + step * (i + 1), h * 0.2);
  }
  s.lineTo(w, h);
  s.lineTo(-w, h);
  s.closePath();
  return s;
}

export function batWingShape(flip = false) {
  const s = new THREE.Shape();
  const f = flip ? -1 : 1;
  s.moveTo(0, 0.16);
  s.quadraticCurveTo(0.26 * f, 0.62, 0.66 * f, 0.44);
  s.quadraticCurveTo(0.48 * f, 0.2, 0.74 * f, 0.05);
  s.quadraticCurveTo(0.46 * f, 0.02, 0.52 * f, -0.26);
  s.quadraticCurveTo(0.24 * f, -0.12, 0.06 * f, -0.32);
  s.closePath();
  return s;
}

// ---------- glow material helper ----------

const matCache = new Map();
export function glowMaterial(color, intensity = 1.6) {
  const key = color + '|' + intensity;
  if (!matCache.has(key)) {
    matCache.set(key, new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: intensity,
      roughness: 0.32,
      metalness: 0.0,
      side: THREE.DoubleSide,
    }));
  }
  return matCache.get(key);
}
