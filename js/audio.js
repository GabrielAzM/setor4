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

// Passo — varia por piso (concreto/madeira/metal/azulejo), curto e seco
const STEP_TONE = {
  concrete: { hz: 90, dur: 0.09, filt: 'lowpass', ffreq: 900 },
  wood: { hz: 130, dur: 0.11, filt: 'lowpass', ffreq: 650 },
  metal: { hz: 220, dur: 0.14, filt: 'bandpass', ffreq: 1400 },
  tile: { hz: 170, dur: 0.08, filt: 'highpass', ffreq: 1000 },
};
export function playFootstep(surface = 'concrete') {
  const c = ensureCtx();
  const t = c.currentTime;
  const tone = STEP_TONE[surface] || STEP_TONE.concrete;
  const src = c.createBufferSource();
  src.buffer = noiseBuffer(tone.dur);
  const filt = c.createBiquadFilter();
  filt.type = tone.filt; filt.frequency.value = tone.ffreq;
  if (tone.filt === 'bandpass') filt.Q.value = 3;
  const g = c.createGain();
  g.gain.setValueAtTime(0.16 + Math.random() * 0.05, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + tone.dur);
  const osc = c.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(tone.hz * (0.94 + Math.random() * 0.12), t);
  const og = c.createGain();
  og.gain.setValueAtTime(0.06, t);
  og.gain.exponentialRampToValueAtTime(0.0001, t + tone.dur * 0.8);
  src.connect(filt).connect(g).connect(c.destination);
  osc.connect(og).connect(c.destination);
  src.start(t); src.stop(t + tone.dur);
  osc.start(t); osc.stop(t + tone.dur);
}

// Sting curto de revelação — algo "errado" e breve (não é a punição, que é mais longa)
export function playSting() {
  const c = ensureCtx();
  const t = c.currentTime;
  const dur = 0.9;
  const osc = c.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(70, t);
  osc.frequency.exponentialRampToValueAtTime(32, t + dur);
  const dist = c.createWaveShaper();
  const curve = new Float32Array(256);
  for (let i = 0; i < 256; i++) { const x = i / 128 - 1; curve[i] = Math.tanh(x * 5); }
  dist.curve = curve;
  const og = c.createGain();
  og.gain.setValueAtTime(0.0001, t);
  og.gain.exponentialRampToValueAtTime(0.35, t + 0.04);
  og.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  const src = c.createBufferSource();
  src.buffer = noiseBuffer(dur);
  const hp = c.createBiquadFilter();
  hp.type = 'highpass'; hp.frequency.value = 3200;
  const ng = c.createGain();
  ng.gain.setValueAtTime(0.0001, t);
  ng.gain.exponentialRampToValueAtTime(0.1, t + 0.02);
  ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
  osc.connect(dist).connect(og).connect(c.destination);
  src.connect(hp).connect(ng).connect(c.destination);
  osc.start(t); osc.stop(t + dur);
  src.start(t); src.stop(t + dur);
}

// Tiro seco da Marionete — estouro curto e sem sustain (diferente da distorção da punição)
export function playGunshot() {
  const c = ensureCtx();
  const t = c.currentTime;
  const src = c.createBufferSource();
  src.buffer = noiseBuffer(0.18);
  const lp = c.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(3800, t);
  lp.frequency.exponentialRampToValueAtTime(300, t + 0.16);
  const g = c.createGain();
  g.gain.setValueAtTime(0.7, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
  const osc = c.createOscillator();
  osc.type = 'square';
  osc.frequency.setValueAtTime(70, t);
  const og = c.createGain();
  og.gain.setValueAtTime(0.3, t);
  og.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
  src.connect(lp).connect(g).connect(c.destination);
  osc.connect(og).connect(c.destination);
  src.start(t); src.stop(t + 0.18);
  osc.start(t); osc.stop(t + 0.1);
}

// Risada bizarra da Marionete — rajadas curtas e irregulares de tom, com distorção leve.
// Usada nos encontros roteirizados, pra assustar antes mesmo da fala aparecer.
export function playLaugh() {
  const c = ensureCtx();
  const dist = c.createWaveShaper();
  const curve = new Float32Array(256);
  for (let i = 0; i < 256; i++) { const x = i / 128 - 1; curve[i] = Math.tanh(x * 3); }
  dist.curve = curve;
  dist.connect(c.destination);
  const bursts = 5 + Math.floor(Math.random() * 3);
  let t = c.currentTime;
  for (let i = 0; i < bursts; i++) {
    const dur = 0.09 + Math.random() * 0.05;
    const osc = c.createOscillator();
    osc.type = 'sawtooth';
    const base = 180 + Math.random() * 90;
    osc.frequency.setValueAtTime(base, t);
    osc.frequency.exponentialRampToValueAtTime(base * 0.6, t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.22, t + dur * 0.2);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(dist);
    osc.start(t); osc.stop(t + dur);
    t += dur + 0.03 + Math.random() * 0.05;
  }
}

// Drone ambiente contínuo por fase — grave, levemente dissonante, quase subliminar
let ambientNode = null;
export function startAmbient(roughness = 0.5) {
  stopAmbient();
  const c = ensureCtx();
  const base = 44 + roughness * 10;
  const o1 = c.createOscillator(); o1.type = 'sine'; o1.frequency.value = base;
  const o2 = c.createOscillator(); o2.type = 'sine'; o2.frequency.value = base * 1.5 + roughness * 2;
  const g = c.createGain(); g.gain.value = 0.05 + roughness * 0.03;
  const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 300;
  const src = c.createBufferSource();
  src.buffer = noiseBuffer(4); src.loop = true;
  // Passa-baixa forte no ruído — sem isso ele vira "chiado" e é fácil de confundir com chuva
  const nlp = c.createBiquadFilter(); nlp.type = 'lowpass'; nlp.frequency.value = 220;
  const ng = c.createGain(); ng.gain.value = 0.02 + roughness * 0.02;
  o1.connect(g); o2.connect(g); g.connect(lp).connect(c.destination);
  src.connect(nlp).connect(ng).connect(c.destination);
  o1.start(); o2.start(); src.start();
  ambientNode = { nodes: [o1, o2, src] };
}
export function stopAmbient() {
  if (ambientNode) { ambientNode.nodes.forEach((n) => { try { n.stop(); } catch (e) {} }); ambientNode = null; }
}

// Chuva — som dedicado, separado do drone ambiente, só toca em salas com room.rain
let rainNode = null;
export function startRain(volume = 0.05) {
  stopRain();
  const c = ensureCtx();
  const src = c.createBufferSource();
  src.buffer = noiseBuffer(4);
  src.loop = true;
  const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1200;
  const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 4200; bp.Q.value = 0.7;
  const g = c.createGain(); g.gain.value = volume;
  src.connect(hp).connect(bp).connect(g).connect(c.destination);
  src.start();
  rainNode = { src };
}
export function stopRain() {
  if (rainNode) { try { rainNode.src.stop(); } catch (e) {} rainNode = null; }
}
