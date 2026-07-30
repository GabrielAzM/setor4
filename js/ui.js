// Camada 2D: HUD, painéis, overlays, rádio, encaixe, Quadro do Caso, finais
import { G, bus, State } from './game-state.js';
import { playClunk, playUnlock } from './audio.js';
import { drawSketchInto, drawPuzzlePiece, tracePiecePath } from './textures.js';

const $ = (id) => document.getElementById(id);

export function initUI() {
  bus.addEventListener('punish-start', () => {
    $('overlay-red').classList.add('active');
    $('app').classList.add('shake');
  });
  bus.addEventListener('punish-end', () => {
    $('overlay-red').classList.remove('active');
    $('app').classList.remove('shake');
  });
  $('inspect-close').addEventListener('click', closeInspect);
  $('board-close').addEventListener('click', () => closeBoard());
}

// ---------- HUD ----------
export function totalClues() {
  return (G.level?.objects || []).filter((o) => o.isClue).length;
}

export function updateHUD() {
  const total = totalClues();
  $('clue-counter').textContent = total ? `Evidências ${G.clues.size}/${total}` : '';
  $('piece-slot').classList.toggle('has', G.hasPiece);
  $('hint').textContent = G.level?.hint || '';
}

export function setPrompt(text) { $('prompt').textContent = text; }

let toastTimer = null;
export function toast(text) {
  const t = $('toast');
  t.textContent = text;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3200);
}

export function levelTitle(name, sub) {
  $('title-toast').innerHTML = `<h2>${name}</h2><p>${sub || ''}</p>`;
  $('title-toast').classList.add('show');
  setTimeout(() => $('title-toast').classList.remove('show'), 3800);
}

// ---------- Painel de inspeção (dossiê com sketch pericial) ----------
export function openInspect(title, body, opts = {}) {
  $('inspect-title').textContent = title;
  $('inspect-body').textContent = body;
  const canvas = $('inspect-canvas');
  if (opts.sketch) {
    canvas.classList.remove('hidden');
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    drawSketchInto(canvas, opts.sketch);
  } else {
    canvas.classList.add('hidden');
  }
  $('inspect').classList.remove('hidden');
  $('inspect').classList.toggle('tape', !!opts.tape);
}
export function closeInspect() { $('inspect').classList.add('hidden'); }
export function isInspectOpen() { return !$('inspect').classList.contains('hidden'); }

// ---------- Overlays de estado ----------
export function setBlueOverlay(on) { $('overlay-blue').classList.toggle('active', on); }

export function showResumeHint() {
  if (!G.locked && G.state === State.EXPLORING && !G.uiOpen) $('resume').classList.remove('hidden');
}
export function hideResumeHint() { $('resume').classList.add('hidden'); }

// ---------- Rádio entre fases ----------
export function radioScreen(lines, onDone) {
  const box = $('radio');
  const cont = $('radio-lines');
  cont.innerHTML = '';
  box.classList.remove('hidden');
  let i = 0;
  const next = () => {
    if (i < lines.length) {
      const l = lines[i++];
      const p = document.createElement('p');
      p.innerHTML = `<span class="who">${l.who}</span> — ${l.line}`;
      cont.appendChild(p);
      p.scrollIntoView({ block: 'end' });
    } else {
      box.classList.add('hidden');
      $('radio-continue').onclick = null;
      onDone();
    }
  };
  $('radio-continue').onclick = next;
  next();
}

// ---------- Animação do encaixe da peça na porta (canvas) ----------
export function fittingAnimation(levelIndex, onDone) {
  const f = $('fitting');
  const canvas = $('fit-canvas');
  const x = canvas.getContext('2d');
  f.classList.remove('hidden');

  const W = canvas.width, H = canvas.height;
  const size = 96;
  const tx = W / 2 - size / 2, ty = H / 2 - size / 2; // destino (molde)
  const sx = -size - 30, sy = ty + 120;               // origem (fora da tela)
  const dur = 1100;
  let start = null;
  let clunked = false;

  function frame(ts) {
    if (!start) start = ts;
    const k = Math.min((ts - start) / dur, 1);
    const ease = 1 - Math.pow(1 - k, 3);
    const px = sx + (tx - sx) * ease;
    const py = sy + (ty - sy) * ease;
    const rot = (1 - ease) * -0.5;

    x.clearRect(0, 0, W, H);
    // molde tracejado
    drawPuzzlePiece(x, tx, ty, size, { fill: null, stroke: '#6e6a63', dash: true, label: String(levelIndex + 1) });
    // peça viajando
    x.save();
    x.translate(px + size / 2, py + size / 2);
    x.rotate(rot);
    drawPuzzlePiece(x, -size / 2, -size / 2, size, { fill: '#8e1d1d', stroke: '#d8d3ca' });
    x.restore();

    if (k >= 1 && !clunked) {
      clunked = true;
      playClunk();
      // brilho do encaixe
      x.save();
      x.shadowColor = '#ff3333'; x.shadowBlur = 40;
      drawPuzzlePiece(x, tx, ty, size, { fill: '#a52222', stroke: '#ffd9d9', label: String(levelIndex + 1) });
      x.restore();
      setTimeout(playUnlock, 520);
      setTimeout(() => { f.classList.add('hidden'); onDone(); }, 1500);
      return;
    }
    if (k < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

// ---------- Quadro do Caso: as cenas se conectando ----------
function drawPiecesRow() {
  const canvas = $('board-pieces');
  const x = canvas.getContext('2d');
  x.clearRect(0, 0, canvas.width, canvas.height);
  const n = 7;
  const s = 56, overlap = s * 0.18;
  const totalW = n * s - (n - 1) * overlap;
  let px = (canvas.width - totalW) / 2;
  const py = (canvas.height - s) / 2;
  for (let i = 0; i < n; i++) {
    const got = i < G.caseBoard.length;
    if (got) drawPuzzlePiece(x, px, py, s, { fill: '#8e1d1d', stroke: '#d8d3ca', label: String(i + 1) });
    else drawPuzzlePiece(x, px, py, s, { fill: null, stroke: '#4a4641', dash: true });
    px += s - overlap;
  }
}

export function openBoard({ highlightLast = false, onContinue = null } = {}) {
  const b = $('board');
  const list = $('board-list');
  list.innerHTML = '';

  if (G.caseBoard.length === 0) {
    const p = document.createElement('p');
    p.className = 'board-empty';
    p.textContent = 'Nenhuma conexão ainda. Resolva a cena e atravesse a porta.';
    list.appendChild(p);
  }

  G.caseBoard.forEach((entry, i) => {
    const item = document.createElement('div');
    item.className = 'board-item' + (highlightLast && i === G.caseBoard.length - 1 ? ' fresh' : '');
    item.innerHTML = `<div class="board-dot"></div>
      <div class="board-card">
        <h4>${i + 1}. ${entry.name}</h4>
        <p class="board-label">${entry.connLabel}</p>
        <p>${entry.connText}</p>
      </div>`;
    list.appendChild(item);
  });

  const btn = $('board-continue');
  if (onContinue) {
    btn.textContent = '▸ Seguir para a próxima cena';
    btn.classList.remove('hidden');
    btn.onclick = () => { closeBoard(true); onContinue(); };
    $('board-close').classList.add('hidden');
  } else {
    btn.classList.add('hidden');
    btn.onclick = null;
    $('board-close').classList.remove('hidden');
  }

  b.classList.remove('hidden');
  drawPiecesRow();
}

export function closeBoard(silent = false) {
  $('board').classList.add('hidden');
  G.uiOpen = false;
  if (!silent) showResumeHint();
}

export function isBoardOpen() { return !$('board').classList.contains('hidden'); }

// ---------- Game over narrativo ----------
export function gameOverScreen(onRetry) {
  const g = $('gameover');
  g.classList.remove('hidden');
  $('gameover-retry').onclick = () => {
    g.classList.add('hidden');
    onRetry();
  };
}

// ---------- Sequência final ----------
export function choiceScreen(onChoose) {
  const c = $('choice');
  c.classList.remove('hidden');
  $('choice-shoot').onclick = () => { c.classList.add('hidden'); onChoose('shoot'); };
  $('choice-spare').onclick = () => { c.classList.add('hidden'); onChoose('spare'); };
}

export function fadeBlack(onDone, ms = 1600) {
  const f = $('fade');
  f.classList.add('active');
  setTimeout(onDone, ms);
}
export function unfade() { $('fade').classList.remove('active'); }

export function typeAnnounce(text, onDone) {
  const a = $('announce');
  a.classList.remove('hidden');
  a.textContent = '';
  let i = 0;
  const iv = setInterval(() => {
    a.textContent = text.slice(0, ++i);
    if (i >= text.length) { clearInterval(iv); setTimeout(onDone, 1800); }
  }, 38);
}
export function hideAnnounce() { $('announce').classList.add('hidden'); }

export function credits() {
  $('credits').classList.remove('hidden');
}
