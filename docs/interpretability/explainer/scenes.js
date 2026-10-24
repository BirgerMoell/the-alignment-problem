// "Looking inside the machine": bright, friendly scenes about interpretability, drawn in code. Each scene is a pure function of
// time; s.at(i, offset, duration) is the eased progress from narration line i.
"use strict";
(() => {
const S = Explainer.scenes;
const PAL = [C.purple, C.teal, C.orange, C.pink, C.blue, C.green, C.yellow];

// ------------------------------------------------------------ friendly characters and props
function person(g, x, y, s, col, o = {}) {
  g.save();
  g.globalAlpha *= o.alpha === undefined ? 1 : clamp(o.alpha);
  const bob = o.bob ? Math.sin(o.bob) * 4 * s : 0;
  g.translate(x, y + bob);
  g.fillStyle = col;
  g.beginPath(); g.roundRect(-22 * s, 6 * s, 44 * s, 46 * s, [22 * s, 22 * s, 8 * s, 8 * s]); g.fill();
  g.beginPath(); g.arc(0, -14 * s, 17 * s, 0, 7); g.fill();
  g.fillStyle = "#FFFFFF";
  g.beginPath(); g.arc(-6 * s, -16 * s, 2.6 * s, 0, 7); g.arc(6 * s, -16 * s, 2.6 * s, 0, 7); g.fill();
  g.strokeStyle = "#FFFFFF"; g.lineWidth = 2.4 * s; g.lineCap = "round";
  g.beginPath(); g.arc(0, -10 * s, 6 * s, 0.2 * Math.PI, 0.8 * Math.PI); g.stroke();
  if (o.lit) { g.globalAlpha *= 0.5; glow(g, 0, 0, 80 * s, col, 0.5); }
  g.restore();
}

function bot(g, x, y, s, o = {}) {
  g.save();
  g.translate(x, y + Math.sin((o.t || 0) * 1.6) * 6 * s);
  if (o.glow !== false) glow(g, 0, 0, 220 * s, o.col || C.purple, 0.28);
  g.strokeStyle = o.col || C.purple; g.lineWidth = 5 * s;
  g.beginPath(); g.moveTo(0, -78 * s); g.lineTo(0, -102 * s); g.stroke();
  g.fillStyle = C.yellow; g.beginPath(); g.arc(0, -108 * s, 10 * s, 0, 7); g.fill();
  g.fillStyle = "#FFFFFF"; g.strokeStyle = o.col || C.purple; g.lineWidth = 6 * s;
  g.beginPath(); g.roundRect(-90 * s, -78 * s, 180 * s, 150 * s, 46 * s); g.fill(); g.stroke();
  g.fillStyle = o.col || C.purple;
  const blink = Math.sin((o.t || 0) * 0.9) > 0.97 ? 0.15 : 1;
  g.beginPath(); g.ellipse(-34 * s, -12 * s, 12 * s, 16 * s * blink, 0, 0, 7); g.ellipse(34 * s, -12 * s, 12 * s, 16 * s * blink, 0, 0, 7); g.fill();
  g.lineWidth = 6 * s; g.lineCap = "round";
  const smile = o.smile === undefined ? 1 : o.smile;
  g.beginPath();
  if (smile >= 0) g.arc(0, 18 * s, 26 * s, (0.15 + 0.1 * (1 - smile)) * Math.PI, (0.85 - 0.1 * (1 - smile)) * Math.PI);
  else { g.moveTo(-22 * s, 34 * s); g.lineTo(22 * s, 34 * s); }
  g.stroke();
  g.fillStyle = hexA(C.pink, 0.5);
  g.beginPath(); g.arc(-58 * s, 22 * s, 11 * s, 0, 7); g.arc(58 * s, 22 * s, 11 * s, 0, 7); g.fill();
  g.restore();
}

function answerCard(g, x, y, w, h, str, o = {}) {
  g.save();
  g.globalAlpha *= o.alpha === undefined ? 1 : clamp(o.alpha);
  g.translate(x, y); g.rotate(o.rot || 0);
  g.shadowColor = "rgba(34,48,74,0.12)"; g.shadowBlur = 30; g.shadowOffsetY = 10;
  rr(g, -w / 2, -h / 2, w, h, 26, "#FFFFFF", o.picked ? C.green : C.line, o.picked ? 5 : 2);
  g.shadowColor = "transparent";
  if (o.label) text(g, o.label, -w / 2 + 30, -h / 2 + 24, { size: 22, weight: 800, color: o.labelCol || C.purple });
  text(g, str, -w / 2 + 30, -h / 2 + 64, { size: o.size || 27, maxW: w - 60, lh: 1.3 });
  if (o.picked) {
    g.fillStyle = C.green; g.beginPath(); g.arc(w / 2 - 34, -h / 2 + 34, 24, 0, 7); g.fill();
    g.strokeStyle = "#FFF"; g.lineWidth = 5; g.lineCap = "round"; g.beginPath(); g.moveTo(w / 2 - 45, -h / 2 + 34); g.lineTo(w / 2 - 37, -h / 2 + 43); g.lineTo(w / 2 - 22, -h / 2 + 25); g.stroke();
  }
  g.restore();
}

function cursor(g, x, y, p = 1) {
  g.save(); g.globalAlpha *= clamp(p); g.translate(x, y);
  g.fillStyle = C.ink; g.strokeStyle = "#FFF"; g.lineWidth = 3;
  g.beginPath(); g.moveTo(0, 0); g.lineTo(0, 44); g.lineTo(11, 33); g.lineTo(20, 52); g.lineTo(28, 48); g.lineTo(19, 30); g.lineTo(34, 30); g.closePath(); g.fill(); g.stroke();
  g.restore();
}

function thumb(g, x, y, up, s = 1, a = 1) {
  g.save(); g.globalAlpha *= clamp(a);
  g.fillStyle = up ? C.green : C.red;
  g.beginPath(); g.arc(x, y, 26 * s, 0, 7); g.fill();
  g.strokeStyle = "#FFF"; g.lineWidth = 5 * s; g.lineCap = "round"; g.lineJoin = "round";
  g.beginPath();
  if (up) { g.moveTo(x - 10 * s, y + 4 * s); g.lineTo(x, y - 8 * s); g.lineTo(x + 10 * s, y + 4 * s); }
  else { g.moveTo(x - 10 * s, y - 4 * s); g.lineTo(x, y + 8 * s); g.lineTo(x + 10 * s, y - 4 * s); }
  g.stroke(); g.restore();
}

// a value dial: a soft arc from left label to right label, needle at v (0..1), crowd markers optional
function dial(g, x, y, r, v, left, right, title, o = {}) {
  g.save(); g.globalAlpha *= o.alpha === undefined ? 1 : clamp(o.alpha);
  const a0 = Math.PI, a1 = 2 * Math.PI;
  const gr = g.createLinearGradient(x - r, 0, x + r, 0);
  gr.addColorStop(0, C.teal); gr.addColorStop(0.5, C.yellow); gr.addColorStop(1, C.orange);
  g.strokeStyle = gr; g.lineWidth = r * 0.16; g.lineCap = "round";
  g.beginPath(); g.arc(x, y, r, a0, a1); g.stroke();
  (o.marks || []).forEach((m, i) => {
    const a = a0 + m * Math.PI, rr2 = r + r * 0.2 + (i % 3) * 9;
    g.fillStyle = PAL[i % PAL.length]; g.beginPath(); g.arc(x + rr2 * Math.cos(a), y + rr2 * Math.sin(a), 6, 0, 7); g.fill();
  });
  const a = a0 + clamp(v) * Math.PI;
  g.strokeStyle = C.ink; g.lineWidth = 7;
  g.beginPath(); g.moveTo(x, y); g.lineTo(x + r * 0.78 * Math.cos(a), y + r * 0.78 * Math.sin(a)); g.stroke();
  g.fillStyle = C.ink; g.beginPath(); g.arc(x, y, 14, 0, 7); g.fill();
  if (title) text(g, title, x, y + 38, { size: o.titleSize || 28, weight: 800, align: "center", maxW: r * 2.4 });
  if (left) text(g, left, x - r - 10, y + 6, { size: o.labelSize || 21, align: "right", color: C.muted, maxW: 240 });
  if (right) text(g, right, x + r + 10, y + 6, { size: o.labelSize || 21, color: C.muted, maxW: 240 });
  g.restore();
}

function crowd(g, n, x0, y0, w, h, s, t, o = {}) {
  for (let i = 0; i < n; i++) {
    const cols = Math.ceil(Math.sqrt((n * w) / h)), rows = Math.ceil(n / cols);
    const cx = x0 + ((i % cols) + 0.5 + (Math.floor(i / cols) % 2) * 0.35) * (w / cols);
    const cy = y0 + (Math.floor(i / cols) + 0.5) * (h / rows);
    const p = o.appear ? clamp(o.appear * n * 0.25 - i * 0.25 + 1) : 1;
    person(g, cx + (rand(i) - 0.5) * 18, cy + (rand(i + 40) - 0.5) * 10, s * (0.85 + 0.3 * rand(i + 9)), PAL[i % PAL.length],
      { alpha: p, bob: t * 2 + i, lit: o.lit && rand(i + 77) < o.lit });
  }
}

function source(g, str, a = 1) { text(g, str, 80, 1022, { size: 19, color: C.muted, alpha: a, maxW: 1760 }); }
function headline(g, str, y, col, size, a = 1) { text(g, str, 960, y, { size, weight: 800, align: "center", color: col || C.ink, alpha: a }); }
function quote(g, who, str, x, y, w, col, a = 1) {
  if (a <= 0) return 0;
  g.save(); g.globalAlpha *= clamp(a);
  g.font = font(26); const lines = wrap(g, str, w - 70); const h = 90 + lines.length * 36;
  g.shadowColor = "rgba(34,48,74,0.10)"; g.shadowBlur = 24; g.shadowOffsetY = 8;
  rr(g, x, y, w, h, 24, "#FFFFFF", null);
  g.shadowColor = "transparent";
  rr(g, x, y, 10, h, 5, col);
  text(g, who.toUpperCase(), x + 36, y + 24, { size: 19, weight: 800, color: col });
  lines.forEach((l, i) => text(g, l, x + 36, y + 62 + i * 36, { size: 26 }));
  g.restore();
  return h;
}


// ------------------------------------------------------------ interpretability props
function network(g, s, x0, y0, w, h, o = {}) {
  const layers = o.layers || [6, 9, 9, 9, 6], R = o.r || 13;
  const pos = layers.map((n, i) => Array.from({ length: n }, (_, k) => [x0 + (i / (layers.length - 1)) * w, y0 + ((k + 0.5) / n) * h]));
  g.save(); g.globalAlpha *= o.alpha === undefined ? 1 : clamp(o.alpha);
  for (let i = 0; i < layers.length - 1; i++) pos[i].forEach(([ax, ay], a) => pos[i + 1].forEach(([bx, by], b) => {
    const wgt = rand(i * 997 + a * 31 + b);
    g.strokeStyle = hexA(wgt > 0.5 ? C.purple : C.teal, 0.08 + 0.12 * wgt); g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.stroke();
  }));
  pos.forEach((col, i) => col.forEach(([x, y], k) => {
    const act = o.static ? 0.4 : clamp(0.5 + 0.5 * Math.sin(s.t * (1.2 + rand(i * 50 + k) * 1.8) + i * 1.3 + k));
    const hot = o.hl && o.hl[0] === i && o.hl[1] === k;
    glow(g, x, y, R * 3, hot ? C.orange : C.yellow, 0.35 * act);
    g.fillStyle = hot ? C.orange : "#FFFFFF"; g.strokeStyle = hot ? C.orange : C.purple; g.lineWidth = 3;
    g.beginPath(); g.arc(x, y, R * (hot ? 1.5 : 1), 0, 7); g.fill(); g.stroke();
    g.fillStyle = hexA(C.yellow, act); g.beginPath(); g.arc(x, y, R * 0.6 * (hot ? 1.5 : 1), 0, 7); g.fill();
  }));
  g.restore();
  return pos;
}

function magnifier(g, x, y, r, a = 1) {
  g.save(); g.globalAlpha *= clamp(a);
  g.strokeStyle = C.ink; g.lineWidth = 10; g.lineCap = "round";
  g.beginPath(); g.arc(x, y, r, 0, 7); g.stroke();
  g.beginPath(); g.moveTo(x + r * 0.72, y + r * 0.72); g.lineTo(x + r * 1.35, y + r * 1.35); g.stroke();
  g.fillStyle = hexA(C.blue, 0.06); g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
  g.restore();
}

function node(g, x, y, label, col, a = 1, size = 28) {
  if (a <= 0) return;
  const w = measure(g, label, size, 800) + 44;
  g.save(); g.globalAlpha *= clamp(a);
  glow(g, x, y, w * 0.7, col, 0.25);
  rr(g, x - w / 2, y - size, w, size * 2, size, "#FFFFFF", col, 4);
  text(g, label, x, y, { size, weight: 800, align: "center", base: "middle", color: col });
  g.restore();
}

function edge(g, x1, y1, x2, y2, p, col) {
  if (p <= 0) return;
  g.save(); g.strokeStyle = hexA(col, 0.7); g.lineWidth = 5; g.lineCap = "round";
  const mx = (x1 + x2) / 2;
  g.beginPath(); g.moveTo(x1, y1);
  const k = clamp(p);
  // draw a smooth curve progressively by sampling
  for (let i = 1; i <= 30 * k; i++) {
    const u = i / 30, a = 1 - u;
    const x = a * a * a * x1 + 3 * a * a * u * mx + 3 * a * u * u * mx + u * u * u * x2;
    const y = a * a * a * y1 + 3 * a * a * u * y1 + 3 * a * u * u * y2 + u * u * u * y2;
    g.lineTo(x, y);
  }
  g.stroke(); g.restore();
}

function bridge(g, x, y, s, a = 1) {
  g.save(); g.globalAlpha *= clamp(a); g.translate(x, y); g.scale(s, s);
  const red = "#E2553B";
  g.fillStyle = hexA(C.blue, 0.18); g.fillRect(-260, 40, 520, 40);
  g.strokeStyle = red; g.lineWidth = 6;
  g.beginPath(); g.moveTo(-260, -60); g.quadraticCurveTo(-120, 30, 0, -60); g.quadraticCurveTo(120, 30, 260, -60); g.stroke();
  g.fillStyle = red; [-130, 130].forEach((tx) => { g.fillRect(tx - 10, -140, 20, 180); g.fillRect(tx - 18, -100, 36, 8); g.fillRect(tx - 18, -60, 36, 8); });
  g.fillRect(-260, 30, 520, 10);
  g.lineWidth = 2; for (let k = -240; k <= 240; k += 20) { g.beginPath(); g.moveTo(k, 30); g.lineTo(k, -60 + 90 * Math.pow(Math.abs(((k + 260) % 260) - 130) / 130, 2) * 0.9); g.stroke(); }
  g.restore();
}

// ------------------------------------------------------------ 0 intro
S.intro = (g, s) => {
  const title = s.at(3, 0.3, 0.9);
  // a wall of numbers
  const pn = s.at(1, 0, 0.8) * (1 - title * 0.85);
  if (pn > 0) {
    g.save(); g.globalAlpha *= pn;
    g.font = font(22, 500, true);
    for (let r = 0; r < 24; r++) for (let c = 0; c < 22; c++) {
      const v = (rand(r * 91 + c * 7 + Math.floor(s.t * 2 + r)) - 0.5) * 2;
      g.fillStyle = hexA(v > 0 ? C.purple : C.teal, 0.18 + 0.4 * Math.abs(v));
      g.fillText(v.toFixed(2), 60 + c * 84 + ((r % 2) * 20), 70 + r * 40 + ((s.t * 18) % 40));
    }
    g.restore();
  }
  const pb = s.at(0, 0, 0.8) * (1 - title);
  if (pb > 0) {
    g.save(); g.globalAlpha *= pb;
    const tasks = ["write", "translate", "code", "reason"];
    tasks.forEach((t2, i) => chip(g, t2, 960 + 380 * Math.cos(i * 1.57 - 0.8), 540 + 250 * Math.sin(i * 1.57 - 0.8), { align: "center", size: 30, fill: "#FFFFFF", color: PAL[i], stroke: PAL[i], alpha: s.at(0, 0.6 + i * 0.4, 0.4) * (1 - s.at(1, 0, 0.5)) }));
    bot(g, 960, 560, 1.2, { t: s.t });
    const pq = s.at(2, 0, 0.6);
    if (pq > 0) {
      rr(g, 760, 790, 400, 90, 45, "#FFFFFF", C.line, 2);
      text(g, "how does it work?", 960, 835, { size: 34, weight: 800, align: "center", base: "middle", color: C.purple, alpha: pq });
    }
    g.restore();
  }
  if (title > 0) {
    g.save(); g.globalAlpha *= title;
    magnifier(g, 960, 580, 170, 1);
    network(g, s, 850, 470, 220, 220, { layers: [3, 4, 4, 3], r: 9 });
    text(g, "Looking inside the machine", 960, 180 + 20 * (1 - title), { size: 104, weight: 800, align: "center" });
    text(g, "an introduction to AI interpretability", 960, 320, { size: 36, align: "center", color: C.purple });
    g.restore();
  }
};

// ------------------------------------------------------------ 1 neurons
S.neurons = (g, s) => {
  const toks = ["The", " cat", " sat", " on", " the", " mat"];
  const pn = s.at(0, 0, 0.8);
  const hl = s.t > s.cue(2) ? [2, 4] : null;
  network(g, s, 560, 220, 900, 560, { alpha: pn, hl });
  const pt = s.at(1, 0, 0.6);
  if (pt > 0) toks.forEach((tk, i) => {
    const ph = ((s.t - s.cue(1)) * 0.4 + i / toks.length) % 1;
    chip(g, tk.trim(), lerp(120, 540, ph), 300 + i * 70, { align: "center", size: 26, mono: true, fill: "#FFFFFF", color: C.ink, stroke: C.line, alpha: pt * Math.sin(ph * Math.PI) });
  });
  if (s.t > s.cue(2)) {
    const pm = s.at(2, 0, 0.7);
    magnifier(g, 560 + 450, 220 + (4.5 / 9) * 560, 70, pm);
  }
  const pp = s.at(3, 0, 0.6);
  if (pp > 0) {
    const nx = 1010, ny = 500;
    ["academic citations", "English dialogue", "web requests", "Korean text"].forEach((n, i) => {
      const x = 1560, y = 260 + i * 140, p = s.at(3, 0.8 + i * 0.6, 0.5);
      edge(g, nx + 20, ny, x - 150, y, p, PAL[i]);
      chip(g, n, x, y - 24, { align: "center", size: 26, fill: "#FFFFFF", color: PAL[i], stroke: PAL[i], alpha: p });
    });
    text(g, "one neuron, many meanings", 1010, 880, { size: 34, weight: 800, align: "center", color: C.orange, alpha: s.at(3, 3.4, 0.5) });
  }
};

// ------------------------------------------------------------ 2 superposition
S.superposition = (g, s) => {
  const cx = 620, cy = 560, R = 300;
  const pa = s.at(0, 0, 0.7);
  g.save(); g.globalAlpha *= pa;
  g.strokeStyle = C.dim; g.lineWidth = 3;
  g.beginPath(); g.moveTo(cx - R - 40, cy); g.lineTo(cx + R + 40, cy); g.moveTo(cx, cy - R - 40); g.lineTo(cx, cy + R + 40); g.stroke();
  text(g, "neuron 1", cx + R + 50, cy, { size: 22, base: "middle", color: C.muted });
  text(g, "neuron 2", cx, cy - R - 60, { size: 22, align: "center", color: C.muted });
  g.restore();
  const feats = ["cats", "Python code", "French", "anger", "bridges"];
  const n = feats.length, pf = s.at(1, 0.4, 2.5, ease.lin);
  feats.forEach((f, i) => {
    const p = clamp(pf * n - i);
    if (p <= 0) return;
    const a = -Math.PI / 2 + (i / n) * Math.PI * 2;
    arrow(g, cx, cy, cx + R * Math.cos(a), cy + R * Math.sin(a), ease.out(p), PAL[i], 7, 22);
    chip(g, f, cx + (R + 70) * Math.cos(a), cy + (R + 50) * Math.sin(a) - 20, { align: "center", size: 24, fill: "#FFFFFF", color: PAL[i], stroke: PAL[i], alpha: p });
  });
  text(g, "5 concepts, 2 neurons", cx, cy + R + 90, { size: 30, weight: 800, align: "center", color: C.purple, alpha: s.at(1, 3.0, 0.5) });
  // concept spread across neurons
  const ps = s.at(2, 0, 0.6);
  if (ps > 0) {
    g.save(); g.globalAlpha *= ps;
    text(g, "“cats” across the neurons", 1180, 260, { size: 28, weight: 800, color: C.purple });
    for (let k = 0; k < 10; k++) {
      const v = 0.15 + 0.85 * rand(k + 3);
      rr(g, 1180 + k * 56, 520 - 220 * v, 40, 220 * v, 10, hexA(C.purple, 0.35 + 0.6 * v));
    }
    text(g, "each concept spreads over many neurons; each neuron joins many concepts", 1180, 560, { size: 22, color: C.muted, maxW: 560 });
    g.restore();
  }
  const pc = s.at(3, 0, 0.6);
  if (pc > 0) chip(g, "clear in toy models · well supported, not proven, in large ones", 1460, 760, { align: "center", size: 24, fill: "#FFFFFF", color: C.ink, stroke: C.line, alpha: pc });
  source(g, "Elhage et al. 2022, Toy Models of Superposition (Anthropic)", s.at(0, 1, 0.5));
};

// ------------------------------------------------------------ 3 dictionary (sparse autoencoder)
S.dictionary = (g, s) => {
  const p1 = s.at(1, 0, 0.6);
  // dense activations
  const dens = Array.from({ length: 8 }, (_, k) => rand(k + 11));
  g.save(); g.globalAlpha *= s.at(0, 0, 0.6);
  text(g, "model activity", 230, 230, { size: 26, weight: 700, align: "center", color: C.muted });
  dens.forEach((v, k) => rr(g, 180, 270 + k * 62, 100, 50, 12, hexA(C.purple, 0.25 + 0.7 * v)));
  g.restore();
  if (p1 > 0) {
    g.save(); g.globalAlpha *= p1;
    g.fillStyle = hexA(C.teal, 0.12); g.beginPath(); g.moveTo(300, 270); g.lineTo(560, 160); g.lineTo(560, 860); g.lineTo(300, 750); g.closePath(); g.fill();
    text(g, "sparse autoencoder", 430, 900, { size: 24, weight: 800, align: "center", color: C.teal, alpha: 1 - s.at(3, 0, 0.4) });
    // wide sparse dictionary
    const lit = { 7: ["DNA", C.green], 19: ["base64", C.orange], 31: ["Arabic script", C.blue] };
    const cols = 40, cw = 30;
    for (let k = 0; k < cols; k++) {
      const x = 600 + (k % 20) * (cw + 8), y = 200 + Math.floor(k / 20) * 330;
      const on = lit[k] && s.t > s.cue(2) + 1 + Object.keys(lit).indexOf(String(k)) * 1.2;
      rr(g, x, y, cw, 260, 8, on ? lit[k][1] : C.card2);
      if (on) chip(g, lit[k][0], x + cw / 2, y + 270, { align: "center", size: 24, fill: "#FFFFFF", color: lit[k][1], stroke: lit[k][1] });
    }
    text(g, "a large dictionary of features, only a few active", 1340, 150, { size: 26, weight: 700, align: "center", color: C.muted });
    g.restore();
  }
  const pq = s.at(3, 0, 0.6);
  if (pq > 0) {
    g.save(); g.globalAlpha *= pq;
    rr(g, 380, 880, 1160, 110, 55, C.yellow);
    text(g, "“Just 512 neurons can represent tens of thousands of features.”", 960, 935, { size: 32, weight: 800, align: "center", base: "middle" });
    g.restore();
  }
  source(g, "Bricken et al. 2023, Towards Monosemanticity (Anthropic): a one-layer model with 512 neurons", s.at(0, 1, 0.5) * (1 - pq));
};

// ------------------------------------------------------------ 4 map of features
S.map = (g, s) => {
  const pz = s.at(1, 0, 1.2, ease.inOut);
  // a constellation of features
  const pm = s.at(0, 0, 1.0);
  g.save(); g.globalAlpha *= pm * (1 - s.at(3, 0, 0.6) * 0.6);
  const clusters = [["places", 520, 420, C.orange], ["code", 1420, 420, C.blue], ["languages", 1300, 760, C.teal], ["emotions", 560, 780, C.pink], ["safety-relevant", 960, 560, C.red]];
  for (let i = 0; i < 700; i++) {
    const c = clusters[i % clusters.length];
    const a = rand(i) * 6.28, d = Math.pow(rand(i + 5), 0.6) * 190;
    const x = c[1] + d * Math.cos(a), y = c[2] + d * Math.sin(a) * 0.8;
    g.fillStyle = hexA(c[3], 0.25 + 0.5 * rand(i + 9) * (0.6 + 0.4 * Math.sin(s.t * 2 + i)));
    g.beginPath(); g.arc(x, y, 3 + 3 * rand(i + 2), 0, 7); g.fill();
  }
  clusters.forEach(([n, x, y, col], i) => chip(g, n, x, y - 230 * 0.8 - 10, { align: "center", size: 24, fill: "#FFFFFF", color: col, stroke: col, alpha: s.at(0, 1.0 + i * 0.4, 0.4) * clamp(1 - pz + s.at(2, 0, 0.5)) }));
  text(g, "up to 34 million features in Claude 3 Sonnet", 960, 140, { size: 36, weight: 800, align: "center", color: C.purple, alpha: s.at(0, 2.5, 0.6) * (1 - pz) });
  g.restore();
  // the Golden Gate Bridge feature: many languages and pictures
  if (pz > 0 && s.t < s.cue(2) + 0.6) {
    g.save(); g.globalAlpha *= pz * (1 - s.at(2, 0, 0.5));
    rr(g, 300, 180, 1320, 700, 40, hexA("#FFFFFF", 0.92), C.line, 2);
    node(g, 960, 520, "Golden Gate Bridge feature", C.orange, 1, 34);
    const ins = [["the Golden Gate Bridge", 480, 300], ["le pont du Golden Gate", 480, 520], ["Golden Gate-bron", 480, 740], ["金门大桥", 1440, 300]];
    ins.forEach(([t2, x, y], i) => { const p = s.at(1, 1.0 + i * 0.5, 0.4); edge(g, x + (x < 960 ? 150 : -150), y, 960 + (x < 960 ? -220 : 220), 520, p, C.orange); chip(g, t2, x, y - 24, { align: "center", size: 26, fill: "#FFFFFF", color: C.ink, stroke: C.line, alpha: p }); });
    const pimg = s.at(1, 4.0, 0.5);
    bridge(g, 1440, 700, 0.55, pimg); edge(g, 1300, 700, 1180, 520, pimg, C.orange);
    g.restore();
  }
  const ps = s.at(2, 0, 0.6) * (1 - s.at(3, 0, 0.5));
  if (ps > 0) {
    g.save(); g.globalAlpha *= ps;
    rr(g, 280, 850, 1360, 120, 40, "#FFFFFF", C.red, 3);
    text(g, "Safety-relevant features exist: deception, flattery, dangerous information.", 960, 890, { size: 28, weight: 800, align: "center", base: "middle", color: C.red });
    text(g, "Finding one does not by itself make a model dangerous.", 960, 935, { size: 24, align: "center", base: "middle" });
    g.restore();
  }
  const po = s.at(3, 0.2, 0.6);
  if (po > 0) {
    [["OpenAI · 16 million features on GPT-4", C.green, 330], ["Google DeepMind · Gemma Scope, open to everyone", C.blue, 520], ["Gemma Scope 2 · every layer of Gemma 3", C.teal, 710]].forEach(([n, col, y], i) =>
      chip(g, n, 960, y, { align: "center", size: 34, fill: "#FFFFFF", color: col, stroke: col, alpha: s.at(3, 0.4 + i * 1.2, 0.5) }));
  }
  source(g, "Templeton et al. 2024, Scaling Monosemanticity (Anthropic) · Gao et al. 2024 (OpenAI) · Gemma Scope 2024, Gemma Scope 2 2025 (Google DeepMind)", s.at(0, 1, 0.5));
};

// ------------------------------------------------------------ 5 bridge steering
S.bridge = (g, s) => {
  const amp = s.at(0, 0.5, 2.0, ease.inOut);
  dial(g, 420, 560, 200, 0.15 + 0.8 * amp, "off", "max", "Golden Gate feature", { alpha: s.at(0, 0, 0.6), titleSize: 30 });
  const pb = s.at(1, 0, 0.6);
  bot(g, 1260, 420, 0.95, { t: s.t, col: pb > 0.5 ? "#E2553B" : C.purple });
  bridge(g, 1260, 720, 0.9 * clamp(amp * 1.2), pb);
  chip(g, "Golden Gate Claude · 24 hours · May 2024", 1260, 160, { align: "center", size: 26, fill: "#FFFFFF", color: "#E2553B", stroke: "#E2553B", alpha: s.at(1, 1.0, 0.5) });
  const pq = s.at(2, 0, 0.6);
  if (pq > 0) {
    g.save(); g.globalAlpha *= pq * (1 - s.at(3, 0, 0.5) * 0.4);
    rr(g, 760, 230, 300, 80, 24, "#FFFFFF", C.line, 2); text(g, "What is your physical form?", 910, 270, { size: 22, align: "center", base: "middle", maxW: 280 });
    rr(g, 1440, 520, 420, 120, 26, "#FFFFFF", "#E2553B", 3); text(g, "“I am the Golden Gate Bridge… my physical form is the iconic bridge itself.”", 1470, 540, { size: 22, maxW: 370 });
    g.restore();
  }
  const pc = s.at(3, 0.3, 0.6);
  if (pc > 0) { g.save(); g.globalAlpha *= pc; rr(g, 260, 880, 1400, 100, 50, C.yellow); text(g, "Features do not just correlate with behaviour. They cause it.", 960, 930, { size: 34, weight: 800, align: "center", base: "middle" }); g.restore(); }
  source(g, "Anthropic, Golden Gate Claude (23 May 2024)", s.at(0, 1, 0.5) * (1 - pc));
};

// ------------------------------------------------------------ 6 tracing
S.trace = (g, s) => {
  // phase by line: 0 intro graph, 1 Dallas, 2 rhyme, 3 arithmetic
  const L = s.t < s.cue(1) ? 0 : s.t < s.cue(2) ? 1 : s.t < s.cue(3) ? 2 : 3;
  const fade = (i) => s.at(i, 0, 0.5) * (i < 3 ? 1 - s.at(i + 1, 0, 0.4) : 1);
  if (L <= 1) {
    const a = L === 0 ? s.at(0, 0, 0.6) : fade(1);
    g.save(); g.globalAlpha *= a;
    text(g, L === 0 ? "an attribution graph: features connected, step by step" : "“What is the capital of the state containing Dallas?”", 960, 170, { size: 34, weight: 800, align: "center", color: C.purple });
    const P = L === 0 ? s.at(0, 0.6, 3) : s.at(1, 0.8, 4);
    node(g, 330, 420, "Dallas", C.blue, clamp(P * 4));
    node(g, 330, 650, "capital", C.blue, clamp(P * 4 - 0.5));
    edge(g, 420, 420, 860, 520, P * 3 - 0.8, C.orange);
    node(g, 960, 520, "Texas", C.orange, clamp(P * 3 - 1.2), 34);
    edge(g, 450, 650, 1300, 620, P * 3 - 1.2, C.purple);
    node(g, 1360, 620, "say a capital", C.purple, clamp(P * 3 - 1.6));
    edge(g, 1080, 520, 1520, 460, P * 3 - 2, C.orange);
    edge(g, 1480, 620, 1560, 480, P * 3 - 2, C.purple);
    node(g, 1620, 430, "Austin", C.green, clamp(P * 3 - 2.3), 38);
    g.restore();
  }
  if (L === 2) {
    g.save(); g.globalAlpha *= fade(2);
    text(g, "Planning a rhyme before writing the line", 960, 170, { size: 34, weight: 800, align: "center", color: C.purple });
    text(g, "He saw a carrot and had to grab it,", 260, 360, { size: 48, weight: 700 });
    node(g, 1400, 520, "rabbit", C.pink, s.at(2, 1.2, 0.6), 38);
    chip(g, "planned before line 2 begins", 1400, 600, { align: "center", size: 24, fill: "#FFFFFF", color: C.pink, stroke: C.pink, alpha: s.at(2, 1.6, 0.5) });
    const w = typed("His hunger was like a starving rabbit", s.at(2, 3.0, 2.4, ease.lin));
    text(g, w, 260, 720, { size: 48, weight: 700, color: C.ink });
    g.restore();
  }
  if (L === 3) {
    g.save(); g.globalAlpha *= fade(3);
    text(g, "36 + 59 = ?", 960, 200, { size: 64, weight: 800, align: "center" });
    const P = s.at(3, 0.6, 2.5);
    node(g, 560, 420, "roughly 90-something", C.teal, clamp(P * 2));
    node(g, 560, 640, "last digit: 5", C.orange, clamp(P * 2 - 0.4));
    edge(g, 720, 420, 1020, 530, P * 2 - 0.8, C.teal); edge(g, 690, 640, 1020, 550, P * 2 - 0.8, C.orange);
    node(g, 1120, 540, "95", C.green, clamp(P * 2 - 1.1), 44);
    const pb = s.at(3, 4.5, 0.6);
    if (pb > 0) { rr(g, 1300, 700, 520, 130, 30, "#FFFFFF", C.purple, 3); text(g, "“I added the ones, carried the one…”", 1330, 725, { size: 26, maxW: 460, alpha: pb }); text(g, "what it says ≠ what it did", 1560, 870, { size: 26, weight: 800, align: "center", color: C.purple, alpha: pb }); }
    g.restore();
  }
  source(g, "Lindsey et al. 2025, On the Biology of a Large Language Model (Anthropic, Claude 3.5 Haiku)", s.at(0, 1, 0.5));
};

// ------------------------------------------------------------ 7 know
S.know = (g, s) => {
  const p = s.at(1, 0, 0.6);
  // default: can't answer
  const sw = s.t > s.cue(1) + 2.5 ? 1 : 0;
  g.save(); g.globalAlpha *= s.at(0, 0, 0.6);
  text(g, "Why models hallucinate", 960, 170, { size: 44, weight: 800, align: "center" });
  g.restore();
  if (p > 0) {
    g.save(); g.globalAlpha *= p;
    node(g, 520, 420, "default: “I can't answer”", C.red, 1, 30);
    node(g, 520, 680, "known entity: Michael Jordan", C.green, s.at(1, 1.5, 0.5), 30);
    edge(g, 700, 680, 760, 460, s.at(1, 2.0, 0.6), C.green);
    if (sw) { g.strokeStyle = C.green; g.lineWidth = 8; g.beginPath(); g.moveTo(320, 420); g.lineTo(720, 420); g.stroke(); }
    chip(g, sw ? "answers: basketball" : "…", 1240, 540, { align: "center", size: 30, fill: "#FFFFFF", color: C.green, stroke: C.green, alpha: s.at(1, 2.6, 0.5) * (1 - s.at(2, 0, 0.5)) });
    g.restore();
  }
  const ph = s.at(2, 0, 0.6);
  if (ph > 0) {
    g.save(); g.globalAlpha *= ph;
    rr(g, 1000, 360, 800, 420, 40, hexA(C.orange, 0.08), C.orange, 3);
    text(g, "a misfire", 1400, 400, { size: 34, weight: 800, align: "center", color: C.orange });
    node(g, 1400, 520, "feels familiar…", C.orange, s.at(2, 0.6, 0.5));
    chip(g, "→ “I can't answer” switched off by mistake", 1400, 610, { align: "center", size: 24, fill: "#FFFFFF", color: C.ink, stroke: C.line, alpha: s.at(2, 1.4, 0.5) });
    chip(g, "→ a confident made-up answer", 1400, 690, { align: "center", size: 24, fill: "#FFFFFF", color: C.red, stroke: C.red, alpha: s.at(2, 2.4, 0.5) });
    g.restore();
  }
};

// ------------------------------------------------------------ 8 languages
S.languages = (g, s) => {
  const ins = [["small", "English", C.blue], ["petit", "French", C.pink], ["liten", "Swedish", C.yellow], ["小", "Chinese", C.teal]];
  const outs = [["large", C.blue], ["grand", C.pink], ["stor", C.yellow], ["大", C.teal]];
  const p1 = s.at(1, 0, 0.6);
  text(g, "One mind, many languages", 960, 160, { size: 48, weight: 800, align: "center", alpha: s.at(0, 0, 0.6) });
  if (p1 > 0) {
    g.save(); g.globalAlpha *= p1 * (1 - s.at(2, 0, 0.5) * 0.7);
    ins.forEach(([w, l, col], i) => { const y = 300 + i * 150, p = s.at(1, 0.4 + i * 0.3, 0.5); chip(g, `${w} · ${l}`, 280, y - 24, { align: "center", size: 28, fill: "#FFFFFF", color: col, stroke: col, alpha: p }); edge(g, 420, y, 820, 450, s.at(1, 1.2 + i * 0.2, 0.8), col); edge(g, 420, y, 820, 640, s.at(1, 1.2 + i * 0.2, 0.8), col); });
    node(g, 960, 450, "small", C.purple, s.at(1, 2.2, 0.5), 34);
    node(g, 960, 640, "opposite", C.purple, s.at(1, 2.6, 0.5), 34);
    text(g, "shared, language-independent concepts", 960, 760, { size: 24, align: "center", color: C.purple, weight: 700, alpha: s.at(1, 3.0, 0.5) });
    outs.forEach(([w, col], i) => { const y = 300 + i * 150, p = s.at(1, 3.2 + i * 0.3, 0.5); edge(g, 1110, 545, 1500, y, p, col); chip(g, w, 1640, y - 24, { align: "center", size: 30, fill: "#FFFFFF", color: col, stroke: col, alpha: p }); });
    g.restore();
  }
  const p2 = s.at(2, 0, 0.6);
  if (p2 > 0) {
    g.save(); g.globalAlpha *= p2 * (1 - s.at(3, 0, 0.5));
    rr(g, 560, 820, 800, 160, 30, "#FFFFFF", C.line, 2);
    text(g, "share of features used across languages", 960, 845, { size: 22, align: "center", color: C.muted });
    const k = s.at(2, 0.5, 1.2);
    rr(g, 620, 890, 300 * k * 0.42, 34, 17, C.dim); text(g, "smaller model", 620, 940, { size: 20, color: C.muted });
    rr(g, 980, 890, 300 * k * 0.95, 34, 17, C.purple); text(g, "Claude 3.5 Haiku: more than 2×", 980, 940, { size: 20, color: C.purple, weight: 700 });
    g.restore();
  }
  const p3 = s.at(3, 0, 0.6);
  if (p3 > 0) { g.save(); g.globalAlpha *= p3; rr(g, 360, 820, 1200, 120, 60, C.yellow); text(g, "Learning in one language can help the others.", 960, 880, { size: 36, weight: 800, align: "center", base: "middle" }); g.restore(); }
  source(g, "Anthropic, Tracing the thoughts of a large language model (Mar 2025)", s.at(0, 1, 0.5) * (1 - p3));
};

// ------------------------------------------------------------ 9 safety
S.safety = (g, s) => {
  text(g, "Looking inside, for safety", 960, 150, { size: 48, weight: 800, align: "center", alpha: s.at(0, 0, 0.6) });
  const p0 = s.at(0, 0.3, 0.7) * (1 - s.at(1, 0, 0.5));
  if (p0 > 0) {
    g.save(); g.globalAlpha *= p0;
    text(g, "behaviour", 560, 330, { size: 32, weight: 800, align: "center", color: C.muted });
    bot(g, 560, 580, 1.0, { t: s.t });
    chip(g, "“All good here!”", 560, 760, { align: "center", size: 28, fill: "#FFFFFF", color: C.ink, stroke: C.line });
    text(g, "inside", 1360, 330, { size: 32, weight: 800, align: "center", color: C.purple, alpha: s.at(0, 1.5, 0.5) });
    network(g, s, 1220, 450, 280, 260, { layers: [4, 5, 5, 4], r: 10, hl: [2, 2], alpha: s.at(0, 1.5, 0.5) });
    magnifier(g, 1360, 580, 190, s.at(0, 1.8, 0.5));
    chip(g, "something unexpected", 1360, 820, { align: "center", size: 28, fill: "#FFFFFF", color: C.orange, stroke: C.orange, alpha: s.at(0, 2.6, 0.5) });
    g.restore();
  }
  const cards = [
    ["Finding a hidden goal", "4 blind teams · 3 succeeded · interpretability team fastest (1.5 h); data search also worked", C.purple, 1],
    ["A refusal direction", "one direction controls refusal in many open models: a lever, and a reminder safety training can be fragile", C.teal, 2],
    ["Persona vectors", "directions for traits like flattery: monitor them, and use them in training so a model doesn't pick the trait up", C.pink, 2],
    ["Testing before release", "2025: Anthropic's pre-release safety testing included interpretability for the first time", C.green, 3],
  ];
  cards.forEach(([h, d, col, cue], i) => {
    const sub = cards.filter((c) => c[3] === cue).indexOf(cards[i]);
    const p = s.at(cue, 0.4 + sub * 2.4, 0.6, ease.back);
    if (p <= 0) return;
    const x = 140 + (i % 2) * 840, y = 230 + Math.floor(i / 2) * 360;
    g.save(); g.globalAlpha *= clamp(p);
    g.shadowColor = "rgba(34,48,74,0.1)"; g.shadowBlur = 26; g.shadowOffsetY = 8;
    rr(g, x, y, 800, 320, 36, "#FFFFFF", null); g.shadowColor = "transparent";
    rr(g, x, y, 800, 14, [36, 36, 0, 0], col);
    text(g, h, x + 40, y + 50, { size: 40, weight: 800, color: col });
    text(g, d, x + 40, y + 130, { size: 28, maxW: 720, lh: 1.35 });
    if (i === 0) { for (let k = 0; k < 4; k++) { const ok = k < 3; g.fillStyle = ok ? C.green : C.dim; g.beginPath(); g.arc(x + 600 + k * 46, y + 70, 16, 0, 7); g.fill(); } }
    g.restore();
  });
  source(g, "Marks et al. 2025 (Anthropic) · Arditi et al. 2024 · Anthropic, Persona vectors (Aug 2025) · Anthropic, Claude Sonnet 4.5 (Sep 2025)", s.at(0, 1, 0.5));
};

// ------------------------------------------------------------ 10 limits
S.limits = (g, s) => {
  // a map of a continent, mostly blank
  const pm = s.at(0, 0, 0.8);
  g.save(); g.globalAlpha *= pm;
  g.fillStyle = hexA(C.dim, 0.18); g.strokeStyle = hexA(C.dim, 0.6); g.lineWidth = 3; g.setLineDash([10, 10]);
  g.beginPath();
  for (let i = 0; i <= 60; i++) { const a = (i / 60) * 6.28; const r = 330 + 60 * Math.sin(a * 3 + 1) + 30 * Math.sin(a * 7); const x = 960 + r * 1.6 * Math.cos(a), y = 560 + r * Math.sin(a); i ? g.lineTo(x, y) : g.moveTo(x, y); }
  g.closePath(); g.fill(); g.stroke(); g.setLineDash([]);
  // explored patches
  const ex = s.at(1, 0, 3.0);
  [[760, 500, 70, C.teal], [880, 640, 50, C.purple], [1120, 470, 60, C.orange], [1040, 640, 36, C.pink]].forEach(([x, y, r, col], i) => {
    const p = clamp(ex * 4 - i);
    g.fillStyle = hexA(col, 0.4 * p); g.beginPath(); g.arc(x, y, r * p, 0, 7); g.fill();
  });
  g.restore();
  chip(g, "explored so far: a small fraction", 960, 160, { align: "center", size: 30, fill: "#FFFFFF", color: C.purple, stroke: C.purple, alpha: s.at(1, 0.5, 0.5) * (1 - s.at(3, 0, 0.4)) });
  chip(g, "hours of human work per short prompt", 400, 920, { align: "center", size: 26, fill: "#FFFFFF", color: C.ink, stroke: C.line, alpha: s.at(1, 2.5, 0.5) });
  const p2 = s.at(2, 0, 0.6);
  if (p2 > 0) {
    chip(g, "dark matter: unexplained activity", 1500, 880, { align: "center", size: 26, fill: "#FFFFFF", color: C.ink, stroke: C.line, alpha: p2 });
    chip(g, "interpretability illusions", 1500, 950, { align: "center", size: 26, fill: "#FFFFFF", color: C.ink, stroke: C.line, alpha: s.at(2, 1.5, 0.5) });
    chip(g, "simple probes sometimes beat dictionaries", 960, 950, { align: "center", size: 26, fill: "#FFFFFF", color: C.ink, stroke: C.line, alpha: s.at(2, 3.5, 0.5) });
  }
  const p3 = s.at(3, 0, 0.6);
  if (p3 > 0) { g.save(); g.globalAlpha *= p3; rr(g, 460, 240, 1000, 100, 50, C.yellow); text(g, "The first maps of a new continent.", 960, 290, { size: 40, weight: 800, align: "center", base: "middle" }); g.restore(); }
  source(g, "Lindsey et al. 2025 · Engels et al. 2024 (dark matter) · Makelov et al. 2023 (illusions) · Google DeepMind mechanistic interpretability team, Mar 2025", s.at(0, 1, 0.5));
};

// ------------------------------------------------------------ 11 future
S.future = (g, s) => {
  // a friendly scanner ring around the model
  const p0 = s.at(0, 0, 0.8);
  g.save(); g.globalAlpha *= p0 * (1 - s.at(3, 0, 0.6));
  g.strokeStyle = C.teal; g.lineWidth = 34; g.beginPath(); g.arc(700, 560, 260, 0, 7); g.stroke();
  g.strokeStyle = hexA(C.teal, 0.3); g.lineWidth = 6; g.beginPath(); g.arc(700, 560, 300, 0, 7); g.stroke();
  bot(g, 700, 600, 1.0, { t: s.t });
  const sy = 560 + 220 * Math.sin(s.t * 1.5);
  g.fillStyle = hexA(C.teal, 0.25); g.fillRect(470, sy - 4, 460, 8);
  text(g, "an “MRI for AI”", 700, 220, { size: 40, weight: 800, align: "center", color: C.teal });
  g.restore();
  const pr = s.at(1, 0, 0.6) * (1 - s.at(2, 0, 0.5));
  if (pr > 0) {
    g.save(); g.globalAlpha *= pr;
    [["understanding (interpretability)", C.teal, 0.55], ["capability (model intelligence)", C.purple, 0.75]].forEach(([n, col, v], i) => {
      text(g, n, 1100, 380 + i * 160, { size: 28, weight: 700, color: col });
      rr(g, 1100, 420 + i * 160, 680, 36, 18, C.card2);
      rr(g, 1100, 420 + i * 160, 680 * v * (0.85 + 0.15 * Math.sin(s.t + i)), 36, 18, col);
    });
    chip(g, "goal for 2027: an aspiration, not an achievement", 1440, 760, { align: "center", size: 24, fill: "#FFFFFF", color: C.ink, stroke: C.line });
    g.restore();
  }
  const po = s.at(2, 0, 0.6) * (1 - s.at(3, 0, 0.5));
  if (po > 0) {
    [["Neuronpedia", "explore features in real models", C.purple], ["Gemma Scope 2", "open dictionaries for Gemma 3", C.blue], ["circuit tracer", "open-source attribution graphs", C.orange]].forEach(([h, d, col], i) => {
      const p = s.at(2, 0.5 + i * 0.8, 0.5, ease.back), x = 1100, y = 300 + i * 180;
      g.save(); g.globalAlpha *= po * clamp(p);
      rr(g, x, y, 700, 140, 30, "#FFFFFF", col, 3);
      text(g, h, x + 30, y + 26, { size: 36, weight: 800, color: col });
      text(g, d, x + 30, y + 82, { size: 26, color: C.ink });
      g.restore();
    });
  }
  const pe = s.at(3, 0, 0.8);
  if (pe > 0) {
    g.save(); g.globalAlpha *= pe;
    crowd(g, 24, 260, 560, 1400, 300, 1.0, s.t, { appear: pe, lit: s.at(3, 1.5, 2.5) });
    for (let i = 0; i < 5; i++) magnifier(g, 420 + i * 270, 640 + 20 * Math.sin(s.t + i), 36, s.at(3, 1.0 + i * 0.3, 0.4));
    text(g, "We trust what we understand.", 960, 230, { size: 72, weight: 800, align: "center", color: C.ink });
    text(g, "one feature at a time", 960, 340, { size: 36, align: "center", color: C.purple, alpha: s.at(3, 2.5, 0.6) });
    g.restore();
  }
  source(g, "Dario Amodei, The Urgency of Interpretability (Apr 2025) · neuronpedia.org · Anthropic open-source circuit tracing (May 2025)", s.at(0, 1, 0.5) * (1 - pe));
};
})();
