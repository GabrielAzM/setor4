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
  attempts: 0,               // erros de dedução na fase
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
const MAX_ATTEMPTS = 3;

// Punição de sanidade: flash vermelho + tremida + áudio distorcido
// countIt=false é usado pela tecla de debug (não conta erro)
export function punish(countIt = true) {
  if (countIt) G.attempts += 1;
  setState(State.PUNISHED);
  emit('punish-start');
  playDistortion(2.2);
  clearTimeout(punishTimer);
  punishTimer = setTimeout(() => {
    emit('punish-end');
    if (countIt && G.attempts >= MAX_ATTEMPTS) {
      setState(State.CINEMATIC);
      emit('gameover');
    } else {
      setState(State.EXPLORING);
    }
  }, 2200);
}

export function resetLevelFlags() {
  G.clues = new Set();
  G.solved = false;
  G.hasPiece = false;
  G.attempts = 0;
  G.uv = false;
  G.uiOpen = false;
  G.loop = null;
}
