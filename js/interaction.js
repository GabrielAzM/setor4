// Raycast da câmera + todas as teclas de interação do jogo
import * as THREE from 'three';
import { G, State, setState, punish, emit } from './game-state.js';
import { setUV, applyLoopStage, revealMesh, spawnDeductionLine } from './room-builder.js';
import { openDeduction } from './deduction.js';
import * as ui from './ui.js';
import { startStatic, stopStatic, playEject } from './audio.js';

const raycaster = new THREE.Raycaster();
const CENTER = new THREE.Vector2(0, 0);
const REACH = 2.6;

let aimed = null;
let tapeOpen = false;

export function initInteraction() {
  document.addEventListener('keydown', onKey);
}

function onKey(e) {
  // Teclas de debug dos 3 estados visuais (só em gameplay, pra não corromper cinemáticas)
  const dbgOk = G.state === State.EXPLORING || G.state === State.DEDUCING || G.state === State.PUNISHED;
  if (dbgOk) {
    if (e.code === 'Digit1') { ui.setBlueOverlay(false); if (G.state === State.DEDUCING) setState(State.EXPLORING); }
    if (e.code === 'Digit2') { ui.setBlueOverlay(true); }
    if (e.code === 'Digit3') { punish(false); }
  }

  if (G.state === State.CINEMATIC) return;

  // E — interagir com o que está na mira / fechar painel de pista
  if (e.code === 'KeyE') {
    if (ui.isInspectOpen()) { ui.closeInspect(); if (tapeOpen) { tapeOpen = false; stopStatic(); } return; }
    if (G.state !== State.EXPLORING || !G.locked || G.uiOpen) return;
    if (aimed) interactWith(aimed);
    return;
  }

  // Q — fecha painéis (alternativa ao ESC, que solta o mouse)
  if (e.code === 'KeyQ') {
    if (tapeOpen) { toggleTape(); return; }
    if (ui.isInspectOpen()) ui.closeInspect();
  }

  // C — Quadro do Caso: as conexões entre as cenas
  if (e.code === 'KeyC') {
    if (ui.isBoardOpen()) { ui.closeBoard(); return; }
    if (G.state !== State.EXPLORING || G.uiOpen) return;
    G.uiOpen = true;
    if (G.locked) G.controls.unlock();
    ui.openBoard({});
    return;
  }

  // TAB — abre o modo dedução quando todas as evidências foram coletadas
  if (e.code === 'Tab') {
    e.preventDefault();
    if (G.state !== State.EXPLORING || G.uiOpen || !G.level?.deduction) return;
    if (G.solved) { ui.toast('A dedução desta cena já foi resolvida.'); return; }
    const total = ui.totalClues();
    if (G.clues.size < total) {
      ui.toast(`Ainda há evidências na cena. (${G.clues.size}/${total})`);
      return;
    }
    openDeduction();
  }

  // F — Luz Negra
  if (e.code === 'KeyF') {
    if (G.state !== State.EXPLORING) return;
    setUV(!G.uv);
    ui.toast(G.uv ? 'Luz Negra ligada.' : 'Luz Negra desligada.');
  }

  // K — Gravador K7 (se a fase tiver fita)
  if (e.code === 'KeyK') {
    if (!G.level?.tape || G.state !== State.EXPLORING) return;
    toggleTape();
  }
}

function toggleTape() {
  tapeOpen = !tapeOpen;
  if (tapeOpen) {
    startStatic();
    ui.openInspect('Gravador K7 — ' + G.level.tape.title, G.level.tape.text, { tape: true });
  } else {
    stopStatic();
    ui.closeInspect();
  }
}

function interactWith(mesh) {
  const d = mesh.userData;

  if (d.isPiece) {
    G.hasPiece = true;
    const piecePos = [mesh.position.x, mesh.position.y, mesh.position.z];
    mesh.visible = false;
    G.interactables = G.interactables.filter((m) => m !== mesh);
    ui.updateHUD();
    ui.toast('Peça de Quebra-Cabeça coletada. Leve-a até a porta.');
    // O fio continua: da peça até o molde da porta
    const door = G.interactables.find((m) => m.userData.isDoor);
    if (door) spawnDeductionLine([piecePos, [door.position.x, door.position.y, door.position.z]], null);
    return;
  }

  if (d.isKenji) { emit('confront-kenji'); return; }

  if (d.isDoor) {
    if (G.hasPiece) emit('door-open');
    else if (G.solved) ui.toast('Você resolveu a cena. Pegue a peça ejetada.');
    else ui.toast('Um molde vazio espera por uma peça. A cena ainda não foi decifrada.');
    return;
  }

  // Evidência: inspecionar REVELA a textura real do objeto no mundo
  revealMesh(mesh);
  ui.openInspect(d.name, d.clueText, { sketch: d.sketch });
  if (d.isClue && !G.clues.has(d.id)) {
    G.clues.add(d.id);
    ui.updateHUD();
    if (G.loop) applyLoopStage();
    const total = ui.totalClues();
    if (total && G.clues.size >= total) {
      if (G.loop) { G.loop.broken = true; ui.toast('O corredor parou de se repetir.'); }
      setTimeout(() => ui.toast('Evidências completas. Aperte TAB para deduzir.'), 600);
    }
  }
}

export function updateInteraction() {
  if (G.state !== State.EXPLORING || !G.locked || G.uiOpen) { aimed = null; ui.setPrompt(''); return; }
  raycaster.setFromCamera(CENTER, G.camera);
  const hits = raycaster.intersectObjects(G.interactables, true);
  let target = null;
  for (const h of hits) {
    if (h.distance > REACH) break;
    let o = h.object;
    while (o && !o.userData?.id && !o.userData?.isPiece) o = o.parent;
    if (o && o.visible !== false) { target = o; break; }
  }
  aimed = target;
  if (aimed) {
    const d = aimed.userData;
    const verb = d.isDoor ? 'Examinar a porta' : d.isKenji ? 'Confrontar' : d.isPiece ? 'Pegar a peça' : 'Inspecionar';
    ui.setPrompt(`[E] ${verb} — ${d.name}`);
  } else {
    ui.setPrompt('');
  }
}

// Chamado pela dedução quando o jogador acerta: ejeta a peça fisicamente
export function ejectPiece() {
  playEject();
  emit('piece-ejected');
}
