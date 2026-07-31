// Bootstrap: cena, loop de render e o fluxo completo do jogo
import * as THREE from 'three';
import { G, State, setState, bus, emit, resetLevelFlags } from './game-state.js';
import { initPlayer, updatePlayer, spawnAt } from './player.js';
import { buildLevel, updateRoomFX, setUV, applyLoopStage, popIn } from './room-builder.js';
import { initInteraction, updateInteraction } from './interaction.js';
import * as ui from './ui.js';
import { ensureCtx, startStatic, stopStatic, playFinalClick, startAmbient, playGunshot, playLaugh, startRain, stopRain } from './audio.js';

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

  // Vidas globais zeradas: dispara o final "Caught" (a Marionete venceu antes da verdade)
  bus.addEventListener('lives-depleted', () => {
    if (G.locked) G.controls.unlock();
    stopStatic();
    runEnding('caught');
  });

  // Encontro roteirizado com a Marionete: aparece, ameaça, talvez atire, some —
  // ou, na Fase 6, é capturada em vez de sumir (cfg.capture / cfg.captureLine no JSON).
  // cfg.shot (padrão true) controla se ele atira; cfg.lethal (padrão true) controla se
  // ESSE tiro desconta vida — ele pode "atirar de brincadeira" pra manter o jogador em dúvida.
  bus.addEventListener('stalker-encounter', (e) => {
    const cfg = e.detail;
    if (!cfg || !G.stalkerMesh) return;
    G.uiOpen = true;
    playLaugh();
    popIn(G.stalkerMesh);
    ui.barkSequence(cfg.lines, () => {
      const shoots = cfg.shot !== false;
      const lethal = shoots && cfg.lethal !== false;
      if (shoots) playGunshot();
      if (lethal) {
        emit('punish-start');
        G.lives = Math.max(0, G.lives - 1);
        ui.updateHUD();
      }
      setTimeout(() => {
        if (lethal) emit('punish-end');
        if (lethal && G.lives <= 0) {
          setState(State.CINEMATIC);
          emit('lives-depleted');
          return;
        }
        G.stalkerMesh.visible = false;
        if (cfg.capture && cfg.captureLine) ui.toast(cfg.captureLine);
        G.uiOpen = false;
      }, lethal ? 900 : 500);
    });
  });

  // Clímax: o Miguel se entrega e empurra a arma até o Luci — não é uma escolha
  // (o jogador não decide matar ou não), é inevitável. A ÚNICA escolha real vem
  // depois: revelar a verdade ou calar.
  bus.addEventListener('confront-miguel', () => {
    if (G.locked) G.controls.unlock();
    G.uiOpen = true;
    const lvl = G.level;
    ui.barkSequence(lvl.confrontLines, () => {
      setTimeout(() => {
        playGunshot();
        ui.bloodFlash();
        setTimeout(() => {
          ui.radioScreen([lvl.postConfrontLine], () => {
            ui.choiceScreen(lvl.finalChoice, (choice) => runEnding(choice));
          });
        }, 1000);
      }, 650);
    });
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

// Transição suave entre cenas: funde pro preto, monta a fase por baixo, funde de volta
function loadLevel(i) {
  if (i >= LEVELS.length) return;
  ui.fadeBlack(() => {
    G.levelIndex = i;
    const level = LEVELS[i];
    G.level = level;
    resetLevelFlags();
    setUV(false);
    stopStatic();
    buildLevel(level);
    // Drone ambiente por fase — a "aspereza" nasce da própria sala (neblina densa, luz de emergência)
    const r = level.room || {};
    startAmbient(Math.min(1, (r.fogDensity ?? 0.12) * 3 + (r.redEmergency ? 0.4 : 0)));
    // Chuva é um som à parte — só toca onde a sala tem chuva de verdade, senão desliga
    if (r.rain) startRain(); else stopRain();
    const sp = level.spawn || [0, 3];
    spawnAt(sp[0], sp[1], level.spawnFace ?? 0);
    ui.updateHUD();
    ui.setBlueOverlay(false);
    ui.unfade();

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
  }, 900);
}

// A cena final: O Beco, chuva, o rádio da polícia e a última peça.
// 'reveal' = Luci assume a autoria e vai preso · 'hide' = o caso nunca fecha oficialmente
// (o próprio Miguel queria isso — cada branch usa seu próprio conjunto de falas no JSON).
function runEnding(choice) {
  setState(State.CINEMATIC);
  G.uiOpen = true;
  // Só regista a conexão do Teatro quando o clímax de verdade aconteceu (não no final "Caught",
  // que pode disparar de qualquer fase, com o jogador ainda sem ter chegado lá)
  const teatro = G.level;
  if ((choice === 'reveal' || choice === 'hide') && teatro?.connection) {
    G.caseBoard.push({ name: teatro.name.replace(/^Fase \d+ — /, ''), connLabel: teatro.connection.label, connText: teatro.connection.text });
  }
  ui.fadeBlack(() => {
    // Epílogo é a última entrada do levels.json (cinematic) — constrói fora do loadLevel(),
    // então precisa resetar o ambiente sonoro na mão (senão o drone/chuva da fase anterior continuam)
    const ep = LEVELS.find((l) => l.cinematic);
    G.level = ep;
    stopStatic();
    buildLevel(ep);
    const epRoom = ep.room || {};
    startAmbient(Math.min(1, (epRoom.fogDensity ?? 0.12) * 3 + (epRoom.redEmergency ? 0.4 : 0)));
    if (epRoom.rain) startRain(); else stopRain();
    spawnAt(0, 4.4, 0);
    ui.unfade();

    const B = choice === 'reveal' ? 'Reveal' : choice === 'hide' ? 'Hide' : 'Caught';
    const lines = ep['radioIntro' + B];

    ui.radioScreen(lines, () => {
      startStatic(0.09);
      ui.typeAnnounce(ep['announcement' + B], () => {
        stopStatic();
        const finish = () => {
          ui.hideAnnounce();
          ui.fadeBlack(() => {
            setTimeout(() => {
              playFinalClick();
              setTimeout(() => ui.credits(ep['creditsTag' + B]), 1400);
            }, 900);
          }, 2000);
        };
        const second = ep['announcement' + B + '2'];
        if (second) ui.typeAnnounce(second, finish);
        else finish();
      });
    });
  });
}

boot();
