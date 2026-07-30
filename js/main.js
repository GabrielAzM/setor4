// Bootstrap: cena, loop de render e o fluxo completo do jogo
import * as THREE from 'three';
import { G, State, setState, bus, resetLevelFlags } from './game-state.js';
import { initPlayer, updatePlayer, spawnAt } from './player.js';
import { buildLevel, updateRoomFX, setUV, applyLoopStage } from './room-builder.js';
import { initInteraction, updateInteraction } from './interaction.js';
import * as ui from './ui.js';
import { ensureCtx, startStatic, stopStatic, playFinalClick } from './audio.js';

let LEVELS = [];

async function boot() {
  const res = await fetch('./data/levels.json');
  LEVELS = await res.json();

  // Renderer / cena / câmera
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);
  document.getElementById('app').appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(72, innerWidth / innerHeight, 0.05, 100);
  scene.add(camera);

  // Lanterna: cone estreito preso à câmera — a escuridão é o jogo
  const flash = new THREE.SpotLight(0xfff2d8, 10, 16, Math.PI / 7, 0.45, 1.6);
  camera.add(flash);
  camera.add(flash.target);
  flash.target.position.set(0, 0, -1);
  flash.position.set(0.15, -0.1, 0);

  Object.assign(G, { scene, camera, renderer, flashlight: flash });

  initPlayer();
  initInteraction();
  ui.initUI();

  addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });

  // Menu inicial
  const menu = document.getElementById('menu');
  document.getElementById('menu-start').addEventListener('click', () => {
    ensureCtx();
    menu.classList.add('hidden');
    loadLevel(0);
  });

  // Retomar pointer lock após painéis 2D
  document.getElementById('resume').addEventListener('click', () => {
    ui.hideResumeHint();
    G.controls.lock();
  });
  bus.addEventListener('unlock', () => {
    if (G.state === State.EXPLORING && !G.uiOpen) ui.showResumeHint();
  });
  bus.addEventListener('lock', () => ui.hideResumeHint());

  // A cada volta do corredor em loop, troca o que está visível na cena
  bus.addEventListener('loop-cycle', () => applyLoopStage());

  // Sempre que voltar a EXPLORING sem pointer lock, oferece retomar o controle
  bus.addEventListener('state-changed', (e) => {
    if (e.detail.next === State.EXPLORING && !G.locked && !G.uiOpen) ui.showResumeHint();
  });

  // Porta destravada -> encaixe -> Quadro do Caso com a nova conexão -> próxima fase
  bus.addEventListener('door-open', () => {
    G.uiOpen = true;
    if (G.locked) G.controls.unlock();
    ui.fittingAnimation(G.levelIndex, () => {
      const lvl = G.level;
      if (lvl.connection) {
        G.caseBoard.push({ name: lvl.name.replace(/^Fase \d+ — /, ''), connLabel: lvl.connection.label, connText: lvl.connection.text });
      }
      ui.openBoard({ highlightLast: true, onContinue: () => { G.uiOpen = false; loadLevel(G.levelIndex + 1); } });
    });
  });

  // Game over narrativo: reinicia a fase atual
  bus.addEventListener('gameover', () => {
    if (G.locked) G.controls.unlock();
    stopStatic();
    ui.gameOverScreen(() => loadLevel(G.levelIndex));
  });

  // Clímax: confronto com Kenji
  bus.addEventListener('confront-kenji', () => {
    if (G.locked) G.controls.unlock();
    G.uiOpen = true;
    ui.choiceScreen((choice) => runEnding(choice));
  });

  // Loop de render
  const clock = new THREE.Clock();
  renderer.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), 0.05);
    updatePlayer(dt);
    updateInteraction();
    updateRoomFX(dt);
    renderer.render(scene, camera);
  });
}

function loadLevel(i) {
  if (i >= LEVELS.length) return;
  G.levelIndex = i;
  const level = LEVELS[i];
  G.level = level;
  resetLevelFlags();
  setUV(false);
  stopStatic();
  buildLevel(level);
  const sp = level.spawn || [0, 3];
  spawnAt(sp[0], sp[1], level.spawnFace ?? 0);
  ui.updateHUD();
  ui.setBlueOverlay(false);

  const start = () => {
    setState(State.EXPLORING);
    ui.levelTitle(level.name, level.subtitle);
    ui.showResumeHint();
  };

  if (level.radioIntro?.length) {
    setState(State.CINEMATIC);
    G.uiOpen = true;
    ui.radioScreen(level.radioIntro, () => { G.uiOpen = false; start(); });
  } else {
    start();
  }
}

// A cena final: O Beco, chuva, o rádio da polícia e a última peça
function runEnding(choice) {
  setState(State.CINEMATIC);
  G.uiOpen = true;
  const teatro = G.level;
  if (teatro?.connection) {
    G.caseBoard.push({ name: teatro.name.replace(/^Fase \d+ — /, ''), connLabel: teatro.connection.label, connText: teatro.connection.text });
  }
  ui.fadeBlack(() => {
    // Epílogo é a última entrada do levels.json (cinematic)
    const ep = LEVELS.find((l) => l.cinematic);
    G.level = ep;
    buildLevel(ep);
    spawnAt(0, 4.4, 0);
    ui.unfade();

    const lines = [...ep.radioIntro];
    if (choice === 'shoot') lines.unshift({ who: 'Sarah', line: 'O eco do tiro ainda tá nos meus ouvidos, Artie.' });
    else lines.unshift({ who: 'Sarah', line: 'Ele nem levantou os olhos quando a gente saiu.' });

    ui.radioScreen(lines, () => {
      startStatic(0.09);
      ui.typeAnnounce(ep.announcement, () => {
        stopStatic();
        ui.hideAnnounce();
        ui.fadeBlack(() => {
          setTimeout(() => {
            playFinalClick();
            setTimeout(() => ui.credits(), 1400);
          }, 900);
        }, 2000);
      });
    });
  });
}

boot();
