// Texturas 100% procedurais (CanvasTexture) — nada de assets externos.
// Tudo em tons de cinza de propósito: textura dá LEITURA, não cor.
import * as THREE from 'three';

function cv(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

function noise(ctx, w, h, alpha = 0.06, passes = 900) {
  for (let i = 0; i < passes; i++) {
    const g = 40 + Math.random() * 120;
    ctx.fillStyle = `rgba(${g},${g},${g},${alpha})`;
    ctx.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 3, 2 + Math.random() * 3);
  }
}

// ---------- Superfícies do ambiente ----------
export function surfaceTexture(kind, repeatX = 2, repeatY = 2) {
  const w = 512, h = 512;
  const c = cv(w, h);
  const x = c.getContext('2d');

  if (kind === 'brick') {
    x.fillStyle = '#4a4744'; x.fillRect(0, 0, w, h);
    const bh = 42, bw = 108;
    for (let row = 0; row * bh < h; row++) {
      const off = row % 2 ? bw / 2 : 0;
      for (let col = -1; col * bw < w + bw; col++) {
        const g = 62 + Math.random() * 26;
        x.fillStyle = `rgb(${g},${g - 3},${g - 5})`;
        x.fillRect(col * bw + off + 3, row * bh + 3, bw - 6, bh - 6);
      }
    }
    noise(x, w, h, 0.05);
  } else if (kind === 'concrete') {
    x.fillStyle = '#57565a'; x.fillRect(0, 0, w, h);
    noise(x, w, h, 0.08, 1600);
    x.strokeStyle = 'rgba(30,30,32,0.5)'; x.lineWidth = 2;
    for (let i = 0; i < 5; i++) {
      x.beginPath();
      let px = Math.random() * w, py = Math.random() * h;
      x.moveTo(px, py);
      for (let s = 0; s < 6; s++) { px += (Math.random() - 0.5) * 130; py += (Math.random() - 0.5) * 130; x.lineTo(px, py); }
      x.stroke();
    }
  } else if (kind === 'tile') {
    x.fillStyle = '#2c2e30'; x.fillRect(0, 0, w, h);
    const s = 64;
    for (let i = 0; i < w / s; i++) for (let j = 0; j < h / s; j++) {
      const g = 118 + Math.random() * 22;
      x.fillStyle = `rgb(${g},${g + 2},${g + 4})`;
      x.fillRect(i * s + 4, j * s + 4, s - 8, s - 8);
    }
    noise(x, w, h, 0.04);
  } else if (kind === 'metal') {
    x.fillStyle = '#4e5052'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
      const g = 74 + Math.random() * 20;
      x.fillStyle = `rgb(${g},${g},${g + 3})`;
      x.fillRect(i * 128 + 2, j * 128 + 2, 124, 124);
      x.fillStyle = 'rgba(20,20,22,0.9)';
      for (const [rx, ry] of [[14, 14], [114, 14], [14, 114], [114, 114]]) {
        x.beginPath(); x.arc(i * 128 + rx, j * 128 + ry, 4, 0, 7); x.fill();
      }
    }
    noise(x, w, h, 0.06);
  } else if (kind === 'wood') {
    x.fillStyle = '#565049'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 8; i++) {
      const g = 78 + Math.random() * 18;
      x.fillStyle = `rgb(${g},${g - 6},${g - 12})`;
      x.fillRect(0, i * 64 + 2, w, 60);
      x.strokeStyle = 'rgba(30,26,22,0.35)'; x.lineWidth = 1.5;
      for (let v = 0; v < 3; v++) {
        x.beginPath(); x.moveTo(0, i * 64 + 12 + v * 18);
        x.bezierCurveTo(w * 0.3, i * 64 + 8 + v * 18, w * 0.7, i * 64 + 20 + v * 18, w, i * 64 + 12 + v * 18);
        x.stroke();
      }
    }
  } else if (kind === 'plaster') {
    x.fillStyle = '#5c5954'; x.fillRect(0, 0, w, h);
    noise(x, w, h, 0.05, 1200);
    for (let i = 0; i < 8; i++) {
      const g = 44 + Math.random() * 16;
      x.fillStyle = `rgba(${g},${g},${g},0.35)`;
      x.beginPath();
      x.ellipse(Math.random() * w, Math.random() * h, 30 + Math.random() * 80, 20 + Math.random() * 50, Math.random() * 3, 0, 7);
      x.fill();
    }
  } else { // 'dark' e fallback
    x.fillStyle = '#3a3a3c'; x.fillRect(0, 0, w, h);
    noise(x, w, h, 0.05, 1000);
  }

  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeatX, repeatY);
  return t;
}

// ---------- Desenho pericial das evidências ----------
// theme 'paper' = sketch do dossiê (2D) · theme 'dark' = textura revelada no mesh (3D)
export function evidenceCanvas(kind, theme = 'paper', w = 320, h = 220) {
  const c = cv(w, h);
  const x = c.getContext('2d');
  const bg = theme === 'paper' ? '#d9d2c2' : '#5a5a5e';
  const ink = theme === 'paper' ? '#2b2824' : '#d8d5cf';
  x.fillStyle = bg; x.fillRect(0, 0, w, h);
  if (theme === 'paper') {
    x.strokeStyle = 'rgba(43,40,36,0.25)';
    x.strokeRect(6, 6, w - 12, h - 12);
  }
  noise(x, w, h, 0.04, 300);
  x.strokeStyle = ink; x.fillStyle = ink; x.lineWidth = 2.4; x.lineCap = 'round';
  const cx = w / 2, cy = h / 2;

  const line = (a, b, d, e) => { x.beginPath(); x.moveTo(a, b); x.lineTo(d, e); x.stroke(); };
  const circle = (a, b, r, fill = false) => { x.beginPath(); x.arc(a, b, r, 0, 7); fill ? x.fill() : x.stroke(); };

  switch (kind) {
    case 'body': {
      x.beginPath();
      x.ellipse(cx - 60, cy, 22, 16, 0.2, 0, 7); x.stroke(); // cabeça
      x.beginPath();
      x.moveTo(cx - 40, cy - 4);
      x.quadraticCurveTo(cx + 10, cy - 30, cx + 70, cy - 8);
      x.quadraticCurveTo(cx + 40, cy + 26, cx - 38, cy + 12);
      x.closePath(); x.stroke(); // torso caído
      line(cx + 60, cy + 4, cx + 96, cy + 30); line(cx + 50, cy + 14, cx + 78, cy + 44);
      x.setLineDash([6, 6]); x.strokeRect(cx - 100, cy - 44, 208, 96); x.setLineDash([]);
      circle(cx - 60, cy + 2, 3, true); // marcação na garganta
      break;
    }
    case 'paper': {
      x.save(); x.translate(cx, cy); x.rotate(-0.08);
      x.strokeRect(-70, -85, 140, 170);
      for (let i = 0; i < 8; i++) line(-52, -60 + i * 18, 30 + (i % 3) * 14, -60 + i * 18);
      x.restore();
      break;
    }
    case 'tire': {
      for (let i = 0; i < 3; i++) {
        x.beginPath(); x.moveTo(30, cy - 24 + i * 24);
        x.quadraticCurveTo(cx, cy - 40 + i * 24, w - 30, cy - 16 + i * 24); x.stroke();
      }
      for (let i = 0; i < 12; i++) line(40 + i * 22, cy - 30, 48 + i * 22, cy + 34);
      break;
    }
    case 'trash': {
      x.beginPath(); x.moveTo(cx - 40, cy - 50); x.lineTo(cx + 40, cy - 50); x.lineTo(cx + 30, cy + 60); x.lineTo(cx - 30, cy + 60); x.closePath(); x.stroke();
      line(cx - 48, cy - 50, cx + 48, cy - 50);
      line(cx - 20, cy - 30, cx - 14, cy + 40); line(cx + 18, cy - 30, cx + 12, cy + 40);
      line(cx + 40, cy + 30, cx + 78, cy + 52); circle(cx + 84, cy + 56, 6);
      break;
    }
    case 'calendar': {
      x.strokeRect(cx - 80, cy - 70, 160, 140);
      line(cx - 80, cy - 40, cx + 80, cy - 40);
      for (let i = 1; i < 5; i++) line(cx - 80 + i * 32, cy - 40, cx - 80 + i * 32, cy + 70);
      for (let i = 1; i < 4; i++) line(cx - 80, cy - 40 + i * 28, cx + 80, cy - 40 + i * 28);
      for (let i = 0; i < 9; i++) {
        const gx = cx - 64 + (i % 5) * 32, gy = cy - 26 + Math.floor(i / 5) * 28;
        line(gx - 8, gy - 8, gx + 8, gy + 8); line(gx + 8, gy - 8, gx - 8, gy + 8);
      }
      break;
    }
    case 'dishes': {
      circle(cx - 45, cy + 10, 34); circle(cx - 45, cy + 10, 22);
      x.strokeRect(cx + 10, cy - 14, 44, 40); // caneca
      x.beginPath(); x.arc(cx + 58, cy + 6, 12, -1.2, 1.2); x.stroke();
      line(cx + 18, cy - 26, cx + 22, cy - 40); line(cx + 32, cy - 26, cx + 36, cy - 44);
      break;
    }
    case 'blanket': {
      x.beginPath(); x.moveTo(30, cy + 40);
      x.quadraticCurveTo(cx - 60, cy - 50, cx, cy + 6);
      x.quadraticCurveTo(cx + 60, cy - 46, w - 30, cy + 34);
      x.stroke();
      for (let i = 0; i < 4; i++) {
        x.beginPath(); x.moveTo(60 + i * 55, cy + 36);
        x.quadraticCurveTo(75 + i * 55, cy - 4, 92 + i * 55, cy + 36); x.stroke();
      }
      break;
    }
    case 'photo': {
      for (let i = 0; i < 3; i++) {
        x.save(); x.translate(cx - 60 + i * 60, cy + (i % 2 ? -12 : 10)); x.rotate((i - 1) * 0.18);
        x.strokeRect(-34, -44, 68, 88); x.strokeRect(-26, -36, 52, 56);
        x.restore();
      }
      break;
    }
    case 'clock': {
      circle(cx, cy, 70); circle(cx, cy, 3, true);
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        line(cx + Math.cos(a) * 60, cy + Math.sin(a) * 60, cx + Math.cos(a) * 68, cy + Math.sin(a) * 68);
      }
      line(cx, cy, cx + 26, cy - 30); line(cx, cy, cx - 10, cy + 48); // ~3:33
      break;
    }
    case 'poster': {
      x.strokeRect(cx - 70, cy - 84, 140, 168);
      x.beginPath(); x.moveTo(cx - 70, cy - 20); x.lineTo(cx - 10, cy - 34); x.lineTo(cx + 34, cy + 2); x.lineTo(cx + 70, cy - 10); x.stroke();
      for (let i = 0; i < 4; i++) line(cx - 52, cy + 22 + i * 14, cx + 40 - i * 10, cy + 22 + i * 14);
      break;
    }
    case 'graffiti': {
      x.font = `bold 34px 'Courier New'`;
      x.save(); x.translate(cx, cy); x.rotate(-0.06);
      x.fillText('ELE CONTA', -86, -12);
      x.fillText('AS VOLTAS', -80, 26);
      x.restore();
      for (let i = 0; i < 5; i++) line(cx - 70 + i * 34, cy + 34, cx - 70 + i * 34, cy + 52 + (i % 2) * 10);
      break;
    }
    case 'box': {
      x.strokeRect(cx - 70, cy - 30, 140, 80);
      x.beginPath(); x.moveTo(cx - 70, cy - 30); x.lineTo(cx - 44, cy - 58); x.lineTo(cx + 96, cy - 58); x.lineTo(cx + 70, cy - 30); x.stroke();
      line(cx + 70, cy - 30, cx + 96, cy - 58); line(cx + 96, cy - 58, cx + 96, cy + 22); line(cx + 96, cy + 22, cx + 70, cy + 50);
      line(cx - 40, cy - 6, cx + 40, cy - 6); line(cx - 40, cy + 10, cx + 20, cy + 10);
      break;
    }
    case 'uvwall': {
      x.font = `bold 30px 'Courier New'`;
      x.fillText('▓▓▓▓▓▓▓', cx - 84, cy - 20);
      x.fillText('▓▓▓▓', cx - 50, cy + 18);
      x.setLineDash([4, 6]); x.strokeRect(cx - 100, cy - 54, 200, 96); x.setLineDash([]);
      break;
    }
    case 'musicbox': {
      x.strokeRect(cx - 60, cy - 20, 120, 70);
      x.beginPath(); x.moveTo(cx - 60, cy - 20); x.lineTo(cx, cy - 56); x.lineTo(cx + 60, cy - 20); x.stroke();
      circle(cx + 78, cy + 6, 10);
      line(cx + 78, cy + 6, cx + 96, cy - 8);
      break;
    }
    case 'drawing': {
      circle(cx + 40, cy - 40, 22);
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        line(cx + 40 + Math.cos(a) * 26, cy - 40 + Math.sin(a) * 26, cx + 40 + Math.cos(a) * 36, cy - 40 + Math.sin(a) * 36);
      }
      for (let i = 0; i < 4; i++) { line(cx - 90 + i * 26, cy + 60 - i * 22, cx - 64 + i * 26, cy + 60 - i * 22); line(cx - 64 + i * 26, cy + 60 - i * 22, cx - 64 + i * 26, cy + 38 - i * 22); }
      break;
    }
    case 'sheet': {
      for (let i = 0; i < 5; i++) line(30, cy - 40 + i * 16, w - 30, cy - 40 + i * 16);
      for (let i = 0; i < 5; i++) circle(70 + i * 44, cy - 36 + i * 12, 7, true);
      x.beginPath(); x.moveTo(w - 60, cy - 60); x.lineTo(w - 30, cy - 60); x.stroke();
      break;
    }
    case 'frame': {
      x.strokeRect(cx - 50, cy - 64, 100, 128);
      x.strokeRect(cx - 38, cy - 52, 76, 104);
      line(cx - 20, cy + 70, cx + 20, cy + 70);
      x.setLineDash([5, 5]); line(cx - 38, cy - 10, cx + 38, cy - 10); x.setLineDash([]);
      break;
    }
    case 'register': {
      x.strokeRect(cx - 84, cy - 50, 110, 70);
      for (let i = 0; i < 4; i++) line(cx - 70, cy - 34 + i * 14, cx + 8, cy - 34 + i * 14);
      x.strokeRect(cx + 40, cy - 58, 54, 90);
      for (let i = 0; i < 5; i++) line(cx + 48, cy - 44 + i * 16, cx + 86, cy - 44 + i * 16);
      break;
    }
    case 'hook': {
      line(20, cy - 70, w - 20, cy - 70);
      for (let i = 0; i < 4; i++) {
        const hx = 60 + i * 66;
        line(hx, cy - 70, hx, cy - 10);
        x.beginPath(); x.arc(hx + 10, cy - 6, 12, Math.PI * 0.9, Math.PI * 1.9); x.stroke();
      }
      break;
    }
    case 'apron': {
      x.beginPath(); x.moveTo(cx - 34, cy - 70); x.lineTo(cx + 34, cy - 70); x.lineTo(cx + 46, cy + 10); x.lineTo(cx + 34, cy + 70); x.lineTo(cx - 34, cy + 70); x.lineTo(cx - 46, cy + 10); x.closePath(); x.stroke();
      x.beginPath(); x.arc(cx, cy - 70, 22, Math.PI, 0); x.stroke();
      line(cx - 46, cy - 20, cx - 78, cy - 34); line(cx + 46, cy - 20, cx + 78, cy - 34);
      break;
    }
    case 'drain': {
      circle(cx, cy, 58); circle(cx, cy, 44);
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        line(cx + Math.cos(a) * 12, cy + Math.sin(a) * 12, cx + Math.cos(a) * 40, cy + Math.sin(a) * 40);
      }
      break;
    }
    case 'tag': {
      for (let i = 0; i < 3; i++) {
        x.save(); x.translate(cx - 60 + i * 60, cy + (i % 2 ? 14 : -10)); x.rotate((i - 1) * 0.12);
        x.beginPath(); x.moveTo(-30, -18); x.lineTo(18, -18); x.lineTo(32, 0); x.lineTo(18, 18); x.lineTo(-30, 18); x.closePath(); x.stroke();
        circle(20, 0, 4);
        x.restore();
      }
      break;
    }
    case 'curtain': {
      for (let i = 0; i < 6; i++) {
        x.beginPath(); x.moveTo(40 + i * 48, 26);
        x.quadraticCurveTo(28 + i * 48, cy, 44 + i * 48, h - 26); x.stroke();
      }
      line(20, 26, w - 20, 26);
      break;
    }
    case 'door': {
      x.strokeRect(cx - 55, cy - 84, 110, 168);
      circle(cx + 34, cy + 6, 6, true);
      x.setLineDash([5, 5]); x.strokeRect(cx - 24, cy - 34, 48, 48); x.setLineDash([]);
      x.font = `bold 16px 'Courier New'`; x.fillText('?', cx - 5, cy - 4);
      break;
    }
    case 'bear': {
      circle(cx, cy - 34, 26); // cabeça
      circle(cx - 22, cy - 56, 10); circle(cx + 22, cy - 56, 10); // orelhas
      x.beginPath(); x.ellipse(cx, cy + 26, 30, 36, 0, 0, 7); x.stroke(); // corpo
      circle(cx - 34, cy + 12, 10); circle(cx + 34, cy + 12, 10); // braços
      circle(cx - 8, cy - 38, 2, true); circle(cx + 8, cy - 38, 2, true); // olhos
      x.save(); x.translate(cx + 34, cy - 52); x.rotate(0.5);
      x.strokeRect(-4, -10, 26, 16); line(-4, -2, -14, -8); // etiqueta da loja
      x.restore();
      break;
    }
    case 'turnstile': {
      line(cx - 70, cy + 60, cx - 70, cy - 50); // coluna
      for (let i = 0; i < 3; i++) {
        const a = -0.5 + i * 0.9;
        line(cx - 70, cy - 30, cx - 70 + Math.cos(a) * 90, cy - 30 + Math.sin(a) * 46);
      }
      x.setLineDash([5, 5]);
      x.beginPath(); x.moveTo(cx - 70, cy - 6);
      x.quadraticCurveTo(cx + 10, cy + 18, cx + 78, cy - 2); x.stroke(); // corrente
      x.setLineDash([]);
      x.strokeRect(cx + 66, cy - 12, 22, 26); circle(cx + 77, cy + 6, 4); // cadeado
      break;
    }
    default: {
      for (let i = 0; i < 10; i++) line(30 + i * 26, 40, 10 + i * 26, h - 40);
    }
  }
  return c;
}

export function revealTexture(kind) {
  const t = new THREE.CanvasTexture(evidenceCanvas(kind, 'dark', 256, 256));
  return t;
}

export function drawSketchInto(canvasEl, kind) {
  const src = evidenceCanvas(kind, 'paper', canvasEl.width, canvasEl.height);
  canvasEl.getContext('2d').drawImage(src, 0, 0);
}

// ---------- Texturas de MATERIAL (revelação 3D) ----------
// O sketch pericial fica no dossiê 2D. No mundo 3D, inspecionar revela a
// MATÉRIA real do objeto: metal enferrujado, sangue coagulado, papel velho.
// Tudo procedural, em camadas: base -> padrão -> sujeira -> iluminação fake.

function vgrad(x, w, h, top, bottom) {
  const g = x.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, top); g.addColorStop(1, bottom);
  x.fillStyle = g; x.fillRect(0, 0, w, h);
}

function grain(x, w, h, rgb, passes = 1400, alpha = 0.05, size = 3) {
  for (let i = 0; i < passes; i++) {
    const j = (Math.random() - 0.5) * 34;
    x.fillStyle = `rgba(${rgb[0] + j | 0},${rgb[1] + j | 0},${rgb[2] + j | 0},${alpha})`;
    x.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * size, 1 + Math.random() * size);
  }
}

function blotch(x, w, h, color, n, rMin, rMax, alpha = 0.7) {
  for (let i = 0; i < n; i++) {
    const bx = Math.random() * w, by = Math.random() * h, r = rMin + Math.random() * (rMax - rMin);
    const g = x.createRadialGradient(bx, by, 1, bx, by, r);
    g.addColorStop(0, color); g.addColorStop(1, 'rgba(0,0,0,0)');
    x.globalAlpha = alpha; x.fillStyle = g;
    x.beginPath(); x.arc(bx, by, r, 0, 7); x.fill();
    x.globalAlpha = 1;
  }
}

function drips(x, w, h, color, n, yStart = 0) {
  x.strokeStyle = color; x.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const dx = Math.random() * w, len = 30 + Math.random() * (h * 0.5);
    x.lineWidth = 2 + Math.random() * 4;
    x.globalAlpha = 0.25 + Math.random() * 0.4;
    x.beginPath(); x.moveTo(dx, yStart + Math.random() * 40);
    x.quadraticCurveTo(dx + (Math.random() - 0.5) * 8, yStart + len * 0.6, dx + (Math.random() - 0.5) * 5, yStart + len);
    x.stroke();
    x.globalAlpha = 0.6;
    x.beginPath(); x.arc(dx + (Math.random() - 0.5) * 5, yStart + len, x.lineWidth * 0.8, 0, 7); x.fill();
    x.fillStyle = color;
    x.globalAlpha = 1;
  }
}

function scratches(x, w, h, color, n, alpha = 0.25) {
  x.strokeStyle = color; x.lineWidth = 1;
  for (let i = 0; i < n; i++) {
    x.globalAlpha = alpha * (0.4 + Math.random() * 0.6);
    const sx = Math.random() * w, sy = Math.random() * h, a = Math.random() * Math.PI;
    const l = 20 + Math.random() * 90;
    x.beginPath(); x.moveTo(sx, sy); x.lineTo(sx + Math.cos(a) * l, sy + Math.sin(a) * l); x.stroke();
  }
  x.globalAlpha = 1;
}

function sheenTop(x, w, h, strength = 0.14) {
  const g = x.createRadialGradient(w * 0.5, h * 0.12, 10, w * 0.5, h * 0.12, w * 0.8);
  g.addColorStop(0, `rgba(255,255,255,${strength})`); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, w, h);
}

function materialCanvas(kind) {
  const w = 512, h = 512;
  const c = cv(w, h);
  const x = c.getContext('2d');

  switch (kind) {
    case 'galvanized': { // lixeira, catraca: zinco sujo, amassados, gosma escorrida
      vgrad(x, w, h, '#8d9296', '#5c6064');
      for (let i = 0; i < 7; i++) { // frisos verticais do tambor
        const fx = (i + 0.5) * (w / 7);
        const g = x.createLinearGradient(fx - 22, 0, fx + 22, 0);
        g.addColorStop(0, 'rgba(0,0,0,0.22)'); g.addColorStop(0.5, 'rgba(255,255,255,0.12)'); g.addColorStop(1, 'rgba(0,0,0,0.22)');
        x.fillStyle = g; x.fillRect(fx - 22, 0, 44, h);
      }
      grain(x, w, h, [120, 124, 128], 1600, 0.05);
      blotch(x, w, h, 'rgba(90,60,30,0.55)', 9, 20, 70, 0.5); // ferrugem
      drips(x, w, h, 'rgba(64,52,30,0.8)', 10, h * 0.1);      // gosma
      blotch(x, w, h * 0.3, 'rgba(30,28,24,0.5)', 5, 30, 90, 0.5); // boca suja
      x.translate(0, h * 0.72); blotch(x, w, h * 0.28, 'rgba(25,22,18,0.6)', 6, 30, 80, 0.6); x.setTransform(1, 0, 0, 1, 0, 0); // base imunda
      scratches(x, w, h, '#d8dce0', 24, 0.2);
      sheenTop(x, w, h, 0.12);
      break;
    }
    case 'rustiron': { // relógio, ganchos, dreno: ferro comido
      vgrad(x, w, h, '#5a4636', '#33261c');
      blotch(x, w, h, 'rgba(146,84,34,0.8)', 16, 18, 70, 0.65);
      blotch(x, w, h, 'rgba(80,46,22,0.9)', 12, 8, 30, 0.7);
      grain(x, w, h, [150, 92, 44], 2200, 0.06);
      drips(x, w, h, 'rgba(120,68,28,0.7)', 8);
      scratches(x, w, h, '#2a1e14', 18, 0.35);
      sheenTop(x, w, h, 0.07);
      break;
    }
    case 'steel': { // portas: aço escuro, rebites, riscos
      vgrad(x, w, h, '#565b63', '#33373d');
      grain(x, w, h, [90, 96, 104], 1500, 0.05);
      x.strokeStyle = 'rgba(15,17,20,0.6)'; x.lineWidth = 3;
      x.strokeRect(26, 26, w - 52, h - 52);
      x.fillStyle = '#20242a';
      for (const [rx, ry] of [[26, 26], [w - 26, 26], [26, h - 26], [w - 26, h - 26], [26, h / 2], [w - 26, h / 2]]) {
        x.beginPath(); x.arc(rx, ry, 7, 0, 7); x.fill();
        x.fillStyle = 'rgba(255,255,255,0.18)'; x.beginPath(); x.arc(rx - 2, ry - 2, 2.4, 0, 7); x.fill();
        x.fillStyle = '#20242a';
      }
      scratches(x, w, h, '#9aa2ac', 34, 0.22);
      blotch(x, w, h, 'rgba(70,50,26,0.4)', 6, 14, 44, 0.4);
      sheenTop(x, w, h, 0.1);
      break;
    }
    case 'gore': { // o corpo: tecido pálido, manchas coaguladas escuras
      vgrad(x, w, h, '#9d9894', '#6e6a68');
      grain(x, w, h, [140, 132, 128], 1600, 0.05);
      // dobras do tecido/lona
      x.strokeStyle = 'rgba(40,38,36,0.3)'; x.lineWidth = 3;
      for (let i = 0; i < 6; i++) {
        x.beginPath(); x.moveTo(0, 60 + i * 76 + Math.random() * 20);
        x.bezierCurveTo(w * 0.3, 40 + i * 76, w * 0.7, 90 + i * 76, w, 60 + i * 76 + Math.random() * 20);
        x.stroke();
      }
      // sangue: halo -> mancha -> coágulo quase preto com brilho
      blotch(x, w, h, 'rgba(120,30,26,0.5)', 7, 40, 110, 0.55);
      blotch(x, w, h, 'rgba(84,14,12,0.9)', 9, 18, 60, 0.8);
      blotch(x, w, h, 'rgba(38,6,6,0.95)', 10, 6, 22, 0.9);
      for (let i = 0; i < 60; i++) { // respingos
        x.fillStyle = 'rgba(96,16,14,0.8)';
        x.beginPath(); x.arc(Math.random() * w, Math.random() * h, Math.random() * 2.6, 0, 7); x.fill();
      }
      sheenTop(x, w, h, 0.06);
      break;
    }
    case 'oldpaper': case 'mail': case 'grid': case 'staff': case 'crayon': case 'layers': case 'tags': {
      vgrad(x, w, h, '#d9cdae', '#b3a582');
      grain(x, w, h, [190, 176, 140], 1200, 0.05);
      // mancha d'água anelada + cantos queimados de idade
      blotch(x, w, h, 'rgba(140,116,70,0.5)', 5, 30, 90, 0.4);
      x.strokeStyle = 'rgba(130,104,62,0.4)'; x.lineWidth = 2;
      x.beginPath(); x.ellipse(w * 0.7, h * 0.3, 90, 60, 0.3, 0, 7); x.stroke();
      x.fillStyle = 'rgba(90,70,40,0.35)';
      x.beginPath(); x.moveTo(0, 0); x.lineTo(90, 0); x.lineTo(0, 90); x.fill();
      x.beginPath(); x.moveTo(w, h); x.lineTo(w - 90, h); x.lineTo(w, h - 90); x.fill();
      x.strokeStyle = 'rgba(60,50,38,0.65)'; x.lineWidth = 2;
      if (kind === 'grid') { // calendário
        for (let i = 0; i <= 5; i++) { x.beginPath(); x.moveTo(40 + i * 86, 90); x.lineTo(40 + i * 86, h - 50); x.stroke(); }
        for (let j = 0; j <= 5; j++) { x.beginPath(); x.moveTo(40, 90 + j * 74); x.lineTo(w - 42, 90 + j * 74); x.stroke(); }
        x.lineWidth = 4; x.strokeStyle = 'rgba(70,20,16,0.75)';
        for (let i = 0; i < 14; i++) {
          const gx = 60 + (i % 5) * 86, gy = 108 + Math.floor(i / 5) * 74;
          x.beginPath(); x.moveTo(gx, gy); x.lineTo(gx + 44, gy + 40); x.moveTo(gx + 44, gy); x.lineTo(gx, gy + 40); x.stroke();
        }
      } else if (kind === 'staff') { // partitura
        for (let s2 = 0; s2 < 4; s2++) for (let i = 0; i < 5; i++) {
          x.beginPath(); x.moveTo(36, 70 + s2 * 110 + i * 11); x.lineTo(w - 36, 70 + s2 * 110 + i * 11); x.stroke();
        }
        x.fillStyle = 'rgba(50,42,34,0.8)';
        for (let i = 0; i < 22; i++) {
          x.beginPath(); x.ellipse(60 + Math.random() * (w - 120), 70 + Math.floor(Math.random() * 4) * 110 + Math.random() * 44, 7, 5, -0.4, 0, 7); x.fill();
        }
        x.fillStyle = 'rgba(120,96,60,0.9)'; x.fillRect(0, h * 0.62, w, 8); // rasgo
      } else if (kind === 'crayon') { // desenho infantil
        const cores = ['#b8452e', '#3a6ea5', '#c9a227', '#4d8a4d'];
        x.lineWidth = 7; x.lineCap = 'round';
        x.strokeStyle = cores[2];
        x.beginPath(); x.arc(w * 0.68, h * 0.3, 46, 0, 7); x.stroke(); // sol
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2;
          x.beginPath(); x.moveTo(w * 0.68 + Math.cos(a) * 56, h * 0.3 + Math.sin(a) * 56);
          x.lineTo(w * 0.68 + Math.cos(a) * 78, h * 0.3 + Math.sin(a) * 78); x.stroke();
        }
        x.strokeStyle = cores[1];
        for (let i = 0; i < 4; i++) { // escada de degraus tortos
          x.beginPath(); x.moveTo(70 + i * 60, h - 80 - i * 52); x.lineTo(130 + i * 60, h - 80 - i * 52);
          x.lineTo(130 + i * 60, h - 132 - i * 52); x.stroke();
        }
        x.strokeStyle = cores[0]; x.beginPath(); x.moveTo(60, h - 60); x.lineTo(w - 60, h - 60); x.stroke();
      } else if (kind === 'mail') { // pilha de envelopes
        for (let i = 0; i < 6; i++) {
          x.save(); x.translate(w / 2 + (Math.random() - 0.5) * 60, 90 + i * 62); x.rotate((Math.random() - 0.5) * 0.16);
          x.fillStyle = i % 2 ? '#cfc2a0' : '#c4b593';
          x.fillRect(-150, -34, 300, 68);
          x.strokeStyle = 'rgba(70,58,40,0.6)'; x.lineWidth = 2; x.strokeRect(-150, -34, 300, 68);
          x.beginPath(); x.moveTo(-150, -34); x.lineTo(0, 10); x.lineTo(150, -34); x.stroke();
          x.strokeStyle = 'rgba(120,30,26,0.55)'; x.beginPath(); x.arc(96, -6, 20, 0, 7); x.stroke(); // carimbo
          x.restore();
        }
      } else if (kind === 'layers') { // cartaz: camadas rasgadas
        const tons = ['#c9bb96', '#b5a67e', '#a3926a', '#8e7d58'];
        for (let i = 0; i < 4; i++) {
          x.fillStyle = tons[i];
          x.beginPath(); x.moveTo(0, i * 90 + 40);
          for (let px = 0; px <= w; px += 34) x.lineTo(px, i * 90 + 40 + Math.random() * 46);
          x.lineTo(w, h); x.lineTo(0, h); x.fill();
        }
        x.fillStyle = 'rgba(60,50,38,0.5)'; x.font = 'bold 40px Courier New';
        x.fillText('▚▚▚▚▚', 60, 110); x.fillText('▚▚▚', 120, 300);
      } else if (kind === 'tags') { // etiquetas numeradas
        x.fillStyle = 'rgba(60,50,38,0.75)'; x.font = 'bold 34px Courier New';
        for (let i = 0; i < 6; i++) {
          x.save(); x.translate(90 + (i % 2) * 240, 90 + Math.floor(i / 2) * 140); x.rotate((Math.random() - 0.5) * 0.2);
          x.strokeRect(-64, -34, 128, 68);
          x.beginPath(); x.arc(46, 0, 6, 0, 7); x.stroke();
          x.fillText(String(140 + i * 7), -46, 12);
          x.restore();
        }
      } else { // caligrafia borrada
        x.strokeStyle = 'rgba(56,46,38,0.7)'; x.lineWidth = 3; x.lineCap = 'round';
        for (let ln = 0; ln < 11; ln++) {
          const y0 = 60 + ln * 38; let px = 50;
          x.beginPath(); x.moveTo(px, y0);
          while (px < w - 60 - Math.random() * 120) {
            px += 8 + Math.random() * 16;
            x.quadraticCurveTo(px - 6, y0 - 8 + Math.random() * 16, px, y0 + (Math.random() - 0.5) * 6);
          }
          x.stroke();
        }
        blotch(x, w, h, 'rgba(60,50,40,0.35)', 4, 16, 50, 0.5); // tinta borrada pela água
      }
      break;
    }
    case 'rubbertread': { // marca de pneu: asfalto molhado + banda de rodagem
      vgrad(x, w, h, '#2c2e31', '#191a1c');
      grain(x, w, h, [70, 72, 76], 2400, 0.06);
      blotch(x, w, h, 'rgba(140,150,165,0.16)', 8, 26, 90, 0.5); // poças refletindo
      x.fillStyle = 'rgba(10,10,11,0.9)';
      const bw2 = 46; // duas bandas de rodagem diagonais
      for (const off of [w * 0.3, w * 0.62]) {
        for (let yy = -40; yy < h + 40; yy += 34) {
          x.save(); x.translate(off + yy * 0.06, yy); x.rotate(0.06);
          x.fillRect(-bw2 / 2, 0, bw2, 22);
          x.fillStyle = 'rgba(52,54,58,0.9)'; x.fillRect(-bw2 / 2 + 8, 6, bw2 - 16, 4); // sulco interno
          x.fillStyle = 'rgba(10,10,11,0.9)';
          x.restore();
        }
      }
      sheenTop(x, w, h, 0.1);
      break;
    }
    case 'woodworn': { // caixa de música, balcão: verniz gasto
      vgrad(x, w, h, '#6e5238', '#46331f');
      for (let i = 0; i < 10; i++) {
        x.strokeStyle = `rgba(30,20,10,${0.2 + Math.random() * 0.25})`; x.lineWidth = 2 + Math.random() * 2;
        x.beginPath(); x.moveTo(0, 26 + i * 50);
        x.bezierCurveTo(w * 0.3, 16 + i * 50, w * 0.7, 40 + i * 50, w, 26 + i * 50);
        x.stroke();
      }
      for (let i = 0; i < 3; i++) { // nós
        const nx = Math.random() * w, ny = Math.random() * h;
        x.strokeStyle = 'rgba(28,18,9,0.6)';
        x.beginPath(); x.ellipse(nx, ny, 16, 9, 0.3, 0, 7); x.stroke();
        x.beginPath(); x.ellipse(nx, ny, 7, 4, 0.3, 0, 7); x.stroke();
      }
      grain(x, w, h, [110, 84, 56], 1000, 0.05);
      scratches(x, w, h, '#d8c8a8', 16, 0.18);
      sheenTop(x, w, h, 0.12);
      break;
    }
    case 'cardboard': {
      vgrad(x, w, h, '#9a7c52', '#77603f');
      x.fillStyle = 'rgba(60,46,28,0.35)';
      for (let y = 0; y < h; y += 9) x.fillRect(0, y, w, 3); // canelado
      x.fillStyle = 'rgba(196,182,150,0.85)'; x.fillRect(w * 0.42, 0, w * 0.16, h); // fita
      x.fillStyle = 'rgba(140,124,92,0.5)'; x.fillRect(w * 0.42, 0, 6, h); x.fillRect(w * 0.58 - 6, 0, 6, h);
      x.strokeStyle = 'rgba(50,38,24,0.5)'; x.lineWidth = 3;
      x.beginPath(); x.moveTo(0, h * 0.34); x.lineTo(w, h * 0.36); x.stroke(); // vinco
      x.save(); x.translate(w * 0.24, h * 0.62); x.rotate(-0.1);
      x.strokeStyle = 'rgba(96,26,22,0.55)'; x.lineWidth = 4; x.strokeRect(-70, -30, 140, 60);
      x.font = 'bold 26px Courier New'; x.fillStyle = 'rgba(96,26,22,0.55)'; x.fillText('ARQUIVO', -56, 8); x.restore();
      grain(x, w, h, [130, 108, 74], 900, 0.05);
      break;
    }
    case 'weave': { // cobertor: trama de lã com dobras
      vgrad(x, w, h, '#5d6b80', '#435062');
      for (let yy = 0; yy < h; yy += 12) for (let xx = 0; xx < w; xx += 12) {
        const claro = ((xx + yy) / 12) % 2 === 0;
        x.fillStyle = claro ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.12)';
        x.fillRect(xx, yy, 12, 12);
      }
      x.strokeStyle = 'rgba(15,20,30,0.35)'; x.lineWidth = 12;
      for (let i = 0; i < 4; i++) { // dobras largas
        x.beginPath(); x.moveTo(0, 90 + i * 120);
        x.bezierCurveTo(w * 0.35, 60 + i * 120, w * 0.65, 130 + i * 120, w, 90 + i * 120);
        x.stroke();
      }
      grain(x, w, h, [120, 130, 150], 900, 0.04);
      break;
    }
    case 'plush': { // urso: felpa com costura e etiqueta
      vgrad(x, w, h, '#8a6a48', '#6a4e32');
      for (let i = 0; i < 4200; i++) { // fibras
        const fx = Math.random() * w, fy = Math.random() * h, a = Math.random() * Math.PI;
        x.strokeStyle = `rgba(${150 + Math.random() * 60 | 0},${115 + Math.random() * 45 | 0},${75 + Math.random() * 30 | 0},0.25)`;
        x.lineWidth = 1;
        x.beginPath(); x.moveTo(fx, fy); x.lineTo(fx + Math.cos(a) * 6, fy + Math.sin(a) * 6); x.stroke();
      }
      x.strokeStyle = 'rgba(40,28,16,0.6)'; x.lineWidth = 3; x.setLineDash([8, 7]);
      x.beginPath(); x.moveTo(w / 2, 0); x.lineTo(w / 2, h); x.stroke(); x.setLineDash([]); // costura
      x.save(); x.translate(w * 0.78, h * 0.2); x.rotate(0.4); // etiqueta da loja
      x.fillStyle = '#e8e2d2'; x.fillRect(-46, -26, 92, 52);
      x.strokeStyle = 'rgba(90,26,22,0.8)'; x.lineWidth = 2; x.strokeRect(-46, -26, 92, 52);
      x.fillStyle = 'rgba(90,26,22,0.9)'; x.font = 'bold 20px Courier New'; x.fillText('R$ 39,90', -40, 8);
      x.restore();
      break;
    }
    case 'velvet': { // cortina: veludo vinho com pregas
      vgrad(x, w, h, '#5a2430', '#33131c');
      for (let i = 0; i < 9; i++) { // pregas verticais com brilho
        const fx = (i + 0.5) * (w / 9);
        const g = x.createLinearGradient(fx - 28, 0, fx + 28, 0);
        g.addColorStop(0, 'rgba(0,0,0,0.5)'); g.addColorStop(0.5, 'rgba(255,190,200,0.12)'); g.addColorStop(1, 'rgba(0,0,0,0.5)');
        x.fillStyle = g; x.fillRect(fx - 28, 0, 56, h);
      }
      grain(x, w, h, [90, 40, 55], 1600, 0.05);
      blotch(x, w, h, 'rgba(20,8,12,0.5)', 8, 20, 70, 0.5); // traça/desgaste
      sheenTop(x, w, h, 0.08);
      break;
    }
    case 'gorecloth': { // avental: lona clara + sangue seco escorrido
      vgrad(x, w, h, '#a7a9a6', '#7e807d');
      for (let i = 0; i < w; i += 5) { x.fillStyle = 'rgba(255,255,255,0.04)'; x.fillRect(i, 0, 2, h); }
      x.strokeStyle = 'rgba(40,42,40,0.4)'; x.lineWidth = 4;
      x.beginPath(); x.moveTo(0, h * 0.2); x.bezierCurveTo(w * 0.3, h * 0.16, w * 0.7, h * 0.26, w, h * 0.2); x.stroke();
      blotch(x, w, h, 'rgba(110,26,22,0.6)', 8, 24, 80, 0.6);
      blotch(x, w, h, 'rgba(66,12,10,0.9)', 10, 8, 30, 0.8);
      drips(x, w, h, 'rgba(84,16,14,0.8)', 12, h * 0.15);
      grain(x, w, h, [150, 148, 144], 800, 0.04);
      break;
    }
    case 'ceramic': { // pia/louça: azulejo branco sujo + café
      vgrad(x, w, h, '#c9cdcb', '#a6aba9');
      x.strokeStyle = 'rgba(70,76,78,0.7)'; x.lineWidth = 5;
      for (let i = 0; i <= 4; i++) {
        x.beginPath(); x.moveTo(i * 128, 0); x.lineTo(i * 128, h); x.stroke();
        x.beginPath(); x.moveTo(0, i * 128); x.lineTo(w, i * 128); x.stroke();
      }
      blotch(x, w, h, 'rgba(96,66,32,0.5)', 8, 12, 44, 0.55); // café
      x.strokeStyle = 'rgba(96,66,32,0.6)'; x.lineWidth = 3;
      x.beginPath(); x.arc(w * 0.32, h * 0.4, 34, 0, 7); x.stroke(); // marca de xícara
      x.beginPath(); x.arc(w * 0.7, h * 0.66, 30, 0, 7); x.stroke();
      scratches(x, w, h, '#5c6260', 14, 0.3); // trincas
      grain(x, w, h, [180, 184, 182], 700, 0.04);
      sheenTop(x, w, h, 0.14);
      break;
    }
    case 'polaroid': { // fotos: moldura branca + cena escura granulada
      x.fillStyle = '#e9e5da'; x.fillRect(0, 0, w, h);
      grain(x, w, h, [210, 204, 190], 600, 0.05);
      x.fillStyle = '#14161c'; x.fillRect(40, 40, w - 80, h - 150);
      grain(x, 40 + (w - 80), 40 + (h - 150), [60, 66, 84], 2200, 0.08, 2);
      x.fillStyle = 'rgba(120,130,155,0.5)'; // silhuetas sentadas
      for (let i = 0; i < 3; i++) {
        const px = 110 + i * 120;
        x.beginPath(); x.arc(px, 200, 22, 0, 7); x.fill();
        x.fillRect(px - 28, 222, 56, 100);
      }
      const g = x.createRadialGradient(w / 2, 120, 10, w / 2, 120, 240); // estouro do flash
      g.addColorStop(0, 'rgba(255,246,220,0.35)'); g.addColorStop(1, 'rgba(255,246,220,0)');
      x.fillStyle = g; x.fillRect(40, 40, w - 80, h - 150);
      x.fillStyle = 'rgba(56,46,38,0.7)'; x.font = '28px Courier New';
      x.fillText('jantar. todos juntos.', 60, h - 56);
      break;
    }
    case 'paintwall': { // pichação: azulejo de metrô + tinta escorrendo
      vgrad(x, w, h, '#6b7176', '#4a4f54');
      x.strokeStyle = 'rgba(30,34,38,0.6)'; x.lineWidth = 4;
      for (let i = 0; i <= 4; i++) { x.beginPath(); x.moveTo(0, i * 128); x.lineTo(w, i * 128); x.stroke(); }
      for (let i = 0; i <= 8; i++) { x.beginPath(); x.moveTo(i * 64, 0); x.lineTo(i * 64, h); x.stroke(); }
      grain(x, w, h, [110, 116, 120], 900, 0.05);
      x.fillStyle = 'rgba(150,26,22,0.9)'; x.font = 'bold 64px Courier New';
      x.save(); x.translate(w / 2, h * 0.4); x.rotate(-0.05);
      x.fillText('ELE CONTA', -212, 0); x.fillText('AS VOLTAS', -196, 74); x.restore();
      drips(x, w, h, 'rgba(150,26,22,0.85)', 16, h * 0.42);
      sheenTop(x, w, h, 0.08);
      break;
    }
    case 'redmetal': { // extintor
      vgrad(x, w, h, '#a5322c', '#6e1d1a');
      const g = x.createLinearGradient(0, 0, w, 0);
      g.addColorStop(0, 'rgba(0,0,0,0.35)'); g.addColorStop(0.5, 'rgba(255,255,255,0.16)'); g.addColorStop(1, 'rgba(0,0,0,0.35)');
      x.fillStyle = g; x.fillRect(0, 0, w, h);
      x.fillStyle = '#e8e2d2'; x.fillRect(60, h * 0.34, w - 120, 110); // rótulo
      x.fillStyle = 'rgba(60,20,16,0.9)'; x.font = 'bold 34px Courier New'; x.fillText('EXTINTOR', 96, h * 0.34 + 52);
      x.font = '20px Courier New'; x.fillText('recarga vencida: 2016', 96, h * 0.34 + 88);
      blotch(x, w, h, 'rgba(90,50,24,0.5)', 8, 12, 40, 0.5);
      scratches(x, w, h, '#3a1512', 20, 0.3);
      sheenTop(x, w, h, 0.16);
      break;
    }
    case 'concretegrime': default: {
      vgrad(x, w, h, '#5e5c60', '#3c3b3f');
      grain(x, w, h, [100, 98, 104], 2000, 0.06);
      blotch(x, w, h, 'rgba(20,20,24,0.5)', 8, 24, 80, 0.5);
      scratches(x, w, h, '#26262a', 20, 0.3);
      drips(x, w, h, 'rgba(30,30,34,0.5)', 6);
      break;
    }
  }
  return c;
}

// sketch pericial (dossiê 2D) -> material real (mundo 3D)
const MATERIAL_MAP = {
  trash: 'galvanized', turnstile: 'galvanized',
  clock: 'rustiron', hook: 'rustiron', drain: 'rustiron',
  door: 'steel', generic: 'redmetal',
  body: 'gore', apron: 'gorecloth',
  paper: 'oldpaper', register: 'oldpaper', calendar: 'grid', sheet: 'staff',
  drawing: 'crayon', poster: 'layers', tag: 'tags', mail: 'mail',
  tire: 'rubbertread',
  musicbox: 'woodworn', frame: 'woodworn',
  box: 'cardboard',
  blanket: 'weave', bear: 'plush', curtain: 'velvet',
  dishes: 'ceramic',
  photo: 'polaroid',
  graffiti: 'paintwall',
  uvwall: 'concretegrime',
};

export function revealMaterialTexture(kind) {
  const mat2 = MATERIAL_MAP[kind] || 'concretegrime';
  const t = new THREE.CanvasTexture(materialCanvas(mat2));
  return t;
}

// ---------- Peça de quebra-cabeça ----------
// Caminho 2D da peça (knobs fixos: topo fora, direita dentro, base fora, esquerda dentro)
export function tracePiecePath(x, px, py, s) {
  const r = s * 0.18, m = s / 2;
  x.beginPath();
  x.moveTo(px, py);
  // topo (knob pra fora = pra cima)
  x.lineTo(px + m - r, py);
  x.arc(px + m, py, r, Math.PI, 0, true);
  x.lineTo(px + s, py);
  // direita (knob pra dentro)
  x.lineTo(px + s, py + m - r);
  x.arc(px + s, py + m, r, -Math.PI / 2, Math.PI / 2, true);
  x.lineTo(px + s, py + s);
  // base (knob pra fora = pra baixo)
  x.lineTo(px + m + r, py + s);
  x.arc(px + m, py + s, r, 0, Math.PI, false);
  x.lineTo(px, py + s);
  // esquerda (knob pra dentro)
  x.lineTo(px, py + m + r);
  x.arc(px, py + m, r, Math.PI / 2, -Math.PI / 2, true);
  x.closePath();
}

export function drawPuzzlePiece(x, px, py, s, { fill = '#8e1d1d', stroke = '#d8d3ca', dash = false, label = '' } = {}) {
  x.save();
  if (dash) x.setLineDash([6, 6]);
  tracePiecePath(x, px, py, s);
  if (fill) { x.fillStyle = fill; x.fill(); }
  if (stroke) { x.strokeStyle = stroke; x.lineWidth = 2; x.stroke(); }
  x.setLineDash([]);
  if (label) {
    x.fillStyle = '#e8e2d6'; x.font = `bold ${s * 0.34}px 'Courier New'`;
    x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(label, px + s / 2, py + s / 2);
  }
  x.restore();
}

// Geometria 3D da peça (THREE.Shape com os mesmos knobs; eixo Y invertido em relação ao canvas)
export function makePieceGeometry(size = 0.26) {
  const s = size, r = s * 0.18, m = s / 2;
  const sh = new THREE.Shape();
  sh.moveTo(0, 0);
  sh.lineTo(m - r, 0);
  sh.absarc(m, 0, r, Math.PI, 0, false);           // knob pra fora (Y+)
  sh.lineTo(s, 0);
  sh.lineTo(s, -(m - r));
  sh.absarc(s, -m, r, Math.PI / 2, -Math.PI / 2, false); // knob pra dentro
  sh.lineTo(s, -s);
  sh.lineTo(m + r, -s);
  sh.absarc(m, -s, r, 0, Math.PI, true);           // knob pra fora (Y-)
  sh.lineTo(0, -s);
  sh.lineTo(0, -(m + r));
  sh.absarc(0, -m, r, -Math.PI / 2, Math.PI / 2, false); // knob pra dentro
  sh.closePath();
  const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.045, bevelEnabled: false });
  geo.center();
  return geo;
}
