// Modo Dedução: escolher QUAIS evidências importam e ordená-las na sequência certa.
// Agora há evidências-isca: nem tudo que você coletou entra na dedução.
import { G, State, setState, punish } from './game-state.js';
import * as ui from './ui.js';
import { makePieceMesh, spawnDeductionLine } from './room-builder.js';
import { ejectPiece } from './interaction.js';

let placed = []; // ids na ordem escolhida (tamanho alvo = correctOrder.length)

export function openDeduction() {
  const d = G.level.deduction;
  placed = [];
  G.uiOpen = true;
  setState(State.DEDUCING);
  ui.setBlueOverlay(true);
  if (G.controls && G.locked) G.controls.unlock();

  const panel = document.getElementById('deduction');
  panel.querySelector('#ded-intro').textContent = d.intro;
  const slots = panel.querySelector('#ded-slots');
  const hand = panel.querySelector('#ded-cards');
  slots.innerHTML = '';
  hand.innerHTML = '';

  // Slots = tamanho da sequência correta (pode ser MENOR que o total de cartas)
  d.correctOrder.forEach((_, i) => {
    const s = document.createElement('div');
    s.className = 'ded-slot';
    s.dataset.index = i;
    s.textContent = i + 1;
    s.addEventListener('click', () => removeFromSlot(i));
    slots.appendChild(s);
  });

  const note = panel.querySelector('#ded-note');
  note.textContent = d.cards.length > d.correctOrder.length
    ? `${d.cards.length} evidências, ${d.correctOrder.length} posições. Nem tudo pertence à sequência.`
    : '';

  // Cartas embaralhadas (todas as evidências coletadas, iscas incluídas)
  const shuffled = [...d.cards].sort(() => Math.random() - 0.5);
  for (const c of shuffled) {
    const el = document.createElement('button');
    el.className = 'ded-card';
    el.dataset.id = c.id;
    el.textContent = c.label;
    el.addEventListener('click', () => placeCard(c.id));
    hand.appendChild(el);
  }

  panel.querySelector('#ded-confirm').onclick = confirm;
  panel.querySelector('#ded-clear').onclick = clearAll;
  panel.querySelector('#ded-close').onclick = () => close(false);
  panel.classList.remove('hidden');
  render();
}

function placeCard(id) {
  if (placed.includes(id) || placed.length >= G.level.deduction.correctOrder.length) return;
  placed.push(id);
  render();
}

function removeFromSlot(i) {
  if (i < placed.length) { placed.splice(i, 1); render(); }
}

function clearAll() { placed = []; render(); }

function render() {
  const d = G.level.deduction;
  const panel = document.getElementById('deduction');
  const slots = panel.querySelectorAll('.ded-slot');
  slots.forEach((s, i) => {
    const id = placed[i];
    if (id) {
      const card = d.cards.find((c) => c.id === id);
      s.textContent = card.label;
      s.classList.add('filled');
    } else {
      s.textContent = i + 1;
      s.classList.remove('filled');
    }
  });
  panel.querySelectorAll('.ded-card').forEach((el) => {
    el.classList.toggle('used', placed.includes(el.dataset.id));
  });
  panel.querySelector('#ded-confirm').disabled = placed.length !== d.correctOrder.length;
}

function confirm() {
  const d = G.level.deduction;
  const ok = placed.length === d.correctOrder.length && placed.every((id, i) => id === d.correctOrder[i]);
  if (ok) {
    close(true);
    G.solved = true;
    ui.toast(d.successText || 'A sequência se encaixa. Algo se move na sala...');
    // O fio de dedução se desenha pelo cenário, ligando as evidências na
    // ordem deduzida; quando alcança o compartimento, a peça ejeta.
    const meshById = (id) => G.interactables.find((m) => m.userData.id === id);
    const pts = d.correctOrder
      .map((id) => { const m = meshById(id); return m ? [m.position.x, m.position.y, m.position.z] : null; })
      .filter(Boolean);
    pts.push([...G.level.piece.pos]);
    spawnDeductionLine(pts, () => {
      const mesh = makePieceMesh(G.level.piece.pos);
      G.levelGroup.add(mesh);
      G.interactables.push(mesh);
      ejectPiece();
    });
  } else {
    // ERRO: a UI se fecha bruscamente e a punição de sanidade dispara
    close(true);
    punish(true);
  }
}

function close(silent = false) {
  document.getElementById('deduction').classList.add('hidden');
  ui.setBlueOverlay(false);
  G.uiOpen = false;
  if (G.state === State.DEDUCING) setState(State.EXPLORING);
  if (!silent) ui.toast('Você fecha o raciocínio por enquanto.');
  // O main.js mostra a dica de retomar via evento state-changed
}
