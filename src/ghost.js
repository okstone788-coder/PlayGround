import * as THREE from 'three';

function makeGlowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(220,245,255,0.85)');
  g.addColorStop(0.4, 'rgba(170,210,255,0.28)');
  g.addColorStop(1, 'rgba(120,160,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

export class Ghost {
  constructor(scene) {
    this.group = new THREE.Group();
    this.base = new THREE.Vector3(1.42, 2.02, 0.55);
    this.group.position.copy(this.base);
    this.cheer = 0;
    this.mood = 0;
    this.moodTimer = 0;

    const bodyMat = new THREE.MeshStandardMaterial({
      color: '#e8f4ff',
      emissive: '#9dc8ff',
      emissiveIntensity: 0.34,
      roughness: 0.55,
      metalness: 0,
      transparent: true,
      opacity: 0.96,
    });

    const profile = [
      [0.001, 0.54], [0.14, 0.52], [0.27, 0.42], [0.35, 0.24],
      [0.38, 0.02], [0.36, -0.18], [0.31, -0.36], [0.29, -0.44],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    const body = new THREE.Mesh(new THREE.LatheGeometry(profile, 36), bodyMat);
    body.castShadow = false;
    this.group.add(body);

    const lobeGeo = new THREE.SphereGeometry(0.085, 12, 10);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const lobe = new THREE.Mesh(lobeGeo, bodyMat);
      lobe.position.set(Math.cos(a) * 0.255, -0.42, Math.sin(a) * 0.255);
      lobe.scale.set(1.15, 0.9, 1.15);
      this.group.add(lobe);
    }

    const eyeMat = new THREE.MeshStandardMaterial({ color: '#2b1b3e', roughness: 0.35 });
    const eyeGeo = new THREE.SphereGeometry(1, 16, 12);
    for (const side of [-1, 1]) {
      const eye = new THREE.Mesh(eyeGeo, eyeMat);
      eye.scale.set(0.052, 0.078, 0.03);
      eye.position.set(side * 0.115, 0.13, 0.32);
      this.group.add(eye);

      const shine = new THREE.Mesh(eyeGeo, new THREE.MeshBasicMaterial({ color: '#ffffff' }));
      shine.scale.set(0.016, 0.022, 0.01);
      shine.position.set(side * 0.115 - 0.016, 0.152, 0.348);
      this.group.add(shine);

      const blush = new THREE.Mesh(
        new THREE.SphereGeometry(1, 12, 10),
        new THREE.MeshBasicMaterial({ color: '#ffa9c9', transparent: true, opacity: 0.8 }),
      );
      blush.scale.set(0.05, 0.03, 0.012);
      blush.position.set(side * 0.215, 0.045, 0.305);
      this.group.add(blush);
    }

    const mouth = new THREE.Mesh(
      new THREE.TorusGeometry(0.032, 0.011, 6, 14, Math.PI),
      eyeMat,
    );
    mouth.position.set(0, 0.03, 0.352);
    mouth.rotation.z = Math.PI;
    this.group.add(mouth);

    const armGeo = new THREE.SphereGeometry(0.075, 12, 10);
    for (const side of [-1, 1]) {
      const arm = new THREE.Mesh(armGeo, bodyMat);
      arm.scale.set(0.9, 1.5, 0.7);
      arm.position.set(side * 0.39, 0.0, 0.02);
      this.group.add(arm);
    }

    const glow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: makeGlowTexture(),
      color: '#bfe0ff',
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }));
    glow.scale.setScalar(2.3);
    glow.position.z = -0.4;
    this.group.add(glow);
    this.glow = glow;

    this.group.scale.setScalar(0.82);
    scene.add(this.group);
  }

  react(kind) {
    this.mood = kind === 'happy' ? 1 : -1;
    this.moodTimer = 1.8;
    if (kind === 'happy') this.cheer = 1;
  }

  update(dt, t) {
    this.cheer = Math.max(0, this.cheer - dt * 1.6);
    this.moodTimer = Math.max(0, this.moodTimer - dt);
    if (this.moodTimer === 0) this.mood = 0;

    const bob = Math.sin(t * 1.35) * 0.055;
    const hop = Math.sin((1 - this.cheer) * Math.PI) * 0;
    const jump = this.cheer > 0 ? Math.sin(this.cheer * Math.PI * 1.2) * 0.22 : 0;
    this.group.position.set(
      this.base.x + Math.sin(t * 0.6) * 0.035,
      this.base.y + bob + jump + hop,
      this.base.z,
    );
    const tilt = Math.sin(t * 0.9) * 0.035;
    this.group.rotation.z = tilt + this.mood * 0.1 * Math.sin(this.moodTimer * 8) * 0.4;
    this.group.rotation.y = Math.sin(t * 0.5) * 0.08;

    const pulse = 1 + this.cheer * 0.08;
    this.group.scale.setScalar(0.82 * pulse);
    this.glow.material.opacity = 0.55 + Math.sin(t * 2.2) * 0.1 + this.cheer * 0.25;
  }
}
