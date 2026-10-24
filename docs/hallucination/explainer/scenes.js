// "Knowing what you don't know": bright, friendly scenes about hallucination and honesty, drawn in code. Each scene is a pure function of
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
  if (o.alpha !== undefined) g.globalAlpha *= clamp(o.alpha);
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


// ------------------------------------------------------------ hallucination props
function stamp(g, str, x, y, col, p, rot = -0.12) {
  if (p <= 0) return;
  const k = 1 + 0.6 * (1 - ease.out(clamp(p)));
  g.save(); g.globalAlpha *= clamp(p * 1.5); g.translate(x, y); g.rotate(rot); g.scale(k, k);
  const w = measure(g, str, 40, 800) + 50;
  rr(g, -w / 2, -36, w, 72, 14, hexA(col, 0.08), col, 6);
  text(g, str, 0, 0, { size: 40, weight: 800, align: "center", base: "middle", color: col });
  g.restore();
}

function bars(g, x, y, w, items, p, o = {}) {
  // items: [label, value 0..1, color]
  const bh = o.bh || 44, gap = o.gap || 26;
  items.forEach(([l, v, col], i) => {
    const yy = y + i * (bh + gap), k = clamp(p * items.length - i * 0.6);
    text(g, l, x - 20, yy + bh / 2, { size: o.size || 28, weight: 700, align: "right", base: "middle", alpha: clamp(k * 2) });
    rr(g, x, yy, w, bh, bh / 2, C.card2);
    if (k > 0) rr(g, x, yy, Math.max(bh, w * v * ease.out(k)), bh, bh / 2, col);
    if (o.pct) text(g, Math.round(v * 100 * ease.out(k)) + "%", x + w * v * ease.out(k) + 16, yy + bh / 2, { size: 26, weight: 800, base: "middle", color: col, alpha: k });
  });
}

function doc(g, x, y, s, col, a = 1) {
  g.save(); g.globalAlpha *= clamp(a); g.translate(x, y); g.scale(s, s);
  rr(g, -40, -52, 80, 104, 10, "#FFFFFF", col, 3);
  g.fillStyle = hexA(col, 0.35); for (let k = 0; k < 5; k++) g.fillRect(-26, -34 + k * 16, k === 4 ? 30 : 52, 6);
  g.restore();
}

function check(g, x, y, ok, s = 1, a = 1) {
  g.save(); g.globalAlpha *= clamp(a);
  g.fillStyle = ok ? C.green : C.red; g.beginPath(); g.arc(x, y, 22 * s, 0, 7); g.fill();
  g.strokeStyle = "#FFF"; g.lineWidth = 5 * s; g.lineCap = "round"; g.beginPath();
  if (ok) { g.moveTo(x - 10 * s, y); g.lineTo(x - 2 * s, y + 8 * s); g.lineTo(x + 11 * s, y - 8 * s); }
  else { g.moveTo(x - 8 * s, y - 8 * s); g.lineTo(x + 8 * s, y + 8 * s); g.moveTo(x + 8 * s, y - 8 * s); g.lineTo(x - 8 * s, y + 8 * s); }
  g.stroke(); g.restore();
}

// ------------------------------------------------------------ 0 intro
S.intro = (g, s) => {
  const title = s.at(2, 0.4, 0.9);
  const pc = s.at(0, 0, 0.6) * (1 - title);
  if (pc > 0) {
    g.save(); g.globalAlpha *= pc;
    person(g, 300, 600, 1.3, C.blue, { bob: s.t * 2 });
    bot(g, 1620, 560, 1.1, { t: s.t });
    rr(g, 460, 240, 560, 90, 30, "#FFFFFF", C.line, 2);
    text(g, "Who designed the Eiffel Tower?", 490, 285, { size: 28, base: "middle" });
    const a1 = typed("The Eiffel Tower was designed by engineers at Gustave Eiffel's company and completed in 1889.", s.at(0, 1.0, 2.5, ease.lin));
    answerCard(g, 960, 470, 760, 170, a1, { label: "ANSWER", alpha: s.at(0, 0.8, 0.4) });
    check(g, 1300, 410, true, 1, s.at(0, 4.0, 0.4) * (1 - s.at(1, 0, 0.4)));
    const pq = s.at(1, 0.4, 0.5);
    if (pq > 0) {
      rr(g, 460, 640, 560, 90, 30, "#FFFFFF", C.line, 2);
      text(g, "Who painted the tower's first coat?", 490, 685, { size: 28, base: "middle", alpha: pq });
      const a2 = typed("It was painted by the Swiss artist Henri Delacroix in a signature shade called Paris Red.", s.at(1, 1.2, 2.2, ease.lin));
      answerCard(g, 960, 860, 760, 170, a2, { label: "ANSWER", alpha: s.at(1, 1.0, 0.4) });
      stamp(g, "made up", 1500, 900, C.red, s.at(1, 4.2, 0.4));
      text(g, "same tone, same confidence", 960, 1000, { size: 26, weight: 700, align: "center", color: C.muted, alpha: s.at(1, 5.0, 0.5) });
    }
    g.restore();
  }
  if (title > 0) {
    g.save(); g.globalAlpha *= title;
    bot(g, 960, 640, 1.1, { t: s.t });
    const q = 0.5 + 0.5 * Math.sin(s.t * 2);
    text(g, "?", 1080, 520 - 10 * q, { size: 90, weight: 800, color: C.purple });
    text(g, "Knowing what you don't know", 960, 220 + 20 * (1 - title), { size: 96, weight: 800, align: "center" });
    text(g, "hallucination, honesty, and how to check", 960, 340, { size: 36, align: "center", color: C.purple });
    g.restore();
  }
};

// ------------------------------------------------------------ 1 real cases
S.real = (g, s) => {
  const cases = [
    ["2023 · New York", "Invented court cases in a legal brief", "lawyers fined $5,000", C.blue],
    ["2024 · Canada", "Chatbot invented a refund policy", "airline held responsible", C.teal],
    ["2025 · Australia", "Fabricated references in a government report", "partial refund", C.orange],
    ["2025 · Norway", "ChatGPT falsely called a man a murderer", "GDPR complaint: data must be accurate", C.pink],
  ];
  const fade = 1 - s.at(4, 0, 0.6) * 0.85;
  cases.forEach(([h, d, r, col], i) => {
    const p = s.at(i, 0.2, 0.6, ease.back);
    if (p <= 0) return;
    const x = 140 + (i % 2) * 840, y = 120 + Math.floor(i / 2) * 400;
    g.save(); g.globalAlpha *= clamp(p) * fade;
    g.shadowColor = "rgba(34,48,74,0.1)"; g.shadowBlur = 26; g.shadowOffsetY = 8;
    rr(g, x, y, 800, 340, 36, "#FFFFFF", null); g.shadowColor = "transparent";
    rr(g, x, y, 800, 14, [36, 36, 0, 0], col);
    text(g, h, x + 40, y + 50, { size: 30, weight: 800, color: col });
    text(g, d, x + 40, y + 110, { size: 40, weight: 800, maxW: 720, lh: 1.2 });
    chip(g, r, x + 40, y + 250, { size: 26, fill: hexA(col, 0.1), color: C.ink, stroke: col });
    g.restore();
  });
  const pn = s.at(4, 0, 0.7);
  if (pn > 0) {
    g.save(); g.globalAlpha *= pn;
    for (let i = 0; i < 40; i++) doc(g, 560 + (i % 10) * 90 + (Math.floor(i / 10) % 2) * 45, 380 + Math.floor(i / 10) * 70, 0.7, PAL[i % 7], s.at(4, 0.3 + i * 0.04, 0.3));
    rr(g, 460, 760, 1000, 130, 65, C.yellow);
    text(g, "1,000+ court cases with AI-invented sources", 960, 825, { size: 40, weight: 800, align: "center", base: "middle" });
    g.restore();
  }
  source(g, "Mata v. Avianca (S.D.N.Y., 22 Jun 2023) · Moffatt v. Air Canada (BC CRT, 14 Feb 2024) · AP, 7 Oct 2025 (Deloitte) · noyb complaint to Datatilsynet (Mar 2025) · Charlotin, AI Hallucination Cases database", s.at(0, 1, 0.5));
};

// ------------------------------------------------------------ 2 why
S.why = (g, s) => {
  const p0 = s.at(0, 0, 0.6) * (1 - s.at(1, 0, 0.4));
  if (p0 > 0) {
    g.save(); g.globalAlpha *= p0;
    text(g, "The capital of France is …", 960, 260, { size: 56, weight: 800, align: "center" });
    bars(g, 700, 400, 700, [["Paris", 0.93, C.green], ["Lyon", 0.03, C.dim], ["a", 0.02, C.dim], ["beautiful", 0.02, C.dim]], s.at(0, 1.0, 1.5), { pct: true });
    text(g, "the model picks a likely next word", 960, 760, { size: 28, color: C.muted, align: "center", alpha: s.at(0, 2.5, 0.5) });
    g.restore();
  }
  const p1 = s.at(1, 0, 0.6) * (1 - s.at(2, 0, 0.4));
  if (p1 > 0) {
    g.save(); g.globalAlpha *= p1;
    const k = s.at(1, 0.4, 1.2);
    g.fillStyle = hexA(C.purple, 0.18); g.beginPath(); g.arc(800 + 60 * (1 - k), 540, 280, 0, 7); g.fill();
    g.fillStyle = hexA(C.teal, 0.18); g.beginPath(); g.arc(1120 - 60 * (1 - k), 540, 280, 0, 7); g.fill();
    text(g, "sounds right", 700, 540, { size: 40, weight: 800, align: "center", base: "middle", color: C.purple });
    text(g, "is right", 1220, 540, { size: 40, weight: 800, align: "center", base: "middle", color: C.teal });
    text(g, "usually", 960, 540, { size: 30, weight: 700, align: "center", base: "middle", color: C.ink, alpha: s.at(1, 1.2, 0.5) });
    g.restore();
  }
  const p2 = s.at(2, 0, 0.6) * (1 - s.at(3, 0, 0.4));
  if (p2 > 0) {
    g.save(); g.globalAlpha *= p2;
    text(g, "How often a fact appears in training data", 960, 200, { size: 36, weight: 800, align: "center" });
    text(g, "a famous birthday", 520, 320, { size: 32, weight: 800, align: "center", color: C.green });
    for (let i = 0; i < 30; i++) doc(g, 300 + (i % 6) * 88, 440 + Math.floor(i / 6) * 90, 0.6, C.green, s.at(2, 0.5 + i * 0.03, 0.3));
    chip(g, "a pattern to learn", 520, 900, { align: "center", size: 26, fill: "#FFFFFF", color: C.green, stroke: C.green, alpha: s.at(2, 2, 0.5) });
    text(g, "an obscure person's birthday", 1400, 320, { size: 32, weight: 800, align: "center", color: C.orange, alpha: s.at(2, 2.4, 0.5) });
    doc(g, 1400, 540, 1.0, C.orange, s.at(2, 3.0, 0.4));
    text(g, "seen once, or never", 1400, 660, { size: 28, align: "center", color: C.muted, alpha: s.at(2, 3.4, 0.5) });
    chip(g, "nothing to learn from", 1400, 900, { align: "center", size: 26, fill: "#FFFFFF", color: C.orange, stroke: C.orange, alpha: s.at(2, 4, 0.5) });
    g.restore();
  }
  const p3 = s.at(3, 0, 0.6);
  if (p3 > 0) {
    g.save(); g.globalAlpha *= p3;
    text(g, "Dr. Ana Lindqvist was born on …", 960, 220, { size: 52, weight: 800, align: "center" });
    bars(g, 760, 340, 600, [["3 March", 0.12, C.orange], ["14 June", 0.11, C.orange], ["21 September", 0.11, C.orange], ["9 January", 0.1, C.orange]], s.at(3, 0.6, 1.2), { pct: true });
    text(g, "no clear winner, but it must pick something", 960, 660, { size: 28, color: C.muted, align: "center", alpha: s.at(3, 1.8, 0.5) });
    answerCard(g, 960, 820, 820, 140, "Dr. Ana Lindqvist was born on 14 June 1968.", { label: "ANSWER", alpha: s.at(3, 2.6, 0.5) });
    chip(g, "right shape · invented fact", 1280, 730, { align: "center", size: 24, fill: "#FFFFFF", color: C.red, stroke: C.red, alpha: s.at(3, 3.4, 0.5) });
    g.restore();
  }
};

// ------------------------------------------------------------ 3 exam
S.exam = (g, s) => {
  const L = s.t < s.cue(3) ? 0 : s.t < s.cue(4) ? 1 : 2;
  if (L === 0) {
    const pa = s.at(0, 0, 0.6) * (1 - s.at(3, 0, 0.4));
    g.save(); g.globalAlpha *= pa;
    rr(g, 220, 160, 660, 760, 30, "#FFFFFF", C.line, 2);
    text(g, "EXAM", 550, 220, { size: 40, weight: 800, align: "center", color: C.purple });
    text(g, "In which year was the obscure treaty signed?", 270, 300, { size: 28, maxW: 560 });
    ["A  1612", "B  1648", "C  1701", "D  1733"].forEach((o, i) => {
      const y = 430 + i * 90; rr(g, 270, y, 560, 66, 20, C.card2);
      text(g, o, 300, y + 33, { size: 30, weight: 700, base: "middle" });
    });
    const p1 = s.at(1, 0, 0.6);
    if (p1 > 0) {
      [["leave it blank", "0 points", C.dim, "0"], ["guess", "25% chance of 1 point", C.green, "0.25"]].forEach(([h, d, col, ev], i) => {
        const x = 1000, y = 260 + i * 260, p = s.at(1, 0.4 + i * 1.6, 0.5, ease.back);
        g.save(); g.globalAlpha *= clamp(p);
        rr(g, x, y, 700, 200, 30, "#FFFFFF", col, 4);
        text(g, h, x + 36, y + 40, { size: 38, weight: 800, color: col === C.dim ? C.muted : col });
        text(g, d, x + 36, y + 100, { size: 28 });
        text(g, "expected: " + ev, x + 36, y + 150, { size: 26, weight: 700, color: C.muted });
        g.restore();
      });
      chip(g, "always guess", 1350, 820, { align: "center", size: 34, fill: C.yellow, color: C.ink, alpha: s.at(1, 3.6, 0.5) });
    }
    const p2 = s.at(2, 0, 0.6);
    if (p2 > 0) {
      g.save(); g.globalAlpha *= p2;
      chip(g, "most AI benchmarks: “I don't know” = 0 points", 960, 960, { align: "center", size: 30, fill: "#FFFFFF", color: C.red, stroke: C.red });
      g.restore();
    }
    g.restore();
  }
  if (L === 1) {
    const p = s.at(3, 0, 0.6) * (1 - s.at(4, 0, 0.4));
    g.save(); g.globalAlpha *= p;
    text(g, "The same fact quiz, two models", 960, 170, { size: 44, weight: 800, align: "center" });
    const rows = [["o4-mini", [0.24, 0.01, 0.75]], ["gpt-5-thinking-mini", [0.22, 0.52, 0.26]]];
    const cols = [C.green, C.dim, C.red], k = s.at(3, 0.8, 2.0);
    rows.forEach(([n, v], i) => {
      const y = 340 + i * 220, x0 = 560, W = 1100;
      text(g, n, x0 - 30, y + 45, { size: 32, weight: 800, align: "right", base: "middle" });
      let x = x0;
      v.forEach((f, j) => {
        const w = W * f * clamp(k * 3 - j);
        if (w > 0) rr(g, x, y, Math.max(w, 6), 90, 14, cols[j]);
        if (f > 0.05 && k * 3 - j > 0.8) text(g, Math.round(f * 100) + "%", x + w / 2, y + 45, { size: 30, weight: 800, align: "center", base: "middle", color: "#FFFFFF" });
        x += W * f;
      });
    });
    [["correct", C.green], ["said “I don't know”", C.dim], ["wrong", C.red]].forEach(([l, col], i) => {
      g.fillStyle = col; g.beginPath(); g.arc(620 + i * 330, 860, 14, 0, 7); g.fill();
      text(g, l, 645 + i * 330, 860, { size: 26, base: "middle", alpha: k });
    });
    source(g, "Kalai, Nachum, Vempala & Zhang 2025, Why Language Models Hallucinate (OpenAI) · SimpleQA results reported by OpenAI", 1);
    g.restore();
  }
  if (L === 2) {
    const p = s.at(4, 0, 0.6);
    g.save(); g.globalAlpha *= p;
    text(g, "Change the scoring", 960, 200, { size: 56, weight: 800, align: "center" });
    [["correct", "+1", C.green], ["“I don't know”", "0", C.blue], ["confident and wrong", "−1", C.red]].forEach(([l, v, col], i) => {
      const x = 260 + i * 480, pp = s.at(4, 0.6 + i * 0.8, 0.5, ease.back);
      g.save(); g.globalAlpha *= clamp(pp);
      rr(g, x, 360, 420, 360, 40, "#FFFFFF", col, 5);
      text(g, v, x + 210, 500, { size: 120, weight: 800, align: "center", base: "middle", color: col });
      text(g, l, x + 210, 650, { size: 32, weight: 700, align: "center", base: "middle" });
      g.restore();
    });
    text(g, "then honesty pays", 960, 840, { size: 38, weight: 800, align: "center", color: C.purple, alpha: s.at(4, 3.5, 0.5) });
    g.restore();
  }
  if (L === 0) source(g, "Kalai, Nachum, Vempala & Zhang 2025, Why Language Models Hallucinate (OpenAI)", s.at(0, 1, 0.5));
};

// ------------------------------------------------------------ 4 calibration
S.calibration = (g, s) => {
  const p0 = s.at(0, 0, 0.6) * (1 - s.at(1, 0, 0.4));
  if (p0 > 0) {
    g.save(); g.globalAlpha *= p0;
    dial(g, 540, 600, 230, 0.2 + 0.6 * (0.5 + 0.5 * Math.sin(s.t)), "unsure", "certain", "confidence", { titleSize: 32 });
    text(g, "=", 960, 560, { size: 120, weight: 800, align: "center", base: "middle", color: C.purple });
    dial(g, 1380, 600, 230, 0.2 + 0.6 * (0.5 + 0.5 * Math.sin(s.t)), "often wrong", "always right", "how often it's right", { titleSize: 32 });
    text(g, "Calibration", 960, 220, { size: 64, weight: 800, align: "center" });
    g.restore();
  }
  const p1 = s.at(1, 0, 0.6) * (1 - s.at(2, 0, 0.4));
  if (p1 > 0) {
    g.save(); g.globalAlpha *= p1;
    text(g, "“70% chance of rain”", 960, 220, { size: 56, weight: 800, align: "center", color: C.blue });
    for (let i = 0; i < 10; i++) {
      const x = 330 + i * 140, y = 500, rain = [0, 1, 2, 4, 5, 7, 8].includes(i), p = s.at(1, 1.0 + i * 0.25, 0.4, ease.back);
      g.save(); g.globalAlpha *= clamp(p);
      if (rain) {
        g.fillStyle = hexA(C.blue, 0.85); g.beginPath(); g.arc(x - 18, y, 28, 0, 7); g.arc(x + 14, y - 10, 34, 0, 7); g.arc(x + 40, y + 4, 24, 0, 7); g.fill();
        g.strokeStyle = C.blue; g.lineWidth = 5; g.lineCap = "round";
        for (let d = 0; d < 3; d++) { const yy = y + 50 + ((s.t * 80 + d * 20) % 40); g.beginPath(); g.moveTo(x - 20 + d * 22, yy); g.lineTo(x - 26 + d * 22, yy + 14); g.stroke(); }
      } else { glow(g, x, y, 70, C.yellow, 0.4); g.fillStyle = C.yellow; g.beginPath(); g.arc(x, y, 34, 0, 7); g.fill(); }
      text(g, "day " + (i + 1), x, y + 130, { size: 22, align: "center", color: C.muted });
      g.restore();
    }
    chip(g, "7 of 10 days: rain. Calibrated.", 960, 760, { align: "center", size: 36, fill: C.yellow, color: C.ink, alpha: s.at(1, 4.0, 0.5) });
    g.restore();
  }
  const p2 = s.at(2, 0, 0.6);
  if (p2 > 0) {
    // calibration plot
    const X = 260, Y = 860, Wd = 600, Hd = 600;
    g.save(); g.globalAlpha *= p2;
    g.strokeStyle = C.dim; g.lineWidth = 3; g.beginPath(); g.moveTo(X, Y - Hd); g.lineTo(X, Y); g.lineTo(X + Wd, Y); g.stroke();
    text(g, "how sure the model is", X + Wd / 2, Y + 40, { size: 24, align: "center", color: C.muted });
    g.save(); g.translate(X - 40, Y - Hd / 2); g.rotate(-Math.PI / 2); text(g, "how often it is right", 0, 0, { size: 24, align: "center", color: C.muted }); g.restore();
    g.setLineDash([10, 10]); g.strokeStyle = C.purple; g.lineWidth = 3; g.beginPath(); g.moveTo(X, Y); g.lineTo(X + Wd, Y - Hd); g.stroke(); g.setLineDash([]);
    text(g, "perfect calibration", X + Wd - 10, Y - Hd - 20, { size: 22, align: "right", color: C.purple });
    const pre = (u) => u, post = (u) => Math.pow(u, 1.9);
    const draw = (f, col, k) => { if (k <= 0) return; g.strokeStyle = col; g.lineWidth = 7; g.lineCap = "round"; g.beginPath(); for (let i = 0; i <= 40 * k; i++) { const u = i / 40; const x = X + u * Wd, y = Y - f(u) * Hd + (f === pre ? 8 * Math.sin(u * 9) : 0); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); };
    draw(pre, C.teal, s.at(3, 0.4, 1.5));
    draw(post, C.orange, s.at(4, 1.2, 1.5));
    text(g, "schematic", X + 10, Y - Hd + 10, { size: 20, color: C.dim });
    g.restore();
    const t2 = s.at(2, 0.6, 0.5) * (1 - s.at(3, 0, 0.4));
    if (t2 > 0) {
      quote(g, "Calibrated", "When it says 90% sure, it is right about 9 times out of 10. When it is unsure, it says so.", 1000, 340, 760, C.purple, t2);
    }
    const t3 = s.at(3, 0, 0.5) * (1 - s.at(4, 0, 0.4));
    if (t3 > 0) quote(g, "Anthropic, 2022", "Language models (mostly) know what they know: larger models can estimate whether their own answers are true.", 1000, 340, 760, C.teal, t3);
    const t4 = s.at(4, 0, 0.5);
    if (t4 > 0) {
      quote(g, "GPT-4 technical report, 2023", "The pretrained model was well calibrated. After training to be a helpful assistant, calibration was reduced.", 1000, 340, 760, C.orange, t4);
      chip(g, "pretrained", 1000, 680, { size: 26, fill: "#FFFFFF", color: C.teal, stroke: C.teal, alpha: t4 });
      chip(g, "after assistant training", 1200, 680, { size: 26, fill: "#FFFFFF", color: C.orange, stroke: C.orange, alpha: s.at(4, 1.4, 0.5) });
    }
  }
  source(g, "Kadavath et al. 2022, Language Models (Mostly) Know What They Know (Anthropic) · OpenAI 2023, GPT-4 Technical Report", s.at(3, 0, 0.5));
};

// ------------------------------------------------------------ 5 detect
S.detect = (g, s) => {
  const p0 = s.at(0, 0, 0.6) * (1 - s.at(3, 0, 0.5));
  if (p0 > 0) {
    g.save(); g.globalAlpha *= p0;
    text(g, "Ask the same question five times", 960, 150, { size: 44, weight: 800, align: "center" });
    const cols = [
      ["“When was the Eiffel Tower completed?”", ["1889", "In 1889.", "It opened in 1889.", "1889, for the World's Fair", "Completed in 1889."], C.green, 480, "consistent: it knows"],
      ["“When was the obscure treaty signed?”", ["1648", "In 1701.", "It was 1612.", "1733, I believe", "Signed in 1655."], C.orange, 1440, "wandering: it's guessing"],
    ];
    cols.forEach(([q, as, col, x, verdict], c) => {
      const pc = s.at(c === 0 ? 0 : 1, c === 0 ? 0.8 : 0.2, 0.5);
      text(g, q, x, 250, { size: 28, weight: 700, align: "center", alpha: pc });
      as.forEach((a, i) => chip(g, a, x, 310 + i * 90, { align: "center", size: 28, fill: "#FFFFFF", color: col, stroke: col, alpha: s.at(c === 0 ? 0 : 1, (c === 0 ? 1.4 : 0.8) + i * 0.35, 0.4) }));
      chip(g, verdict, x, 790, { align: "center", size: 32, fill: hexA(col, 0.15), color: C.ink, stroke: col, alpha: s.at(1, c === 0 ? 2.8 : 3.6, 0.5) });
    });
    const pe = s.at(2, 0, 0.6);
    if (pe > 0) {
      chip(g, "semantic entropy: low", 480, 880, { align: "center", size: 28, fill: C.green, color: "#FFFFFF", alpha: pe });
      chip(g, "semantic entropy: high → likely made up", 1440, 880, { align: "center", size: 28, fill: C.orange, color: "#FFFFFF", alpha: s.at(2, 1.0, 0.5) });
    }
    g.restore();
  }
  const p3 = s.at(3, 0, 0.6);
  if (p3 > 0) {
    g.save(); g.globalAlpha *= p3;
    text(g, "Inside the model", 960, 180, { size: 48, weight: 800, align: "center" });
    node(g, 600, 420, "default: “I can't answer”", C.red, 1, 30);
    node(g, 600, 700, "“I recognise this”", C.green, s.at(3, 0.8, 0.5), 30);
    edge(g, 790, 700, 860, 450, s.at(3, 1.2, 0.6), C.green);
    rr(g, 1080, 380, 680, 380, 36, hexA(C.orange, 0.08), C.orange, 3);
    text(g, "a misfire", 1420, 430, { size: 36, weight: 800, align: "center", color: C.orange, alpha: s.at(3, 2.0, 0.5) });
    text(g, "feels familiar, but isn't known → the switch fires anyway → a confident invention", 1420, 520, { size: 28, align: "center", maxW: 600, lh: 1.35, alpha: s.at(3, 2.6, 0.5) });
    g.restore();
  }
  source(g, s.t < s.cue(3) ? "Farquhar, Kossen, Kuhn & Gal 2024, Detecting hallucinations in large language models using semantic entropy, Nature 630" : "Lindsey et al. 2025, On the Biology of a Large Language Model (Anthropic)", s.at(0, 1, 0.5));
};

// ------------------------------------------------------------ 6 retrieval
S.retrieval = (g, s) => {
  const p0 = s.at(0, 0, 0.6) * (1 - s.at(1, 0, 0.4));
  if (p0 > 0) {
    g.save(); g.globalAlpha *= p0;
    text(g, "Closed book: answering from memory", 960, 200, { size: 48, weight: 800, align: "center" });
    bot(g, 960, 560, 1.3, { t: s.t });
    g.fillStyle = hexA(C.purple, 0.15); g.beginPath(); g.arc(960, 340, 70, 0, 7); g.fill();
    text(g, "memory", 960, 340, { size: 24, weight: 700, align: "center", base: "middle", color: C.purple });
    g.restore();
  }
  const p1 = s.at(1, 0, 0.6);
  if (p1 > 0) {
    g.save(); g.globalAlpha *= p1;
    text(g, "Open book: retrieval", 960, 140, { size: 48, weight: 800, align: "center", alpha: 1 - s.at(2, 0, 0.4) });
    const steps = [["question", 230, C.blue], ["search", 640, C.teal], ["read sources", 1100, C.orange], ["answer", 1600, C.green]];
    const cw = (n) => measure(g, n, 30, 600) + 39;
    steps.forEach(([n, x, col], i) => { const pp = s.at(1, 0.4 + i * 0.9, 0.5, ease.back); chip(g, n, x, 250, { align: "center", size: 30, fill: "#FFFFFF", color: col, stroke: col, alpha: pp }); if (i) arrow(g, steps[i - 1][1] + cw(steps[i - 1][0]) / 2 + 20, 276, x - cw(n) / 2 - 20, 276, s.at(1, 0.4 + i * 0.9, 0.5), C.dim, 4, 16); });
    for (let i = 0; i < 3; i++) doc(g, 1000 + i * 100, 440, 0.9, PAL[i + 1], s.at(1, 2.4 + i * 0.2, 0.4));
    bot(g, 1600, 470, 0.7, { t: s.t, alpha: s.at(1, 3.2, 0.5) });
    g.restore();
  }
  const p2 = s.at(2, 0, 0.6);
  if (p2 > 0) {
    g.save(); g.globalAlpha *= p2;
    rr(g, 240, 620, 900, 300, 30, "#FFFFFF", C.line, 2);
    text(g, "ANSWER", 280, 650, { size: 22, weight: 800, color: C.purple });
    text(g, "The tower was completed in 1889 [1] for the World's Fair in Paris [2].", 280, 700, { size: 32, maxW: 820, lh: 1.35 });
    const ps = [["[1] Official site of the Eiffel Tower", 1220, 660], ["[2] Encyclopedia: Exposition Universelle 1889", 1220, 800]];
    ps.forEach(([t2, x, y], i) => { const pp = s.at(2, 0.8 + i * 0.6, 0.5); rr(g, x, y, 560, 100, 20, "#FFFFFF", C.blue, 3); text(g, t2, x + 24, y + 50, { size: 24, base: "middle", maxW: 520, alpha: pp }); });
    const pc = s.at(2, 2.4, 1.0);
    cursor(g, lerp(800, 1500, pc), lerp(760, 720, pc), s.at(2, 2.2, 0.4));
    g.restore();
  }
  source(g, "Lewis et al. 2020, Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks", s.at(1, 0, 0.5));
};

// ------------------------------------------------------------ 7 not magic
S.notmagic = (g, s) => {
  text(g, "Sources can be wrong too", 960, 170, { size: 56, weight: 800, align: "center", alpha: s.at(0, 0, 0.6) });
  const p1 = s.at(1, 0, 0.6);
  if (p1 > 0) {
    g.save(); g.globalAlpha *= p1 * (1 - s.at(3, 0, 0.5) * 0.6);
    text(g, "Legal research tools built on retrieval (2024)", 180, 300, { size: 32, weight: 800, color: C.blue });
    bars(g, 620, 360, 900, [["Lexis+ AI", 0.17, C.orange], ["Westlaw AI-Assisted Research", 0.33, C.red]], s.at(1, 0.8, 1.4), { pct: true, size: 26 });
    text(g, "share of queries with a hallucinated answer", 620, 520, { size: 22, color: C.muted });
    g.restore();
  }
  const p2 = s.at(2, 0, 0.6);
  if (p2 > 0) {
    g.save(); g.globalAlpha *= p2 * (1 - s.at(3, 0, 0.5) * 0.6);
    text(g, "AI search engines asked to find a news article's source (2025)", 180, 620, { size: 32, weight: 800, color: C.blue });
    bars(g, 620, 680, 900, [["wrong", 0.6, C.red]], s.at(2, 0.8, 1.2), { size: 26 });
    text(g, "more than 60% of 1,600 queries", 620 + 900 * 0.6 + 20, 702, { size: 26, weight: 800, base: "middle", color: C.red, alpha: s.at(2, 1.8, 0.5) });
    g.restore();
  }
  const p3 = s.at(3, 0, 0.6);
  if (p3 > 0) { g.save(); g.globalAlpha *= p3; rr(g, 260, 820, 1400, 120, 60, C.yellow); text(g, "A citation is a promise you can check, not a proof.", 960, 880, { size: 38, weight: 800, align: "center", base: "middle" }); g.restore(); }
  source(g, "Magesh et al. 2024/2025, Hallucination-Free? (Stanford; J. Empirical Legal Studies) · Jaźwińska & Chandrasekar, Tow Center / CJR, 6 Mar 2025", s.at(1, 0, 0.5) * (1 - p3));
};

// ------------------------------------------------------------ 8 honest
S.honest = (g, s) => {
  text(g, "What an honest model looks like", 960, 160, { size: 52, weight: 800, align: "center", alpha: s.at(0, 0, 0.6) });
  bot(g, 420, 560, 1.2, { t: s.t, alpha: s.at(0, 0.3, 0.6) });
  const items = [["says “I don't know” when it doesn't", C.blue], ["shows how sure it is", C.teal], ["cites sources that really support the claim", C.orange], ["never invents a quote, a case or a reference", C.pink]];
  items.forEach(([t2, col], i) => {
    const p = s.at(1, 0.3 + i * 1.6, 0.5, ease.back);
    if (p <= 0) return;
    g.save(); g.globalAlpha *= clamp(p);
    rr(g, 760, 290 + i * 130, 980, 100, 50, "#FFFFFF", col, 3);
    check(g, 820, 340 + i * 130, true, 1);
    text(g, t2, 870, 340 + i * 130, { size: 32, weight: 700, base: "middle" });
    g.restore();
  });
  const p2 = s.at(2, 0, 0.6);
  if (p2 > 0) { g.save(); g.globalAlpha *= p2; rr(g, 360, 860, 1200, 110, 55, C.yellow); text(g, "Train and test for honesty, not just accuracy.", 960, 915, { size: 38, weight: 800, align: "center", base: "middle" }); g.restore(); }
};

// ------------------------------------------------------------ 9 you
S.you = (g, s) => {
  text(g, "Check the sources", 960, 140, { size: 60, weight: 800, align: "center", alpha: s.at(0, 0, 0.6) });
  person(g, 260, 640, 1.4, C.blue, { bob: s.t * 2, alpha: s.at(0, 0.2, 0.6) });
  magnifier(g, 380, 460, 70, s.at(0, 1.0, 0.5));
  const p1 = s.at(1, 0, 0.6);
  if (p1 > 0) {
    ["names", "numbers", "dates", "quotes", "references"].forEach((w, i) => chip(g, w, 620 + i * 230, 250, { size: 32, fill: hexA(PAL[i], 0.12), color: PAL[i], stroke: PAL[i], alpha: s.at(1, 0.6 + i * 0.4, 0.4) }));
  }
  const p2 = s.at(2, 0, 0.6);
  if (p2 > 0) {
    g.save(); g.globalAlpha *= p2;
    rr(g, 620, 360, 600, 120, 24, "#FFFFFF", C.line, 2);
    text(g, "…completed in 1889 [1]", 650, 420, { size: 32, base: "middle" });
    arrow(g, 1230, 420, 1330, 420, s.at(2, 0.6, 0.5), C.dim, 4, 16);
    rr(g, 1340, 330, 440, 200, 20, "#FFFFFF", C.blue, 3);
    g.fillStyle = hexA(C.dim, 0.4); for (let k = 0; k < 5; k++) g.fillRect(1370, 360 + k * 30, k === 2 ? 200 : 360, 12);
    const hl = s.at(2, 1.6, 0.8); g.fillStyle = hexA(C.yellow, 0.6); g.fillRect(1366, 416, 380 * hl, 22);
    check(g, 1760, 340, true, 1, s.at(2, 2.6, 0.4));
    cursor(g, lerp(900, 1180, s.at(2, 0.2, 0.6)), 440, s.at(2, 0, 0.3) * (1 - s.at(2, 1.2, 0.3)));
    g.restore();
  }
  const p3 = s.at(3, 0, 0.6);
  if (p3 > 0) {
    g.save(); g.globalAlpha *= p3;
    rr(g, 620, 560, 640, 90, 30, "#FFFFFF", C.purple, 3);
    text(g, "How sure are you? Where is this from?", 650, 605, { size: 30, weight: 700, base: "middle", color: C.purple });
    ["health", "law", "money"].forEach((w, i) => chip(g, w, 1320 + i * 160, 580, { size: 30, fill: "#FFFFFF", color: C.red, stroke: C.red, alpha: s.at(3, 2.5 + i * 0.3, 0.4) }));
    chip(g, "→ confirm with a person or the original source", 1320, 660, { size: 24, fill: "#FFFFFF", color: C.ink, stroke: C.line, alpha: s.at(3, 3.5, 0.5) });
    g.restore();
  }
  const p4 = s.at(4, 0, 0.6);
  if (p4 > 0) { g.save(); g.globalAlpha *= p4; rr(g, 620, 790, 1160, 130, 65, C.yellow); text(g, "A brilliant first draft, not the final word.", 1200, 855, { size: 40, weight: 800, align: "center", base: "middle" }); g.restore(); }
};

// ------------------------------------------------------------ 10 outro
S.outro = (g, s) => {
  const p0 = s.at(0, 0, 0.8);
  g.save(); g.globalAlpha *= p0 * (1 - s.at(2, 0, 0.6) * 0.3);
  crowd(g, 22, 260, 640, 1400, 300, 1.0, s.t, { appear: p0, lit: s.at(1, 0.5, 2.0) });
  bot(g, 960, 470, 0.8, { t: s.t, alpha: s.at(1, 0, 0.6) * (1 - s.at(2, 0, 0.5)) });
  g.restore();
  text(g, "The wise know the limits of what they know.", 960, 200, { size: 56, weight: 800, align: "center", alpha: p0 * (1 - s.at(2, 0, 0.5)) });
  text(g, "Ask it of our machines, and of ourselves.", 960, 290, { size: 36, align: "center", color: C.purple, alpha: s.at(1, 0, 0.6) * (1 - s.at(2, 0, 0.5)) });
  const p2 = s.at(2, 0.3, 0.8);
  if (p2 > 0) {
    g.save(); g.globalAlpha *= p2;
    text(g, "“I don't know.", 960, 190, { size: 96, weight: 800, align: "center" });
    text(g, "Let's check.”", 960, 310, { size: 96, weight: 800, align: "center", color: C.purple, alpha: s.at(2, 1.6, 0.6) });
    magnifier(g, 1330, 300, 50, s.at(2, 2.0, 0.5));
    g.restore();
  }
};
})();
