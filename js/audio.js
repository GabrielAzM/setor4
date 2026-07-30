// Todo o áudio é sintetizado via Web Audio API — nenhum arquivo externo
let ctx = null;
let staticNode = null;

export function ensureCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function noiseBuffer(dur = 1) {
  const c = ensureCtx();
  const buf = c.createBuffer(1, c.sampleRate * dur, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

// Distorção da punição: ruído + varredura de filtro + tom grave dissonante
export function playDistortion(dur = 2.2) {
  const c = ensureCtx();
  const t = c.currentTime;
  const src = c.createBufferSource();
  src.buffer = noiseBuffer(dur);
  const bp = c.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.setValueAtTime(200, t);
  bp.frequency.exponentialRampToValueAtTime(2400, t + dur * 0.6);
  bp.frequency.exponentialRampToValueAtTime(120, t + dur);
  const dist = c.createWaveShaper();
  const curve = new Float32Array(256);
  for (let i = 0; i < 256; i++) { const x = i / 128 - 1; curve[i] = Math.tanh(x * 8); }
  dist.curve = curve;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.5, t + 0.05);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  const osc = c.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(55, t);
  osc.frequency.linearRampToValueAtTime(41, t + dur);
  const og = c.createGain();
  og.gain.setValueAtTime(0.12, t);
  og.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(bp).connect(dist).connect(g).connect(c.destination);
  osc.connect(og).connect(c.destination);
  src.start(t); src.stop(t + dur);
  osc.start(t); osc.stop(t + dur);
}

// Encaixe mecânico pesado da peça
export function playClunk() {
  const c = ensureCtx();
  const t = c.currentTime;
  const osc = c.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(90, t);
  osc.frequency.exponentialRampToValueAtTime(38, t + 0.18);
  const g = c.createGain();
  g.gain.setValueAtTime(0.9, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
  const src = c.createBufferSource();
  src.buffer = noiseBuffer(0.12);
  const lp = c.createBiquadFilter();
  lp.type = 'lowpass'; lp.frequency.value = 500;
  const ng = c.createGain();
  ng.gain.setValueAtTime(0.5, t);
  ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
  osc.connect(g).connect(c.destination);
  src.connect(lp).connect(ng).connect(c.destination);
  osc.start(t); osc.stop(t + 0.4);
  src.start(t); src.stop(t + 0.12);
}

// Trincos da porta abrindo (dois estalos)
export function playUnlock() {
  playClunk();
  setTimeout(playClunk, 260);
}

// Compartimento ejetando a peça
export function playEject() {
  const c = ensureCtx();
  const t = c.currentTime;
  const src = c.createBufferSource();
  src.buffer = noiseBuffer(0.25);
  const hp = c.createBiquadFilter();
  hp.type = 'highpass'; hp.frequency.value = 1200;
  const g = c.createGain();
  g.gain.setValueAtTime(0.25, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
  src.connect(hp).connect(g).connect(c.destination);
  src.start(t); src.stop(t + 0.25);
  setTimeout(playClunk, 120);
}

// Chiado de rádio/K7 contínuo (liga/desliga)
export function startStatic(volume = 0.06) {
  stopStatic();
  const c = ensureCtx();
  const src = c.createBufferSource();
  src.buffer = noiseBuffer(2);
  src.loop = true;
  const bp = c.createBiquadFilter();
  bp.type = 'bandpass'; bp.frequency.value = 1800; bp.Q.value = 0.6;
  const g = c.createGain();
  g.gain.value = volume;
  src.connect(bp).connect(g).connect(c.destination);
  src.start();
  staticNode = { src, g };
}

export function stopStatic() {
  if (staticNode) { try { staticNode.src.stop(); } catch (e) {} staticNode = null; }
}

// O som final: uma única peça se encaixando no silêncio
export function playFinalClick() { playClunk(); }
