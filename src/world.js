import * as THREE from 'three';

function makeRadialTexture(inner = 'rgba(255,240,200,1)', outer = 'rgba(255,200,120,0)', size = 128) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, inner);
  g.addColorStop(0.35, inner.replace(/[\d.]+\)$/, '0.55)'));
  g.addColorStop(1, outer);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeMoonTexture() {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#fff3d4';
  ctx.fillRect(0, 0, 256, 256);
  const craters = [
    [70, 90, 22], [160, 70, 14], [190, 160, 26], [100, 175, 12], [50, 180, 9], [140, 130, 18],
  ];
  for (const [x, y, r] of craters) {
    const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
    g.addColorStop(0, 'rgba(226,206,170,0.55)');
    g.addColorStop(1, 'rgba(226,206,170,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function miniPumpkinGeometry() {
  const geo = new THREE.SphereGeometry(1, 40, 26);
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i).normalize();
    const lon = Math.atan2(v.z, v.x);
    const rib = 1 + 0.07 * Math.cos(lon * 8);
    pos.setXYZ(i, v.x * 0.95 * rib, v.y * 0.7, v.z * 0.95 * rib);
  }
  geo.computeVertexNormals();
  return geo;
}

function buildMiniPumpkin(color, scale = 1) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    miniPumpkinGeometry(),
    new THREE.MeshStandardMaterial({ color, roughness: 0.55 }),
  );
  body.castShadow = true;
  body.receiveShadow = true;
  body.scale.setScalar(scale);
  g.add(body);
  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04 * scale, 0.06 * scale, 0.16 * scale, 6),
    new THREE.MeshStandardMaterial({ color: '#6d4a2c', roughness: 0.9 }),
  );
  stem.position.y = 0.68 * scale;
  stem.rotation.z = 0.15;
  g.add(stem);
  return g;
}

function makeHayTexture() {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#b0833d';
  ctx.fillRect(0, 0, 256, 128);
  for (let i = 0; i < 120; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 128;
    const len = 8 + Math.random() * 26;
    ctx.strokeStyle = Math.random() > 0.5 ? 'rgba(90,58,20,0.45)' : 'rgba(232,190,110,0.5)';
    ctx.lineWidth = 1 + Math.random();
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (Math.random() - 0.5) * 8, y + len);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function buildTree(scale = 1) {
  const g = new THREE.Group();
  const trunkMat = new THREE.MeshStandardMaterial({ color: '#2a1c3a', roughness: 0.95 });
  const leafMat = new THREE.MeshStandardMaterial({ color: '#241a3c', roughness: 0.95 });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16 * scale, 0.24 * scale, 2.2 * scale, 8), trunkMat);
  trunk.position.y = 1.1 * scale;
  g.add(trunk);
  for (let i = 0; i < 3; i++) {
    const cone = new THREE.Mesh(new THREE.ConeGeometry((1.1 - i * 0.26) * scale, 1.5 * scale, 9), leafMat);
    cone.position.y = (2.2 + i * 0.7) * scale;
    cone.rotation.y = i * 0.5;
    g.add(cone);
  }
  return g;
}

function buildFence() {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: '#3b2a45', roughness: 0.9 });
  for (let x = -8; x <= 8; x += 1.6) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.2, 0.16), mat);
    post.position.set(x, 0.6, 0);
    g.add(post);
  }
  for (const y of [0.45, 0.95]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(16.4, 0.12, 0.1), mat);
    rail.position.set(0, y, 0.02);
    g.add(rail);
  }
  g.position.set(0, 0, -7.5);
  return g;
}

function buildStringLights(scene) {
  const bulbGeo = new THREE.SphereGeometry(0.055, 10, 8);
  const bulbMat = new THREE.MeshBasicMaterial({ color: '#ffd98a' });
  const wireMat = new THREE.MeshStandardMaterial({ color: '#1d1428', roughness: 1 });
  const colors = ['#ffd98a', '#ffb3d1', '#bcd7ff', '#ffd98a'];

  for (const [z, y0, y1, sway] of [[-3.6, 3.0, 3.2, 0.9], [-5.6, 3.6, 3.8, 1.3]]) {
    const pts = [];
    for (let i = 0; i <= 10; i++) {
      const x = -5.2 + (i / 10) * 10.4;
      const sag = Math.sin((i / 10) * Math.PI) * sway;
      pts.push(new THREE.Vector3(x, y0 + (y1 - y0) * (i / 10) - sag, z));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const wire = new THREE.Mesh(new THREE.TubeGeometry(curve, 40, 0.012, 5, false), wireMat);
    scene.add(wire);
    for (let i = 1; i < 10; i++) {
      const p = curve.getPoint(i / 10);
      const bulb = new THREE.Mesh(bulbGeo, new THREE.MeshBasicMaterial({ color: colors[i % colors.length] }));
      bulb.position.copy(p).add(new THREE.Vector3(0, -0.07, 0));
      bulb.scale.setScalar(0.9 + Math.random() * 0.3);
      scene.add(bulb);
    }
  }

  const warm = new THREE.PointLight('#ffb367', 12, 14, 2);
  warm.position.set(0, 2.8, -4.2);
  scene.add(warm);
}

export function createWorld(scene, renderer) {
  scene.fog = new THREE.FogExp2('#1a1130', 0.026);

  // ----- sky dome -----
  const skyGeo = new THREE.SphereGeometry(70, 40, 24);
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      top: { value: new THREE.Color('#0a0718') },
      horizon: { value: new THREE.Color('#3c2358') },
      bottom: { value: new THREE.Color('#170e26') },
      moonGlow: { value: new THREE.Color('#5b3f7d') },
    },
    vertexShader: `
      varying vec3 vPos;
      void main() {
        vPos = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vPos;
      uniform vec3 top;
      uniform vec3 horizon;
      uniform vec3 bottom;
      uniform vec3 moonGlow;
      void main() {
        vec3 d = normalize(vPos);
        float h = clamp(d.y * 0.5 + 0.5, 0.0, 1.0);
        vec3 c = mix(bottom, horizon, smoothstep(0.3, 0.52, h));
        c = mix(c, top, smoothstep(0.52, 0.95, h));
        float moon = pow(max(dot(d, normalize(vec3(-0.34, 0.5, -0.8))), 0.0), 8.0);
        c += moonGlow * moon * 0.55;
        gl_FragColor = vec4(c, 1.0);
      }
    `,
  });
  const sky = new THREE.Mesh(skyGeo, skyMat);
  scene.add(sky);

  // ----- stars -----
  const starCount = 750;
  const starPos = new Float32Array(starCount * 3);
  const starSize = new Float32Array(starCount);
  for (let i = 0; i < starCount; i++) {
    const a = Math.random() * Math.PI * 2;
    const y = Math.pow(Math.random(), 0.7) * 0.95 + 0.05;
    const r = Math.sqrt(1 - y * y);
    starPos[i * 3] = Math.cos(a) * r * 50;
    starPos[i * 3 + 1] = y * 50;
    starPos[i * 3 + 2] = Math.sin(a) * r * 50;
    starSize[i] = 0.4 + Math.random() * 1.6;
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  starGeo.setAttribute('aSize', new THREE.BufferAttribute(starSize, 1));
  const starMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { uTime: { value: 0 } },
    vertexShader: `
      attribute float aSize;
      uniform float uTime;
      varying float vTwinkle;
      void main() {
        vTwinkle = 0.55 + 0.45 * sin(uTime * 1.5 + aSize * 40.0);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = aSize * 3.0;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      varying float vTwinkle;
      void main() {
        float d = distance(gl_PointCoord, vec2(0.5));
        if (d > 0.5) discard;
        float a = smoothstep(0.5, 0.05, d) * vTwinkle;
        gl_FragColor = vec4(0.95, 0.92, 1.0, a);
      }
    `,
  });
  const stars = new THREE.Points(starGeo, starMat);
  scene.add(stars);

  // ----- moon -----
  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(1.4, 32, 24),
    new THREE.MeshBasicMaterial({ map: makeMoonTexture(), color: '#fff3d4', fog: false }),
  );
  moon.position.set(5.5, 6.6, -16);
  scene.add(moon);
  const moonGlow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeRadialTexture('rgba(255,240,205,1)', 'rgba(255,210,140,0)', 256),
    color: '#ffe8b8', transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, fog: false,
  }));
  moonGlow.position.copy(moon.position);
  moonGlow.scale.setScalar(8);
  scene.add(moonGlow);

  // horizon glow
  const haze = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeRadialTexture('rgba(160,110,210,1)', 'rgba(80,40,120,0)', 256),
    color: '#a06bd8', transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending, depthWrite: false, fog: false,
  }));
  haze.position.set(0, 3.5, -30);
  haze.scale.set(48, 22, 1);
  scene.add(haze);

  // ----- ground -----
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(38, 64),
    new THREE.MeshStandardMaterial({ color: '#241834', roughness: 1, metalness: 0 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const moss = new THREE.Mesh(
    new THREE.CircleGeometry(6.4, 48),
    new THREE.MeshStandardMaterial({ color: '#2a3c3c', roughness: 1 }),
  );
  moss.rotation.x = -Math.PI / 2;
  moss.position.y = 0.005;
  moss.receiveShadow = true;
  scene.add(moss);

  // stepping stones
  const stoneMat = new THREE.MeshStandardMaterial({ color: '#4a3d5c', roughness: 0.9 });
  for (let i = 0; i < 5; i++) {
    const s = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.42, 0.1, 9), stoneMat);
    s.position.set(-2.3 - i * 0.55, 0.05, 2.4 + i * 0.65);
    s.rotation.y = i * 0.7;
    s.receiveShadow = true;
    scene.add(s);
  }

  // ----- pedestal -----
  const pedestal = new THREE.Group();
  const stone = new THREE.Mesh(
    new THREE.CylinderGeometry(1.28, 1.42, 0.52, 32),
    new THREE.MeshStandardMaterial({ color: '#433455', roughness: 0.92 }),
  );
  stone.position.y = 0.26;
  stone.castShadow = true;
  stone.receiveShadow = true;
  pedestal.add(stone);

  const woodTop = new THREE.Mesh(
    new THREE.CylinderGeometry(1.16, 1.2, 0.14, 32),
    new THREE.MeshStandardMaterial({ color: '#6d4b34', roughness: 0.8 }),
  );
  woodTop.position.y = 0.58;
  woodTop.castShadow = true;
  woodTop.receiveShadow = true;
  pedestal.add(woodTop);

  const mossTop = new THREE.Mesh(
    new THREE.CylinderGeometry(1.13, 1.13, 0.035, 32),
    new THREE.MeshStandardMaterial({ color: '#3e5b4a', roughness: 0.95 }),
  );
  mossTop.position.y = 0.665;
  mossTop.receiveShadow = true;
  pedestal.add(mossTop);

  // little star runes around the stone
  const runeMat = new THREE.MeshBasicMaterial({ color: '#c6a6ff', transparent: true, opacity: 0.55 });
  const runeShape = new THREE.Shape();
  for (let p = 0; p < 10; p++) {
    const a = (p / 10) * Math.PI * 2 - Math.PI / 2;
    const r = p % 2 === 0 ? 1 : 0.45;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (p === 0) runeShape.moveTo(x, y); else runeShape.lineTo(x, y);
  }
  runeShape.closePath();
  const runeGeo = new THREE.ShapeGeometry(runeShape);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const rune = new THREE.Mesh(runeGeo, runeMat);
    rune.position.set(Math.cos(a) * 1.37, 0.3, Math.sin(a) * 1.37);
    rune.rotation.y = -a + Math.PI / 2;
    rune.scale.setScalar(0.055);
    pedestal.add(rune);
  }
  scene.add(pedestal);

  // ----- scenery -----
  const treeSpots = [
    [-9, -6, 1.2], [7.5, -8, 1.4], [-13, -10, 1.6], [13, -12, 1.5],
    [-17, -4, 1.8], [17, -3, 1.7], [-20, 4, 2], [20, 6, 1.9],
    [-11, -15, 1.3], [11, -16, 1.4],
  ];
  for (const [x, z, s] of treeSpots) {
    const t = buildTree(s);
    t.position.set(x, 0, z);
    t.rotation.y = Math.random() * Math.PI;
    scene.add(t);
  }

  const fence = buildFence();
  scene.add(fence);

  buildStringLights(scene);

  // hay bales
  const hayTex = makeHayTexture();
  const hayMat = new THREE.MeshStandardMaterial({ map: hayTex, color: '#d7ad63', roughness: 0.98 });
  const hayCap = new THREE.MeshStandardMaterial({ color: '#8e6528', roughness: 0.95 });
  const bandMat = new THREE.MeshStandardMaterial({ color: '#6d4a22', roughness: 0.9 });
  for (const [x, z, ry, s] of [[-3.3, -1.6, 0.4, 0.8], [3.4, -2.2, -0.3, 0.65], [4.6, 0.4, 1.1, 0.55]]) {
    const hay = new THREE.Group();
    const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 1.15, 20), [hayMat, hayCap, hayCap]);
    roll.rotation.z = Math.PI / 2;
    roll.castShadow = true;
    roll.receiveShadow = true;
    hay.add(roll);
    for (const off of [-0.3, 0.3]) {
      const band = new THREE.Mesh(new THREE.TorusGeometry(0.63, 0.035, 6, 24), bandMat);
      band.rotation.y = Math.PI / 2;
      band.position.x = off;
      hay.add(band);
    }
    hay.position.set(x, 0.62 * s, z);
    hay.rotation.y = ry;
    hay.scale.setScalar(s);
    scene.add(hay);
  }

  // mini pumpkins
  const miniColors = ['#ff9248', '#ffb27a', '#d9c07a', '#b78cd6', '#ff8fae'];
  for (let i = 0; i < 12; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 2.2 + Math.random() * 5.5;
    const size = 0.16 + Math.random() * 0.16;
    const p = buildMiniPumpkin(miniColors[i % miniColors.length], size);
    p.position.set(Math.cos(a) * r, size * 0.62, Math.sin(a) * r * 0.8 + 0.6);
    p.rotation.y = Math.random() * Math.PI;
    scene.add(p);
  }

  // glowing mushrooms
  const mushroomSpots = [[-2.1, 1.1, 0.5], [2.0, 1.35, 0.4], [-1.5, -2.0, 0.35], [1.7, -2.3, 0.3]];
  for (const [x, z, s] of mushroomSpots) {
    const m = new THREE.Group();
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.07, 0.32, 8),
      new THREE.MeshStandardMaterial({ color: '#d8d0e8', roughness: 0.7 }),
    );
    stem.position.y = 0.16;
    const cap = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: '#8ff0e0', emissive: '#4ad9c9', emissiveIntensity: 0.8, roughness: 0.4 }),
    );
    cap.position.y = 0.32;
    cap.scale.y = 0.8;
    const glow = new THREE.PointLight('#7ff0df', 1.2, 2.2, 2);
    glow.position.y = 0.35;
    m.add(stem, cap, glow);
    m.position.set(x, 0, z);
    m.scale.setScalar(s * 2.2);
    scene.add(m);
  }

  // grass tufts
  const grassGeo = new THREE.ConeGeometry(0.03, 0.3, 4);
  const grassMat = new THREE.MeshStandardMaterial({ color: '#2f4a44', roughness: 1 });
  const grass = new THREE.InstancedMesh(grassGeo, grassMat, 90);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < 90; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 2.5 + Math.random() * 8;
    dummy.position.set(Math.cos(a) * r, 0.14, Math.sin(a) * r * 0.8 + 0.8);
    dummy.rotation.set((Math.random() - 0.5) * 0.4, Math.random() * Math.PI, (Math.random() - 0.5) * 0.4);
    dummy.scale.setScalar(0.7 + Math.random() * 0.9);
    dummy.updateMatrix();
    grass.setMatrixAt(i, dummy.matrix);
  }
  scene.add(grass);

  // ----- fireflies -----
  const fireflyCount = 90;
  const ffPos = new Float32Array(fireflyCount * 3);
  const ffSeed = new Float32Array(fireflyCount);
  for (let i = 0; i < fireflyCount; i++) {
    ffPos[i * 3] = (Math.random() - 0.5) * 13;
    ffPos[i * 3 + 1] = 0.5 + Math.random() * 3.6;
    ffPos[i * 3 + 2] = (Math.random() - 0.5) * 8 - 0.5;
    ffSeed[i] = Math.random() * 100;
  }
  const ffGeo = new THREE.BufferGeometry();
  ffGeo.setAttribute('position', new THREE.BufferAttribute(ffPos, 3));
  ffGeo.setAttribute('aSeed', new THREE.BufferAttribute(ffSeed, 1));
  const ffMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uTex: { value: makeRadialTexture('rgba(255,238,160,1)', 'rgba(255,200,80,0)', 64) },
    },
    vertexShader: `
      attribute float aSeed;
      uniform float uTime;
      varying float vAlpha;
      void main() {
        vec3 p = position;
        p.x += sin(uTime * 0.6 + aSeed) * 0.5;
        p.y += sin(uTime * 0.9 + aSeed * 1.7) * 0.28;
        p.z += cos(uTime * 0.5 + aSeed * 0.8) * 0.5;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        vAlpha = 0.35 + 0.65 * (0.5 + 0.5 * sin(uTime * 2.0 + aSeed * 3.0));
        gl_PointSize = 8.0 * (14.0 / -mv.z);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      uniform sampler2D uTex;
      varying float vAlpha;
      void main() {
        vec4 t = texture2D(uTex, gl_PointCoord);
        gl_FragColor = vec4(t.rgb, t.a * vAlpha);
      }
    `,
  });
  const fireflies = new THREE.Points(ffGeo, ffMat);
  scene.add(fireflies);

  // ----- lights -----
  const hemi = new THREE.HemisphereLight('#9b86e8', '#241435', 0.46);
  scene.add(hemi);

  const moonLight = new THREE.DirectionalLight('#c6d8ff', 1.15);
  moonLight.position.set(-5, 8, 4);
  moonLight.castShadow = true;
  moonLight.shadow.mapSize.set(2048, 2048);
  moonLight.shadow.camera.left = -4.5;
  moonLight.shadow.camera.right = 4.5;
  moonLight.shadow.camera.top = 4.5;
  moonLight.shadow.camera.bottom = -4.5;
  moonLight.shadow.camera.near = 0.5;
  moonLight.shadow.camera.far = 22;
  moonLight.shadow.bias = -0.0008;
  moonLight.shadow.normalBias = 0.02;
  scene.add(moonLight);

  const rim = new THREE.PointLight('#ff6fae', 5, 10, 2);
  rim.position.set(3.4, 2.2, 2.6);
  scene.add(rim);

  const fill = new THREE.DirectionalLight('#ffd0a0', 0.5);
  fill.position.set(2.5, 3.5, 6);
  scene.add(fill);

  const underGlow = new THREE.PointLight('#a87cff', 4.5, 6, 2);
  underGlow.position.set(0, 0.8, 1.6);
  scene.add(underGlow);

  const warmKey = new THREE.PointLight('#ffb066', 5, 11, 2);
  warmKey.position.set(-2.6, 2.2, 3.6);
  scene.add(warmKey);

  return {
    update(dt, t) {
      starMat.uniforms.uTime.value = t;
      ffMat.uniforms.uTime.value = t;
      moonGlow.material.opacity = 0.68 + Math.sin(t * 0.7) * 0.05;
    },
  };
}
