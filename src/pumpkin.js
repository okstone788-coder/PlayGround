import * as THREE from 'three';
import { PALETTES, FACES, ACCESSORIES, STAMPS, STAMP_LIMIT } from './data.js';
import {
  starShape, heartShape, ellipseShape, triangleShape, zigzagShape, batWingShape,
  glowMaterial,
} from './shapes.js';
import { createCharm } from './charms.js';

const DEG = Math.PI / 180;

function makeBlushTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(32, 32, 2, 32, 32, 31);
  g.addColorStop(0, 'rgba(255,255,255,0.95)');
  g.addColorStop(0.5, 'rgba(255,255,255,0.55)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

const _up = new THREE.Vector3(0, 1, 0);

export function deformDirection(v) {
  const lon = Math.atan2(v.z, v.x);
  const rib = 1 + 0.072 * Math.cos(lon * 8);
  const out = new THREE.Vector3(v.x * 0.96 * rib, v.y * 0.745, v.z * 0.96 * rib);
  const ay = Math.min(1, Math.abs(v.y));
  const pinch = 1 - 0.15 * Math.pow(ay, 6);
  out.x *= pinch;
  out.z *= pinch;
  return out;
}

function directionFromAngles(lonDeg, latDeg) {
  const lon = lonDeg * DEG;
  const lat = latDeg * DEG;
  return new THREE.Vector3(
    Math.sin(lon) * Math.cos(lat),
    Math.sin(lat),
    Math.cos(lon) * Math.cos(lat),
  ).normalize();
}

function basisQuaternion(normal, roll = 0) {
  const n = normal.clone().normalize();
  const up = Math.abs(n.dot(_up)) > 0.97 ? new THREE.Vector3(0, 0, 1) : _up;
  const right = new THREE.Vector3().crossVectors(up, n).normalize();
  const realUp = new THREE.Vector3().crossVectors(n, right).normalize();
  const m = new THREE.Matrix4().makeBasis(right, realUp, n);
  const q = new THREE.Quaternion().setFromRotationMatrix(m);
  if (roll) q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), roll));
  return q;
}

function ringArc(inner, outer, start, length) {
  return new THREE.RingGeometry(inner, outer, 30, 1, start, length);
}

export class Pumpkin {
  constructor(scene) {
    this.root = new THREE.Group();
    this.root.position.set(0, 1.34, 0);
    scene.add(this.root);

    this.paletteKey = 'ember';
    this.faceKey = 'happy';
    this.accessoryKey = 'none';
    this.stamps = [];
    this.pulse = 0;

    this._buildBody();
    this._buildStem();
    this._buildContactShadow();

    this.faceGroup = new THREE.Group();
    this.root.add(this.faceGroup);

    this.accessoryGroup = new THREE.Group();
    this.root.add(this.accessoryGroup);

    this.stampGroup = new THREE.Group();
    this.root.add(this.stampGroup);

    this.faceMat = new THREE.MeshStandardMaterial({
      color: '#351426',
      emissive: '#ffd36e',
      emissiveIntensity: 1.25,
      roughness: 0.35,
      metalness: 0,
    });
    this.socketMat = new THREE.MeshStandardMaterial({
      color: '#1c0712',
      roughness: 0.95,
      metalness: 0,
    });
    this.blushTex = makeBlushTexture();
    this.blushMat = new THREE.MeshBasicMaterial({
      map: this.blushTex,
      color: '#ff7fae',
      transparent: true,
      opacity: 0.62,
      depthWrite: false,
    });

    this.faceLight = new THREE.PointLight('#ffcf6e', 1.0, 4.2, 2);
    this.faceLight.position.set(0, 0.1, 0.35);
    this.root.add(this.faceLight);

    this.faceSpill = new THREE.PointLight('#ff9b45', 0.42, 2.6, 2);
    this.faceSpill.position.set(0, 0.16, 1.28);
    this.root.add(this.faceSpill);

    this.setFace('happy');
    this.setAccessory('none');

    // ghost preview for the stamping mechanic
    this.previewRoot = new THREE.Group();
    this.previewRoot.visible = false;
    this.root.add(this.previewRoot);
    this.previewType = null;
    this.previewMirror = false;

    this.raycaster = new THREE.Raycaster();
  }

  _buildBody() {
    const geo = new THREE.SphereGeometry(1, 128, 80);
    const pos = geo.attributes.position;
    const v = new THREE.Vector3();
    const colors = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).normalize();
      const d = deformDirection(v);
      pos.setXYZ(i, d.x, d.y, d.z);
      const lon = Math.atan2(v.z, v.x);
      const ridge = 0.5 + 0.5 * Math.cos(lon * 8);
      const shade = 0.66 + 0.34 * ridge;
      const grad = 0.72 + 0.32 * (v.y * 0.5 + 0.5);
      const speck = 1 + 0.02 * Math.sin(v.x * 42) * Math.sin(v.y * 31 + 1.4);
      const c = Math.min(1.04, shade * grad * speck);
      colors[i * 3] = c;
      colors[i * 3 + 1] = c;
      colors[i * 3 + 2] = c;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();

    const pal = PALETTES[this.paletteKey];
    this.bodyMat = new THREE.MeshPhysicalMaterial({
      vertexColors: true,
      color: pal.body,
      emissive: pal.dark,
      emissiveIntensity: 0.08,
      roughness: 0.78,
      metalness: 0,
      clearcoat: 0.05,
      clearcoatRoughness: 0.72,
      sheen: 0.1,
      sheenColor: new THREE.Color(pal.accent),
      sheenRoughness: 0.55,
    });
    this.body = new THREE.Mesh(geo, this.bodyMat);
    this.body.castShadow = true;
    this.body.receiveShadow = true;
    this.root.add(this.body);
  }

  _buildContactShadow() {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 62);
    g.addColorStop(0, 'rgba(8,2,14,0.75)');
    g.addColorStop(0.55, 'rgba(8,2,14,0.42)');
    g.addColorStop(1, 'rgba(8,2,14,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    const tex = new THREE.CanvasTexture(c);
    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(2.35, 2.35),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0.68 }),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = -0.685;
    this.root.add(shadow);
  }

  _buildStem() {
    this.stemGroup = new THREE.Group();
    const stemMat = new THREE.MeshStandardMaterial({
      color: '#7d4a28', roughness: 0.9, metalness: 0,
    });
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.74, 0),
      new THREE.Vector3(0.03, 0.87, 0.01),
      new THREE.Vector3(0.1, 0.98, 0.02),
      new THREE.Vector3(0.06, 1.08, 0.05),
    ]);
    const stem = new THREE.Mesh(new THREE.TubeGeometry(curve, 20, 0.06, 10, false), stemMat);
    stem.castShadow = true;
    this.stemGroup.add(stem);

    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 10), stemMat);
    cap.position.copy(curve.getPoint(1));
    this.stemGroup.add(cap);

    const vineMat = new THREE.MeshStandardMaterial({ color: '#5e9b5c', roughness: 0.8 });
    const vineCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.04, 0.8, 0.02),
      new THREE.Vector3(0.22, 0.86, 0.08),
      new THREE.Vector3(0.34, 0.72, 0.14),
      new THREE.Vector3(0.27, 0.56, 0.2),
      new THREE.Vector3(0.36, 0.48, 0.24),
    ]);
    const vine = new THREE.Mesh(new THREE.TubeGeometry(vineCurve, 30, 0.014, 6, false), vineMat);
    this.stemGroup.add(vine);

    const leafShape = new THREE.Shape();
    leafShape.moveTo(0, 0);
    leafShape.quadraticCurveTo(0.1, 0.08, 0.02, 0.2);
    leafShape.quadraticCurveTo(-0.08, 0.1, 0, 0);
    const leafGeo = new THREE.ShapeGeometry(leafShape);
    const leaf = new THREE.Mesh(leafGeo, vineMat);
    leaf.position.set(0.35, 0.62, 0.19);
    leaf.rotation.set(0.2, 0.4, 0.3);
    leaf.scale.setScalar(1.4);
    this.stemGroup.add(leaf);

    this.root.add(this.stemGroup);
  }

  // ---------- placement helpers ----------

  surfacePoint(lonDeg, latDeg, offset = 0) {
    const dir = directionFromAngles(lonDeg, latDeg);
    const p = deformDirection(dir);
    p.addScaledVector(dir, offset);
    return { point: p, dir };
  }

  placeObject(obj, lonDeg, latDeg, offset = 0.015, roll = 0) {
    const { point, dir } = this.surfacePoint(lonDeg, latDeg, offset);
    obj.position.copy(point);
    obj.quaternion.copy(basisQuaternion(dir, roll));
  }

  // ---------- palette / face / accessory ----------

  setPalette(key) {
    if (!PALETTES[key]) return;
    this.paletteKey = key;
    const pal = PALETTES[key];
    this.bodyMat.color.set(pal.body);
    this.bodyMat.emissive.set(pal.dark);
    this.bodyMat.sheenColor.set(pal.accent);
  }

  setFace(key) {
    if (!FACES[key]) return;
    this.faceKey = key;
    const face = FACES[key];
    this.faceGroup.clear();
    this.faceMat.emissive.set(face.glow);
    this.faceLight.color.set(face.glow);
    this.faceSpill.color.set(face.glow);

    const glow = this.faceMat;
    const socket = this.socketMat;

    const addPiece = (geometry, lon, lat, sx, sy, roll = 0, offset = 0.055) => {
      const s = new THREE.Mesh(geometry, socket);
      s.scale.set(sx * 1.3, sy * 1.3, 1);
      this.placeObject(s, lon, lat, offset - 0.012, roll);
      this.faceGroup.add(s);

      const m = new THREE.Mesh(geometry, glow);
      m.scale.set(sx, sy, 1);
      this.placeObject(m, lon, lat, offset, roll);
      this.faceGroup.add(m);
      return m;
    };

    const eyeLon = 15.5;
    const eyeLat = 9;
    const blush = (lon, lat) => {
      const b = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.17), this.blushMat);
      this.placeObject(b, lon, lat, 0.03);
      this.faceGroup.add(b);
    };

    const addGlint = (eye, x, y, size = 0.13) => {
      const glint = new THREE.Mesh(
        new THREE.ShapeGeometry(ellipseShape(size, size), 10),
        new THREE.MeshBasicMaterial({ color: '#fff8e8' }),
      );
      glint.position.set(x, y, 0.03);
      eye.add(glint);
    };

    if (key === 'happy') {
      const eyeGeo = new THREE.ShapeGeometry(ellipseShape(0.5, 0.5), 20);
      const l = addPiece(eyeGeo, -eyeLon, eyeLat, 0.18, 0.22);
      const r = addPiece(eyeGeo, eyeLon, eyeLat, 0.18, 0.22);
      addGlint(l, -0.16, 0.2, 0.15);
      addGlint(r, -0.16, 0.2, 0.15);
      const mouth = ringArc(0.3, 0.5, Math.PI * 1.12, Math.PI * 0.76);
      addPiece(mouth, 0, -18, 0.4, 0.34, 0, 0.035);
      blush(-29, -7);
      blush(29, -7);
    } else if (key === 'sleepy') {
      const arc = ringArc(0.3, 0.5, Math.PI * 0.12, Math.PI * 0.76);
      addPiece(arc, -eyeLon, eyeLat + 1, 0.4, 0.3);
      addPiece(arc, eyeLon, eyeLat + 1, 0.4, 0.3);
      const o = new THREE.TorusGeometry(0.1, 0.032, 8, 18);
      addPiece(o, 0, -18, 1.05, 1.05, 0, 0.04);
      blush(-30, -6);
      blush(30, -6);
      // tiny sleepy z
      const zGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-0.03, 0.05, 0), new THREE.Vector3(0.03, 0.05, 0),
        new THREE.Vector3(-0.03, -0.05, 0), new THREE.Vector3(0.03, -0.05, 0),
      ]);
      const z = new THREE.Line(zGeo, new THREE.LineBasicMaterial({ color: '#ffe9bd' }));
      z.position.set(0.12, 0.34, 0.01);
      this.faceGroup.add(z);
    } else if (key === 'wink') {
      const eyeGeo = new THREE.ShapeGeometry(ellipseShape(0.5, 0.5), 20);
      const l = addPiece(eyeGeo, -eyeLon, eyeLat, 0.18, 0.22);
      addGlint(l, -0.16, 0.2, 0.15);
      const arc = ringArc(0.3, 0.5, Math.PI * 0.12, Math.PI * 0.76);
      addPiece(arc, eyeLon, eyeLat + 1, 0.4, 0.3);
      const mouth = ringArc(0.3, 0.5, Math.PI * 1.12, Math.PI * 0.76);
      addPiece(mouth, 3, -18, 0.36, 0.32, 0.12, 0.035);
      blush(-29, -7);
      blush(29, -7);
    } else if (key === 'cat') {
      const eyeGeo = new THREE.ShapeGeometry(ellipseShape(0.5, 0.5), 20);
      const l = addPiece(eyeGeo, -eyeLon, eyeLat, 0.17, 0.22);
      const r = addPiece(eyeGeo, eyeLon, eyeLat, 0.17, 0.22);
      addGlint(l, -0.14, 0.18, 0.13);
      addGlint(r, -0.14, 0.18, 0.13);
      const slit = new THREE.ShapeGeometry(ellipseShape(0.16, 0.5), 12);
      const slitMat = new THREE.MeshBasicMaterial({ color: '#3a1226' });
      for (const eye of [l, r]) {
        const s = new THREE.Mesh(slit, slitMat);
        s.position.set(0, 0, 0.025);
        eye.add(s);
      }
      const nose = new THREE.Mesh(new THREE.ShapeGeometry(triangleShape(0.5, 0.5)), glowMaterial('#ff9ec9', 1.2));
      this.placeObject(nose, 0, -11.5, 0.06);
      nose.rotateZ(Math.PI);
      nose.scale.setScalar(0.055);
      this.faceGroup.add(nose);
      const arc = ringArc(0.3, 0.5, Math.PI * 1.12, Math.PI * 0.76);
      addPiece(arc, -4.5, -18, 0.18, 0.16, 0, 0.035);
      addPiece(arc, 4.5, -18, 0.18, 0.16, 0, 0.035);
      blush(-29, -8);
      blush(29, -8);
    } else if (key === 'spooky') {
      const tri = new THREE.ShapeGeometry(triangleShape(0.5, 0.5), 4);
      addPiece(tri, -16, 10, 0.2, 0.22, -0.1);
      addPiece(tri, 16, 10, 0.2, 0.22, 0.1);
      const zig = new THREE.ShapeGeometry(zigzagShape(0.9, 0.3, 5), 4);
      addPiece(zig, 0, -19, 0.34, 0.24, 0, 0.04);
    }

    this.faceGroup.traverse((o) => {
      if (o.isMesh) o.castShadow = false;
    });
  }

  setAccessory(key) {
    if (!ACCESSORIES[key]) return;
    this.accessoryKey = key;
    this.accessoryGroup.clear();
    this.wings = null;

    if (key === 'witch') {
      const g = new THREE.Group();
      g.position.set(0, 0.8, 0);
      g.rotation.set(0.06, 0, -0.11);

      const felt = new THREE.MeshStandardMaterial({ color: '#5c3fae', roughness: 0.72 });
      const feltDark = new THREE.MeshStandardMaterial({ color: '#432c86', roughness: 0.8 });
      const gold = new THREE.MeshStandardMaterial({
        color: '#ffd36e', emissive: '#ffb62e', emissiveIntensity: 0.5, roughness: 0.35, metalness: 0.3,
      });

      const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.66, 0.7, 0.055, 48), feltDark);
      brim.position.y = 0.02;
      brim.castShadow = true;
      g.add(brim);

      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.86, 40), felt);
      cone.position.y = 0.47;
      cone.rotation.z = 0.05;
      cone.castShadow = true;
      g.add(cone);

      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.3, 24), felt);
      tip.position.set(0.1, 0.92, 0);
      tip.rotation.z = -0.35;
      tip.castShadow = true;
      g.add(tip);

      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.335, 0.37, 0.13, 40), gold);
      band.position.y = 0.12;
      g.add(band);

      const buckle = new THREE.Mesh(new THREE.ShapeGeometry(starShape(1, 0.45, 5)), gold);
      buckle.position.set(0, 0.12, 0.36);
      buckle.scale.setScalar(0.075);
      g.add(buckle);

      const bobble = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 10), gold);
      bobble.position.set(0.19, 1.03, 0);
      g.add(bobble);

      this.accessoryGroup.add(g);
      this.hatGroup = g;
    } else if (key === 'bow') {
      const g = new THREE.Group();
      const pink = new THREE.MeshStandardMaterial({
        color: '#ff8fba', roughness: 0.55,
      });
      const cream = new THREE.MeshStandardMaterial({ color: '#ffe9c9', roughness: 0.6 });

      const loopGeo = new THREE.SphereGeometry(1, 20, 14);
      const l = new THREE.Mesh(loopGeo, pink);
      l.scale.set(0.23, 0.15, 0.075);
      l.position.set(-0.17, 0.03, 0);
      l.rotation.z = 0.42;
      const r = new THREE.Mesh(loopGeo, pink);
      r.scale.set(0.23, 0.15, 0.075);
      r.position.set(0.17, 0.03, 0);
      r.rotation.z = -0.42;

      const knot = new THREE.Mesh(new THREE.SphereGeometry(0.095, 16, 12), cream);
      knot.position.z = 0.02;

      const tailGeo = new THREE.SphereGeometry(1, 14, 10);
      const t1 = new THREE.Mesh(tailGeo, pink);
      t1.scale.set(0.06, 0.17, 0.035);
      t1.position.set(-0.08, -0.18, -0.01);
      t1.rotation.z = 0.22;
      const t2 = new THREE.Mesh(tailGeo, pink);
      t2.scale.set(0.06, 0.17, 0.035);
      t2.position.set(0.08, -0.18, -0.01);
      t2.rotation.z = -0.22;

      g.add(l, r, knot, t1, t2);
      g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
      this.placeObject(g, 38, 52, 0.1, -0.25);
      this.accessoryGroup.add(g);
    } else if (key === 'crown') {
      const g = new THREE.Group();
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.53, 0.016, 8, 64),
        new THREE.MeshStandardMaterial({ color: '#ffd36e', emissive: '#ffb62e', emissiveIntensity: 0.6, roughness: 0.3, metalness: 0.4 }),
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.64;
      g.add(ring);

      const petalMat = new THREE.MeshStandardMaterial({
        color: '#ffb3cf', emissive: '#ff7fae', emissiveIntensity: 0.18, roughness: 0.6,
      });
      const petalMat2 = new THREE.MeshStandardMaterial({ color: '#fff0c9', roughness: 0.55 });
      const leafMat = new THREE.MeshStandardMaterial({ color: '#71c48f', roughness: 0.7 });

      const petalGeo = new THREE.SphereGeometry(0.045, 10, 8);
      const centerGeo = new THREE.SphereGeometry(0.032, 10, 8);
      for (let i = 0; i < 8; i++) {
        const lon = (i / 8) * 360 + 22;
        const lat = 56;
        const { point, dir } = this.surfacePoint(lon, lat, 0.03);
        const flower = new THREE.Group();
        flower.position.copy(point);
        flower.quaternion.copy(basisQuaternion(dir));
        for (let p = 0; p < 5; p++) {
          const a = (p / 5) * Math.PI * 2;
          const petal = new THREE.Mesh(petalGeo, i % 2 ? petalMat : petalMat2);
          petal.position.set(Math.cos(a) * 0.05, Math.sin(a) * 0.05, 0);
          petal.scale.set(1, 1.3, 0.5);
          flower.add(petal);
        }
        const heart = new THREE.Mesh(centerGeo, petalMat2);
        heart.position.z = 0.015;
        flower.add(heart);
        g.add(flower);

        const leaf = new THREE.Mesh(petalGeo, leafMat);
        leaf.scale.set(0.6, 1.4, 0.3);
        const lp = this.surfacePoint(lon + 22, lat - 2, 0.02);
        leaf.position.copy(lp.point);
        leaf.quaternion.copy(basisQuaternion(lp.dir, 0.8));
        g.add(leaf);
      }
      g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
      this.accessoryGroup.add(g);
    } else if (key === 'ears') {
      const g = new THREE.Group();
      const dark = new THREE.MeshStandardMaterial({ color: '#4b3568', roughness: 0.7 });
      const pink = new THREE.MeshStandardMaterial({ color: '#ffa5c4', roughness: 0.6 });
      for (const side of [-1, 1]) {
        const { point } = this.surfacePoint(side * 36, 52, 0.02);
        const ear = new THREE.Group();
        ear.position.copy(point);
        ear.rotation.z = side * -0.28;
        ear.rotation.x = -0.08;
        const outer = new THREE.Mesh(new THREE.ConeGeometry(0.19, 0.38, 4), dark);
        outer.position.y = 0.17;
        outer.rotation.y = Math.PI / 4;
        outer.castShadow = true;
        const inner = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.24, 4), pink);
        inner.position.set(0, 0.13, 0.05);
        inner.rotation.y = Math.PI / 4;
        ear.add(outer, inner);
        g.add(ear);
      }
      this.accessoryGroup.add(g);
    } else if (key === 'wings') {
      const g = new THREE.Group();
      const wingMat = new THREE.MeshStandardMaterial({
        color: '#4a2f7a', emissive: '#7b4dd6', emissiveIntensity: 0.35,
        roughness: 0.55, side: THREE.DoubleSide,
      });
      const wingGeo = new THREE.ShapeGeometry(batWingShape(false), 20);
      const pivots = [];
      for (const side of [-1, 1]) {
        const pivot = new THREE.Group();
        pivot.position.set(side * 0.45, 0.12, -0.42);
        const wing = new THREE.Mesh(wingGeo, wingMat);
        wing.scale.set(side * 1.05, 1.05, 1);
        wing.position.set(side * 0.4, 0, 0);
        wing.castShadow = true;
        pivot.add(wing);
        pivot.rotation.y = side * 0.55;
        pivot.rotation.z = side * -0.15;
        g.add(pivot);
        pivots.push(pivot);
      }
      this.wings = pivots;
      this.accessoryGroup.add(g);
    }
  }

  // ---------- glow stamps ----------

  addStamp(type, localPoint, localNormal, { roll = Math.random() * Math.PI * 2, mirror = false } = {}) {
    if (!STAMPS[type]) return null;
    if (this.stamps.length >= STAMP_LIMIT) return 'full';
    const scale = 0.135 * (0.9 + Math.random() * 0.25);
    const charm = createCharm(type, { scale });
    const normal = localNormal.clone().normalize();
    charm.position.copy(localPoint).addScaledVector(normal, 0.022);
    charm.quaternion.copy(basisQuaternion(normal, roll));
    charm.userData.baseScale = scale;
    charm.scale.setScalar(0.0001);
    this.stampGroup.add(charm);

    const entry = { group: charm, type, spawn: 0, roll };
    this.stamps.push(entry);
    this.pulse = 1;

    if (mirror) {
      const mPoint = new THREE.Vector3(-localPoint.x, localPoint.y, localPoint.z);
      const mNormal = new THREE.Vector3(-normal.x, normal.y, normal.z).normalize();
      const mCharm = createCharm(type, { scale });
      mCharm.position.copy(mPoint).addScaledVector(mNormal, 0.022);
      mCharm.quaternion.copy(basisQuaternion(mNormal, -roll));
      mCharm.userData.baseScale = scale;
      mCharm.scale.setScalar(0.0001);
      this.stampGroup.add(mCharm);
      this.stamps.push({ group: mCharm, type, spawn: 0, roll: -roll });
    }

    this.refreshPreview();
    return entry;
  }

  undoStamp() {
    const entry = this.stamps.pop();
    if (!entry) return false;
    this.stampGroup.remove(entry.group);
    return true;
  }

  clearStamps() {
    this.stamps.forEach((s) => this.stampGroup.remove(s.group));
    this.stamps.length = 0;
  }

  stampCounts() {
    const counts = {};
    for (const s of this.stamps) counts[s.type] = (counts[s.type] || 0) + 1;
    return counts;
  }

  // ---------- preview ----------

  setPreview(type, localPoint, localNormal, mirror) {
    if (!type) { this.previewRoot.visible = false; return; }
    if (this.previewType !== type || this.previewMirror !== mirror) {
      this.previewRoot.clear();
      this.previewType = type;
      this.previewMirror = mirror;
      const scale = 0.135;
      const a = createCharm(type, { ghost: true, scale });
      this.previewRoot.add(a);
      if (mirror) {
        const b = createCharm(type, { ghost: true, scale });
        this.previewRoot.add(b);
      }
    }
    const normal = localNormal.clone().normalize();
    const a = this.previewRoot.children[0];
    a.position.copy(localPoint).addScaledVector(normal, 0.026);
    a.quaternion.copy(basisQuaternion(normal, 0.3));
    if (mirror && this.previewRoot.children[1]) {
      const b = this.previewRoot.children[1];
      const mp = new THREE.Vector3(-localPoint.x, localPoint.y, localPoint.z);
      const mn = new THREE.Vector3(-normal.x, normal.y, normal.z).normalize();
      b.position.copy(mp).addScaledVector(mn, 0.026);
      b.quaternion.copy(basisQuaternion(mn, -0.3));
    }
    this.previewRoot.visible = true;
  }

  hidePreview() {
    this.previewRoot.visible = false;
  }

  refreshPreview() {
    // preview material/state stays; nothing to do but keep API tidy
  }

  // ---------- raycasting ----------

  raycast(raycaster) {
    const hits = raycaster.intersectObject(this.body, false);
    return hits.length ? hits[0] : null;
  }

  getStats() {
    return {
      palette: this.paletteKey,
      face: this.faceKey,
      accessory: this.accessoryKey,
      counts: this.stampCounts(),
      totalStamps: this.stamps.length,
    };
  }

  update(dt, t) {
    this.pulse = Math.max(0, this.pulse - dt * 3.2);
    const p = 1 + this.pulse * 0.028;
    this.body.scale.set(p, 1 + this.pulse * 0.012, p);

    this.stemGroup.rotation.z = Math.sin(t * 1.1) * 0.018;
    this.stemGroup.rotation.x = Math.cos(t * 0.9) * 0.012;

    this.faceLight.intensity = 0.95 + Math.sin(t * 2.3) * 0.1 + Math.sin(t * 7.1) * 0.04;
    this.faceSpill.intensity = 0.4 + Math.sin(t * 2.7) * 0.04;

    for (const s of this.stamps) {
      if (s.spawn < 1) {
        s.spawn = Math.min(1, s.spawn + dt * 4.2);
        const e = 1 - Math.pow(1 - s.spawn, 3);
        const overshoot = 1 + Math.sin(s.spawn * Math.PI) * 0.22;
        s.group.scale.setScalar(s.group.userData.baseScale * e * overshoot);
      }
    }

    if (this.wings) {
      const flap = Math.sin(t * 2.6) * 0.16;
      this.wings[0].rotation.z = -0.15 + flap;
      this.wings[1].rotation.z = 0.15 - flap;
    }
    if (this.hatGroup) {
      this.hatGroup.rotation.z = -0.11 + Math.sin(t * 1.4) * 0.018;
    }
  }
}
