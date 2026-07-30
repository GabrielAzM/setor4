// Constrói a sala 3D inteira a partir dos dados do level (JSON)
import * as THREE from 'three';
import { G, emit } from './game-state.js';
import { surfaceTexture, revealMaterialTexture, makePieceGeometry } from './textures.js';

function mat(color = 0x4a4a4a) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.95, metalness: 0.0 });
}

// Textura de texto desenhada em canvas (decals da Luz Negra)
function textTexture(text, color = '#b57edc') {
  const cvs = document.createElement('canvas');
  cvs.width = 512; cvs.height = 256;
  const c = cvs.getContext('2d');
  c.fillStyle = color;
  c.font = 'bold 44px monospace';
  c.textAlign = 'center';
  String(text).split('\n').forEach((l, i) => c.fillText(l, 256, 110 + i * 52));
  return new THREE.CanvasTexture(cvs);
}

function makePrimitive(o) {
  const s = o.size || [0.5, 0.5, 0.5];
  let geo;
  if (o.kind === 'cylinder') geo = new THREE.CylinderGeometry(s[0], s[0], s[1], 16);
  else if (o.kind === 'sphere') geo = new THREE.SphereGeometry(s[0], 16, 12);
  else geo = new THREE.BoxGeometry(s[0], s[1], s[2]);
  return new THREE.Mesh(geo, mat(o.color ? parseInt(o.color, 16) : 0x565656));
}

// Figura do Kenji: primitivas cinza em posição fetal, cercada de peças em branco
function makeKenji() {
  const g = new THREE.Group();
  const skin = mat(0x6b6560);
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.5, 4, 8), skin);
  body.position.y = 0.42;
  body.rotation.x = Math.PI / 2.6;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 10), skin);
  head.position.set(0, 0.62, 0.3);
  g.add(body, head);
  const pieceGeo = makePieceGeometry(0.16);
  for (let i = 0; i < 9; i++) {
    const p = new THREE.Mesh(pieceGeo, mat(0xd8d4cc));
    const a = (i / 9) * Math.PI * 2;
    p.position.set(Math.cos(a) * (0.7 + (i % 3) * 0.25), 0.03, Math.sin(a) * (0.7 + (i % 3) * 0.2));
    p.rotation.x = -Math.PI / 2;
    p.rotation.z = a * 1.7;
    g.add(p);
  }
  return g;
}

// A peça ejetada: formato real de quebra-cabeça, brilho vermelho
export function makePieceMesh(pos) {
  const m = new THREE.Mesh(makePieceGeometry(0.3), new THREE.MeshStandardMaterial({
    color: 0x8a8a8a, roughness: 0.7, emissive: 0xff2222, emissiveIntensity: 0.9,
  }));
  m.position.set(pos[0], pos[1], pos[2]);
  m.rotation.x = -0.4;
  m.userData = { id: '__piece', name: 'Peça de Quebra-Cabeça', isPiece: true, baseEmissive: 0.9 };
  return m;
}

export function buildLevel(level) {
  if (G.levelGroup) {
    G.scene.remove(G.levelGroup);
    G.levelGroup.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
  }
  const group = new THREE.Group();
  G.levelGroup = group;
  G.interactables = [];
  G.uvItems = [];
  G.rain = null;
  G.lines = [];

  const r = level.room;
  const W = r.width, D = r.depth, H = r.height;
  const tex = r.tex || {};

  const fog = parseInt(r.fogColor || '0a0a0c', 16);
  G.scene.fog = new THREE.FogExp2(fog, r.fogDensity ?? 0.12);
  G.scene.background = new THREE.Color(fog);

  // Chão, teto e paredes — com texturas procedurais em cinza
  const floorMat = new THREE.MeshStandardMaterial({ map: surfaceTexture(tex.floor || 'concrete', W / 2, D / 2), roughness: 0.95 });
  const wallMatN = new THREE.MeshStandardMaterial({ map: surfaceTexture(tex.wall || 'plaster', W / 2.2, H / 2.2), roughness: 0.95 });
  const wallMatE = new THREE.MeshStandardMaterial({ map: surfaceTexture(tex.wall || 'plaster', D / 2.2, H / 2.2), roughness: 0.95 });
  const ceilMat = new THREE.MeshStandardMaterial({ map: surfaceTexture(tex.ceil || 'dark', W / 3, D / 3), roughness: 1 });

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, D), floorMat);
  floor.rotation.x = -Math.PI / 2;
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(W, D), ceilMat);
  ceil.rotation.x = Math.PI / 2;
  ceil.position.y = H;
  group.add(floor, ceil);

  const mkWall = (wdt, m2) => new THREE.Mesh(new THREE.PlaneGeometry(wdt, H), m2);
  const n = mkWall(W, wallMatN); n.position.set(0, H / 2, -D / 2);
  const s = mkWall(W, wallMatN); s.position.set(0, H / 2, D / 2); s.rotation.y = Math.PI;
  const e = mkWall(D, wallMatE); e.position.set(W / 2, H / 2, 0); e.rotation.y = -Math.PI / 2;
  const w2 = mkWall(D, wallMatE); w2.position.set(-W / 2, H / 2, 0); w2.rotation.y = Math.PI / 2;
  group.add(n, s, e, w2);

  G.roomBounds = { minX: -W / 2, maxX: W / 2, minZ: -D / 2, maxZ: D / 2 };

  // Escuro, mas legível: ambiente fraco + hemisférica pra dar volume às silhuetas
  const amb = new THREE.AmbientLight(0xffffff, r.ambient ?? 0.09);
  const hemi = new THREE.HemisphereLight(0x8888a0, 0x0a0a0c, r.hemi ?? 0.22);
  group.add(amb, hemi);

  if (r.redEmergency) {
    const red = new THREE.PointLight(0xff2222, 1.2, Math.max(W, D));
    red.position.set(0, H - 0.3, 0);
    group.add(red);
    G.emergencyLight = red;
  } else {
    G.emergencyLight = null;
  }

  // Objetos da cena
  for (const o of level.objects || []) {
    let m;
    if (o.kind === 'kenji') { m = makeKenji(); }
    else if (o.kind === 'uvdecal') {
      m = new THREE.Mesh(
        new THREE.PlaneGeometry(o.size?.[0] ?? 2, o.size?.[1] ?? 1),
        new THREE.MeshBasicMaterial({ map: textTexture(o.text || '???'), transparent: true })
      );
      m.visible = false;
      G.uvItems.push(m);
    } else {
      m = makePrimitive(o);
    }
    m.position.set(o.pos[0], o.pos[1], o.pos[2]);
    if (o.rot) m.rotation.y = o.rot;

    if (o.interactive) {
      if (m.material && m.material.emissive !== undefined) {
        m.material.emissive = new THREE.Color(0xff1a1a);
        m.material.emissiveIntensity = 0.55;
      }
      m.userData = {
        id: o.id, name: o.name, clueText: o.clueText || '',
        isClue: !!o.isClue, isDoor: o.kind === 'door' || !!o.isDoor,
        isKenji: o.kind === 'kenji', uvOnly: !!o.uvOnly,
        loopStage: o.loopStage ?? null, baseEmissive: 0.55,
        sketch: o.sketch || null, reveal: o.reveal || o.sketch || null,
        revealed: false,
      };
      G.interactables.push(m);
      if (o.uvOnly) { m.visible = false; if (!G.uvItems.includes(m)) G.uvItems.push(m); }
    }
    if (o.loopStage != null && !o.interactive) m.visible = false;
    group.add(m);
  }

  // Corredor em loop (fase 3)
  if (r.loop) {
    G.loop = {
      stages: r.loop.stages ?? 3, stage: 0, broken: false,
      triggerZ: -D / 2 + 1.2, jump: D - 3,
    };
    applyLoopStage();
  }

  // Chuva (fase 1 e epílogo)
  if (r.rain) {
    const count = 900;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * W;
      pos[i * 3 + 1] = Math.random() * H;
      pos[i * 3 + 2] = (Math.random() - 0.5) * D;
    }
    const g2 = new THREE.BufferGeometry();
    g2.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const rain = new THREE.Points(g2, new THREE.PointsMaterial({ color: 0x8899aa, size: 0.02, transparent: true, opacity: 0.6 }));
    group.add(rain);
    G.rain = { points: rain, height: H };
  }

  G.scene.add(group);
}

// Inspeção "revela" a MATÉRIA real do objeto — metal, sangue, papel.
// (O desenho pericial existe só no dossiê 2D; o mundo 3D ganha material de verdade.)
export function revealMesh(mesh) {
  const d = mesh.userData;
  if (!d || d.revealed) return;
  d.revealed = true;
  if (d.reveal && mesh.material && mesh.material.emissive !== undefined) {
    mesh.material = mesh.material.clone();
    mesh.material.map = revealMaterialTexture(d.reveal);
    mesh.material.color = new THREE.Color(0xffffff); // não tingir: a textura manda
    mesh.material.emissive = new THREE.Color(0xff1a1a);
    mesh.material.emissiveIntensity = 0.05;
    mesh.material.needsUpdate = true;
  }
  d.baseEmissive = 0.05; // revelado = quase sem brilho; a matéria fala por si
}

// ---------- Fio de dedução ----------
// Linha vermelha que se desenha pelo cenário ligando as evidências na ordem
// deduzida até o compartimento da peça — e depois da peça até a porta.
// É a conexão física entre dedução, cenário e escape.
export function spawnDeductionLine(rawPoints, onDone) {
  if (!rawPoints || rawPoints.length < 2) { if (onDone) onDone(); return; }
  const pts = rawPoints.map((p) => new THREE.Vector3(p[0], Math.max(p[1], 0.55), p[2]));
  const dense = [];
  const SUB = 22;
  for (let i = 0; i < pts.length - 1; i++) {
    for (let s = 0; s < SUB; s++) dense.push(new THREE.Vector3().lerpVectors(pts[i], pts[i + 1], s / SUB));
  }
  dense.push(pts[pts.length - 1].clone());
  const geo = new THREE.BufferGeometry().setFromPoints(dense);
  geo.setDrawRange(0, 0);
  const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xff2a2a, transparent: true, opacity: 0.9 }));
  G.levelGroup.add(line);
  G.lines.push({ line, total: dense.length, k: 0, speed: dense.length / 1.8, onDone, done: false });
}

export function applyLoopStage() {
  if (!G.loop) return;
  for (const m of G.interactables) {
    if (m.userData.loopStage != null) {
      const collected = G.clues.has(m.userData.id);
      m.visible = !collected && m.userData.loopStage === G.loop.stage;
    }
  }
}

// Efeitos por frame: pulso dos interativos, queda da chuva, luz de emergência
let t = 0;
export function updateRoomFX(dt) {
  t += dt;
  const pulse = 0.35 + Math.abs(Math.sin(t * 2.2)) * 0.5;
  for (const m of G.interactables) {
    if (m.material && m.material.emissive && !m.userData.isPiece) {
      // Revelados ficam num brilho fixo baixo; não-revelados pulsam chamando atenção
      m.material.emissiveIntensity = m.userData.revealed ? m.userData.baseEmissive : pulse;
    }
  }
  if (G.rain) {
    const p = G.rain.points.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) {
      let y = p.getY(i) - dt * 7;
      if (y < 0) y = G.rain.height;
      p.setY(i, y);
    }
    p.needsUpdate = true;
  }
  if (G.emergencyLight) {
    G.emergencyLight.intensity = 0.7 + Math.abs(Math.sin(t * 3.1)) * 0.9;
  }

  // Fios de dedução se desenhando pelo cenário
  for (const l of G.lines || []) {
    if (l.done) continue;
    l.k += dt * l.speed;
    const k = Math.min(Math.floor(l.k), l.total);
    l.line.geometry.setDrawRange(0, k);
    if (k >= l.total) { l.done = true; if (l.onDone) l.onDone(); }
  }
}

// Luz Negra: alterna a lanterna pra UV e revela os decals ocultos
export function setUV(on) {
  G.uv = on;
  if (G.flashlight) {
    G.flashlight.color.set(on ? 0x8a2be2 : 0xfff2d8);
    G.flashlight.intensity = on ? 14 : 10;
  }
  for (const m of G.uvItems) m.visible = on;
  emit('uv-changed', { on });
}
