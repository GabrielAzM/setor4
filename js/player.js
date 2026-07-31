// Movimento first-person: PointerLockControls + WASD + colisão AABB com a sala
import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { G, State, emit } from './game-state.js';
import { playFootstep } from './audio.js';

const keys = { w: false, a: false, s: false, d: false };
const SPEED = 2.6; // lento e pesado, vibe de terror
const PLAYER_RADIUS = 0.35;
const EYE_HEIGHT = 1.65;
const STEP_INTERVAL = 0.46; // passo lento, casando com o SPEED baixo
let stepTimer = 0;

const dir = new THREE.Vector3();
const right = new THREE.Vector3();
const UP = new THREE.Vector3(0, 1, 0);

export function initPlayer() {
  const controls = new PointerLockControls(G.camera, document.body);
  G.controls = controls;
  G.camera.position.set(0, EYE_HEIGHT, 0);

  controls.addEventListener('lock', () => { G.locked = true; emit('lock'); });
  controls.addEventListener('unlock', () => { G.locked = false; emit('unlock'); });

  document.addEventListener('keydown', (e) => setKey(e.code, true));
  document.addEventListener('keyup', (e) => setKey(e.code, false));
}

function setKey(code, val) {
  if (code === 'KeyW' || code === 'ArrowUp') keys.w = val;
  if (code === 'KeyA' || code === 'ArrowLeft') keys.a = val;
  if (code === 'KeyS' || code === 'ArrowDown') keys.s = val;
  if (code === 'KeyD' || code === 'ArrowRight') keys.d = val;
}

export function spawnAt(x, z, faceRad = 0) {
  G.camera.position.set(x, EYE_HEIGHT, z);
  G.camera.rotation.set(0, faceRad, 0);
}

export function updatePlayer(dt) {
  if (!G.locked || G.uiOpen) return;
  if (G.state !== State.EXPLORING) return;

  // Direção no plano XZ a partir de onde a câmera olha
  G.camera.getWorldDirection(dir);
  dir.y = 0;
  if (dir.lengthSq() < 1e-6) return;
  dir.normalize();
  right.crossVectors(dir, UP).normalize();

  const move = new THREE.Vector3();
  if (keys.w) move.add(dir);
  if (keys.s) move.sub(dir);
  if (keys.d) move.add(right);
  if (keys.a) move.sub(right);

  if (move.lengthSq() > 0) {
    move.normalize().multiplyScalar(SPEED * dt);
    G.camera.position.add(move);
    stepTimer += dt;
    if (stepTimer >= STEP_INTERVAL) {
      stepTimer -= STEP_INTERVAL;
      playFootstep(G.level?.room?.tex?.floor);
    }
  } else {
    stepTimer = 0;
  }

  // Colisão com as paredes da sala (AABB)
  const b = G.roomBounds;
  if (b) {
    G.camera.position.x = Math.max(b.minX + PLAYER_RADIUS, Math.min(b.maxX - PLAYER_RADIUS, G.camera.position.x));
    G.camera.position.z = Math.max(b.minZ + PLAYER_RADIUS, Math.min(b.maxZ - PLAYER_RADIUS, G.camera.position.z));
  }
  G.camera.position.y = EYE_HEIGHT;

  // Corredor em loop (Metrô Fantasma): teleporta de volta até quebrar o ciclo
  if (G.loop && !G.loop.broken) {
    const L = G.loop;
    if (G.camera.position.z < L.triggerZ) {
      G.camera.position.z += L.jump;
      L.stage = (L.stage + 1) % L.stages;
      emit('loop-cycle', { stage: L.stage });
    }
  }
}
