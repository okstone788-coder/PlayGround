import * as THREE from 'three';
import { STAMPS } from './data.js';
import {
  starShape, heartShape, moonShape, ellipseShape, batWingShape, glowMaterial,
} from './shapes.js';

function flat(shape, material, scale = 1) {
  const g = new THREE.ShapeGeometry(shape, 18);
  const m = new THREE.Mesh(g, material);
  m.scale.setScalar(scale);
  return m;
}

/**
 * Builds a little glowing charm lying in the XY plane, facing +Z.
 * Real charms are ~0.22 world units wide before the group scale is applied.
 */
export function createCharm(type, { ghost = false, scale = 1 } = {}) {
  const info = STAMPS[type] || STAMPS.star;
  const group = new THREE.Group();
  const mat = ghost
    ? new THREE.MeshBasicMaterial({ color: info.glow, transparent: true, opacity: 0.5, depthWrite: false })
    : glowMaterial(info.color, 1.3);
  const softMat = ghost
    ? mat
    : glowMaterial(info.glow, 0.55);
  const whiteMat = ghost
    ? mat
    : new THREE.MeshBasicMaterial({ color: '#fff9ee' });

  if (type === 'star') {
    group.add(flat(starShape(1, 0.45, 5), mat));
    const dot = flat(ellipseShape(0.12, 0.12), whiteMat);
    dot.position.set(0.22, 0.24, 0.012);
    group.add(dot);
  } else if (type === 'heart') {
    group.add(flat(heartShape(), mat));
    const shine = flat(ellipseShape(0.12, 0.19), whiteMat);
    shine.position.set(-0.32, 0.3, 0.012);
    shine.rotation.z = 0.6;
    group.add(shine);
  } else if (type === 'moon') {
    group.add(flat(moonShape(), mat));
    const c1 = flat(ellipseShape(0.13, 0.13), softMat);
    c1.position.set(-0.06, 0.3, 0.012);
    const c2 = flat(ellipseShape(0.08, 0.08), softMat);
    c2.position.set(-0.22, -0.18, 0.012);
    group.add(c1, c2);
  } else if (type === 'flower') {
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const petal = flat(ellipseShape(0.34, 0.5), mat);
      petal.position.set(Math.cos(a) * 0.4, Math.sin(a) * 0.4, 0);
      petal.rotation.z = a - Math.PI / 2;
      group.add(petal);
    }
    group.add(flat(ellipseShape(0.26, 0.26), ghost ? mat : glowMaterial('#fff0c9', 1.1)));
  } else if (type === 'bat') {
    const wingL = flat(batWingShape(false), mat);
    wingL.scale.setScalar(0.9);
    wingL.position.set(0, -0.02, 0);
    const wingR = flat(batWingShape(true), mat);
    wingR.scale.setScalar(0.9);
    wingR.position.set(0, -0.02, 0);
    const body = flat(ellipseShape(0.15, 0.4), mat);
    body.position.set(0, -0.04, 0.002);
    const eyeL = flat(ellipseShape(0.045, 0.06), whiteMat);
    eyeL.position.set(-0.07, 0.12, 0.015);
    const eyeR = eyeL.clone();
    eyeR.position.x = 0.07;
    group.add(wingL, wingR, body, eyeL, eyeR);
  } else {
    group.add(flat(starShape(), mat));
  }

  group.scale.setScalar(scale);
  group.traverse((o) => {
    if (o.isMesh) o.renderOrder = 2;
  });
  return group;
}
