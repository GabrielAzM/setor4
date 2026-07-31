// Máquina de estados global + contexto compartilhado do jogo
import { playDistortion } from './audio.js';

export const State = {
  MENU: 'MENU',
  EXPLORING: 'EXPLORING',
  DEDUCING: 'DEDUCING',
  PUNISHED: 'PUNISHED',
  CINEMATIC: 'CINEMATIC',
};

// Barramento de eventos (ui.js escuta, ninguém importa ui daqui — evita ciclo)
export const bus = new EventTarget();
export function emit(name, detail) { bus.dispatchEvent(new CustomEvent(name, { detail })); }

// G = bolsa de contexto compartilhada entre módulos
export const G = {
  state: State.MENU,
  scene: null, camera: null, renderer: null, controls: null,
  levelIndex: 0, level: null, levelGroup: null,
  roomBounds: null,          // {minX,maxX,minZ,maxZ}
  interactables: [],         // meshes com userData interativa
  uvItems: [],               // objetos visíveis só no modo Luz Negra
  clues: new Set(),          // ids das pistas coletadas na fase atual
  solved: false,             // dedução da fase resolvida
  hasPiece: false,           // peça coletada
  lives: 7,                  // vidas globais pro JOGO INTEIRO (erro de dedução + tiro da Marionete) — não reseta por fase
  stalkerMesh: null,         // referência da Marionete na fase atual, se houver (reseta por fase)
  uv: false,                 // modo Luz Negra ligado
  locked: false,             // pointer lock ativo
  uiOpen: false,             // algum painel 2D aberto (congela movimento)
  loop: null,                // config do corredor em loop (fase 3)
  flashlight: null,
  rain: null,
  paused: false,
  caseBoard: [],             // conexões entre as cenas (persiste entre fases)
};

export function setState(s) {
  const prev = G.state;
  G.state = s;
  emit('state-changed', { prev, next: s });
}

let punishTimer = null;
export const MAX_LIVES = 7;

// Punição de sanidade: flash vermelho + tremida + áudio distorcido
// countIt=false é usado pela tecla de debug (não conta erro)
// As vidas são globais pro jogo inteiro — erro de dedução aqui só desconta 1;
// zerar as vidas não reinicia a fase, dispara o final "Caught" (ver main.js).
export function punish(countIt = true) {
  if (countIt) G.lives = Math.max(0, G.lives - 1);
  setState(State.PUNISHED);
  emit('punish-start');
  playDistortion(2.2);
  clearTimeout(punishTimer);
  punishTimer = setTimeout(() => {
    emit('punish-end');
    if (countIt && G.lives <= 0) {
      setState(State.CINEMATIC);
      emit('lives-depleted');
    } else {
      setState(State.EXPLORING);
    }
  }, 2200);
}

export function resetLevelFlags() {
  G.clues = new Set();
  G.solved = false;
  G.hasPiece = false;
  G.uv = false;
  G.uiOpen = false;
  G.loop = null;
  G.stalkerMesh = null;
}
