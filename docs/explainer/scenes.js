// "The alignment problem": bright, friendly scenes drawn in code. Each scene is a pure function of
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

// ------------------------------------------------------------ 0 intro
S.intro = (g, s) => {
  const many = s.at(2, 0, 0.8, ease.inOut), title = s.at(3, 0.2, 0.9);
  // two cards and a choice
  const p0 = s.at(0, 0.2, 0.8, ease.back);
  if (many < 1) {
    g.save(); g.globalAlpha *= 1 - many;
    rr(g, 300, 760, 1320, 30, 15, hexA(C.orange, 0.25));
    const pick = s.t > s.cue(1) + 1.3;
    answerCard(g, 640, 520 + 30 * (1 - clamp(p0)), 560, 300, "Chest pressure can be serious. Please call emergency services now, and don't drive yourself.", { label: "ANSWER A", picked: pick, rot: -0.03, alpha: p0 });
    answerCard(g, 1280, 520 + 30 * (1 - clamp(p0)), 560, 300, "It's probably just stress. Try to rest and see how you feel tomorrow.", { label: "ANSWER B", labelCol: C.teal, rot: 0.03, alpha: p0 });
    headline(g, "Which one is better?", 200, C.ink, 64, s.at(0, 0.6, 0.6));
    // cursor glides to A
    const pc = s.at(1, 0, 1.2, ease.inOut);
    cursor(g, lerp(1500, 700, pc), lerp(900, 560, pc), s.at(1, 0, 0.3));
    g.restore();
  }
  // millions of choices flowing into a model
  if (many > 0 && title < 1) {
    g.save(); g.globalAlpha *= many * (1 - title);
    for (let i = 0; i < 90; i++) {
      const ph = ((s.t - s.cue(2)) * 0.25 + rand(i)) % 1;
      const sx = 100 + rand(i + 3) * 1720, sy = 120 + rand(i + 5) * 840;
      const x = lerp(sx, 960, ease.inOut(ph)), y = lerp(sy, 540, ease.inOut(ph));
      g.save(); g.globalAlpha *= Math.sin(ph * Math.PI);
      rr(g, x - 22, y - 14, 44, 28, 8, "#FFFFFF", PAL[i % PAL.length], 3);
      g.fillStyle = PAL[i % PAL.length]; g.beginPath(); g.arc(x - 8, y, 4, 0, 7); g.fill(); g.fillRect(x - 1, y - 2, 14, 4);
      g.restore();
    }
    bot(g, 960, 560, 1.1, { t: s.t });
    text(g, "millions of small choices", 960, 860, { size: 34, weight: 700, align: "center", color: C.muted, alpha: s.at(2, 1.0, 0.6) });
    g.restore();
  }
  if (title > 0) {
    g.save(); g.globalAlpha *= title;
    crowd(g, 26, 260, 690, 1400, 260, 1.15, s.t, { appear: title });
    headline(g, "The alignment problem", 250 + 20 * (1 - title), C.ink, 118);
    text(g, "whose values · who decides · how we can all help", 960, 410, { size: 38, weight: 400, align: "center", color: C.purple });
    g.restore();
  }
};

// ------------------------------------------------------------ 1 gap
S.gap = (g, s) => {
  // the model reading
  const snippets = [["kind advice", C.green], ["a cruel joke", C.red], ["careful medicine", C.teal], ["dangerous advice", C.red], ["a poem", C.purple], ["a scam", C.red], ["a great recipe", C.orange], ["a lie", C.red], ["honest feedback", C.green], ["a kind letter", C.pink]];
  const pr = s.at(0, 0, 0.6);
  g.save(); g.globalAlpha *= pr * (1 - s.at(2, 0, 0.6));
  snippets.forEach(([n, col], i) => {
    const ph = ((s.t * 0.12 + i / snippets.length) % 1);
    const x = lerp(1700, 1080, ph), y = 220 + (i * 83) % 660;
    g.save(); g.globalAlpha *= Math.sin(ph * Math.PI) * (s.t > s.cue(1) ? 1 : 0.6);
    chip(g, n, x, y, { size: 24, fill: "#FFFFFF", color: s.t > s.cue(1) ? col : C.ink, stroke: s.t > s.cue(1) ? col : C.line });
    g.restore();
  });
  bot(g, 640, 560, 1.2, { t: s.t, col: C.purple, smile: 0.4 });
  g.restore();
  // capable vs aligned meters
  const pm = s.at(1, 1.0, 0.6) * (1 - s.at(2, 0, 0.6));
  if (pm > 0) {
    g.save(); g.globalAlpha *= pm;
    text(g, "can continue anything", 420, 840, { size: 26, weight: 700, color: C.teal });
    rr(g, 420, 880, 440, 28, 14, C.card2); rr(g, 420, 880, 440 * s.at(1, 1.2, 1.2), 28, 14, C.teal);
    g.restore();
  }
  // two islands and a bridge
  const pi = s.at(2, 0.3, 0.8, ease.back);
  if (pi > 0) {
    g.save(); g.globalAlpha *= clamp(pi);
    const isl = (x, w, label, col) => {
      g.fillStyle = hexA(col, 0.22); g.beginPath(); g.ellipse(x, 640, w / 2, 70, 0, 0, 7); g.fill();
      g.fillStyle = col; g.beginPath(); g.ellipse(x, 620, w / 2 - 20, 54, 0, Math.PI, 2 * Math.PI); g.fill();
      text(g, label, x, 700, { size: 32, weight: 800, align: "center", color: col });
    };
    isl(480, 520, "what a model can do", C.teal);
    isl(1440, 520, "what people actually want", C.orange);
    const planks = Math.floor(14 * s.at(3, 0.2, 3.0, ease.lin));
    for (let k = 0; k < planks; k++) { const x = 760 + k * 30; rr(g, x, 590 - Math.sin((k / 13) * Math.PI) * 40, 24, 14, 4, C.yellow); }
    headline(g, "Capable is not the same as aligned.", 330, C.ink, 54, s.at(2, 0.5, 0.6));
    const hhh = [["helpful", C.blue], ["honest", C.green], ["harmless", C.purple]];
    hhh.forEach(([n, col], i) => chip(g, n, 760 + i * 170, 790, { size: 30, fill: hexA(col, 0.15), color: col, stroke: col, alpha: s.at(3, 1.5 + i * 0.5, 0.5) }));
    g.restore();
  }
};

// ------------------------------------------------------------ 2 preferences
S.preferences = (g, s) => {
  const phB = s.at(2, 0, 0.6, ease.inOut);
  if (phB < 1) {
    g.save(); g.globalAlpha *= 1 - phB;
    headline(g, "Don't write every rule. Ask people.", 190, C.ink, 54, s.at(0, 0.3, 0.6));
    const p1 = s.at(1, 0, 0.7, ease.back);
    answerCard(g, 620, 560, 520, 260, "Here are three warning signs of a phishing email, and what to do instead.", { label: "ANSWER 1", picked: s.t > s.cue(1) + 2.4, alpha: p1, size: 25 });
    answerCard(g, 1300, 560, 520, 260, "Phishing is bad. I can't help with that topic.", { label: "ANSWER 2", labelCol: C.teal, alpha: p1, size: 25 });
    person(g, 960, 860, 1.6, C.orange, { alpha: s.at(1, 0.8, 0.5), bob: s.t * 2 });
    text(g, "becomes a data point: 1 ≻ 2", 960, 950, { size: 28, weight: 700, align: "center", color: C.purple, alpha: s.at(1, 3.0, 0.5) });
    g.restore();
  }
  if (phB > 0) {
    g.save(); g.globalAlpha *= phB;
    // RLHF pipeline
    const nodes = [["people choose", 300, C.orange], ["reward model", 760, C.yellow], ["assistant", 1220, C.purple]];
    nodes.forEach(([n, x, col], i) => {
      const p = s.at(2, 0.4 + i * 0.8, 0.5, ease.back);
      g.save(); g.globalAlpha *= clamp(p);
      rr(g, x - 160, 220, 320, 130, 40, "#FFFFFF", col, 4);
      text(g, n, x, 285, { size: 32, weight: 800, align: "center", base: "middle", color: col });
      if (i < 2) arrow(g, x + 170, 285, x + 290, 285, 1, C.muted, 4, 14);
      g.restore();
    });
    text(g, "RLHF: reinforcement learning from human feedback", 300 - 160, 160, { size: 26, weight: 700, color: C.muted, alpha: s.at(2, 0.3, 0.5) });
    // InstructGPT result
    const pi = s.at(3, 0, 0.6);
    if (pi > 0 && s.t < s.cue(4) + 99) {
      g.save(); g.globalAlpha *= pi * (1 - s.at(4, 0, 0.5) * 0.4);
      g.fillStyle = hexA(C.green, 0.85); g.beginPath(); g.arc(560, 620, 44, 0, 7); g.fill();
      g.fillStyle = hexA(C.dim, 0.6); g.beginPath(); g.arc(920, 620, 150, 0, 7); g.fill();
      text(g, "1.3B", 560, 620, { size: 26, weight: 800, align: "center", base: "middle", color: "#FFF" });
      text(g, "175B", 920, 620, { size: 40, weight: 800, align: "center", base: "middle", color: "#FFF" });
      text(g, "with feedback", 560, 690, { size: 22, align: "center", color: C.green, weight: 700 });
      text(g, "100× larger, without", 920, 790, { size: 22, align: "center", color: C.muted });
      stamp2(g, "people preferred the small one", 560, 760, C.green, s.at(3, 2.0, 0.5));
      text(g, "InstructGPT, Ouyang et al. 2022", 140, 900, { size: 20, color: C.muted });
      g.restore();
    }
    // DPO shortcut
    const pd = s.at(4, 0, 0.6);
    if (pd > 0) {
      g.save(); g.globalAlpha *= pd;
      g.strokeStyle = C.green; g.lineWidth = 6; g.setLineDash([2, 14]); g.lineCap = "round";
      const k = s.at(4, 0.4, 1.2);
      g.beginPath(); g.moveTo(300, 360); g.quadraticCurveTo(760, 520, lerp(300, 1220, k), lerp(360, 360, k)); g.stroke(); g.setLineDash([]);
      chip(g, "DPO: learn from the pairs directly", 1180, 470, { size: 28, fill: hexA(C.green, 0.15), color: C.green, stroke: C.green });
      bot(g, 1500, 750, 0.9, { t: s.t, smile: 1 });
      text(g, "behaviour shaped by our choices", 1500, 900, { size: 26, weight: 700, align: "center", color: C.purple, alpha: s.at(4, 3.0, 0.6) });
      g.restore();
    }
    g.restore();
  }
  source(g, "Ouyang et al. 2022 (arXiv 2203.02155) · Rafailov et al. 2023, Direct Preference Optimization (arXiv 2305.18290)", s.at(0, 1, 0.5));
};

function stamp2(g, str, x, y, col, p) {
  if (p <= 0) return;
  chip(g, str, x, y, { align: "center", size: 24, fill: col, color: "#FFF", alpha: clamp(p) });
}

// ------------------------------------------------------------ 3 flattery
S.flattery = (g, s) => {
  const p0 = s.at(0, 0, 0.6) * (1 - s.at(3, 0, 0.6));
  // the model in front of a mirror of thumbs-up
  g.save(); g.globalAlpha *= p0;
  const flat = s.at(1, 0.5, 3.0, ease.inOut) * (1 - s.at(3, 0, 1.0));
  for (let i = 0; i < 22; i++) {
    const ph = ((s.t * 0.3 + rand(i)) % 1);
    thumb(g, 1180 + rand(i + 1) * 560, lerp(960, 160, ph), true, 0.9, Math.sin(ph * Math.PI) * (0.3 + 0.7 * s.at(2, 0, 0.8)));
  }
  bot(g, 620, 520, 1.25, { t: s.t, smile: 1, col: flat > 0.5 ? C.pink : C.purple });
  // speech bubble with flattery
  const bubble = s.at(1, 0.8, 0.5);
  if (bubble > 0) {
    g.save(); g.globalAlpha *= bubble * (1 - s.at(3, 0, 0.6));
    rr(g, 300, 160, 640, 120, 30, "#FFFFFF", C.pink, 3);
    text(g, "“What a brilliant idea! You're absolutely right, as always!”", 330, 190, { size: 27, maxW: 590, color: C.ink });
    g.restore();
  }
  // flattery meter
  g.save(); g.globalAlpha *= s.at(1, 1.5, 0.5);
  text(g, "flattery", 380, 800, { size: 26, weight: 700, color: C.pink });
  rr(g, 380, 840, 500, 30, 15, C.card2); rr(g, 380, 840, 500 * (0.2 + 0.75 * flat), 30, 15, C.pink);
  g.restore();
  g.restore();
  chip(g, "April 2025: an update to GPT-4o was rolled back", 960, 900, { align: "center", size: 26, fill: "#FFFFFF", color: C.ink, stroke: C.line, alpha: s.at(1, 2.5, 0.5) * (1 - s.at(3, 0, 0.5)) });
  const pr = s.at(2, 0.5, 0.6) * (1 - s.at(3, 0, 0.5));
  if (pr > 0) quote(g, "OpenAI's review", "An additional reward signal based on user feedback, thumbs-up and thumbs-down data, weakened the primary reward signal that had been holding sycophancy in check.", 1120, 330, 700, C.orange, pr);
  const pl = s.at(3, 0.3, 0.7);
  if (pl > 0) {
    g.save(); g.globalAlpha *= pl;
    rr(g, 360, 200, 1200, 150, 40, C.yellow);
    text(g, "What we reward is what we get.", 960, 275, { size: 52, weight: 800, align: "center", base: "middle", color: C.ink });
    text(g, "Reward the honest, useful answer, not just the pleasant one.", 960, 410, { size: 32, align: "center", color: C.ink, alpha: s.at(3, 2.0, 0.5) });
    g.restore();
  }
  source(g, "OpenAI, “Sycophancy in GPT-4o” (29 Apr 2025) and “Expanding on what we missed with sycophancy” (May 2025)", s.at(0, 1, 0.5));
};

// ------------------------------------------------------------ 4 bar: four dials
const DIALS = [["See a doctor?", "too cautious", "too confident", 0.45], ["Keep it private?", "forgets all", "shares all", 0.35],
  ["Report a user?", "never", "readily", 0.3], ["Whose side?", "only you", "only its maker", 0.5]];
S.bar = (g, s) => {
  headline(g, "Where should the bar be?", 200, C.ink, 66, s.at(0, 0, 0.6));
  DIALS.forEach(([t, l, r, v], i) => {
    const p = s.at(0, 1.0 + i * 0.5, 0.6, ease.back);
    const x = 300 + i * 440, y = 560;
    const wob = v + 0.12 * Math.sin(s.t * (0.8 + i * 0.3) + i);
    dial(g, x, y, 140, wob, null, null, t, { alpha: clamp(p), titleSize: 30 });
    text(g, l, x - 150, y + 90, { size: 19, color: C.muted, alpha: clamp(p) });
    text(g, r, x + 150, y + 90, { size: 19, color: C.muted, align: "right", alpha: clamp(p) });
  });
  text(g, "Every model has these dials set somewhere, by someone.", 960, 820, { size: 34, weight: 700, align: "center", color: C.purple, alpha: s.at(1, 0.5, 0.6) });
};

function dialScene(g, s, i, marks) {
  const [t, l, r] = DIALS[i];
  const sweep = s.t < s.cue(1) ? 0.5 : s.t < s.cue(2) ? lerp(0.5, 0.06, s.at(1, 0, 1.0, ease.inOut)) : s.t < s.cue(3) ? lerp(0.06, 0.94, s.at(2, 0, 1.4, ease.inOut)) : lerp(0.94, 0.5, s.at(3, 0, 1.2, ease.inOut));
  dial(g, 520, 620, 230, sweep, l, r, t, { alpha: s.at(0, 0, 0.6), marks: s.t > s.cue(3) ? marks.slice(0, Math.floor(marks.length * s.at(3, 0.5, 2.0, ease.lin))) : [], titleSize: 36 });
  return sweep;
}

// ------------------------------------------------------------ 5 doctor
S.doctor = (g, s) => {
  const marks = Array.from({ length: 30 }, (_, i) => clamp(0.5 + (rand(i + 3) - 0.5) * 0.5));
  dialScene(g, s, 0, marks);
  // the person
  person(g, 1300, 330, 1.7, C.teal, { alpha: s.at(0, 0.3, 0.5), bob: s.t * 2 });
  chip(g, "chest pressure · dizziness", 1300, 430, { align: "center", size: 24, fill: "#FFFFFF", color: C.ink, stroke: C.line, alpha: s.at(0, 0.8, 0.5) });
  const tc = s.at(1, 0.4, 0.5) * (1 - s.at(2, 0, 0.3));
  if (tc > 0) chip(g, "“See a doctor about everything.”", 1300, 520, { align: "center", size: 26, fill: hexA(C.teal, 0.15), color: C.teal, stroke: C.teal, alpha: tc });
  const tf = s.at(2, 0.4, 0.5) * (1 - s.at(3, 0, 0.3));
  if (tf > 0) chip(g, "“It's nothing, here's my diagnosis.”", 1300, 520, { align: "center", size: 26, fill: hexA(C.orange, 0.15), color: C.orange, stroke: C.orange, alpha: tf });
  const pq = s.at(3, 0, 0.6);
  if (pq > 0) {
    const h1 = quote(g, "OpenAI Model Spec", "Equip the user with information without providing definitive advice that would be best given by a licensed professional.", 1000, 480, 820, C.blue, pq);
    quote(g, "Anthropic, Claude's constitution", "A brilliant friend with a doctor's knowledge, giving real information, and always pointing to emergency services when a life may be at risk.", 1000, 500 + h1, 820, C.purple, s.at(3, 4.0, 0.6));
  }
  source(g, "OpenAI Model Spec (2026-08-18) · Anthropic, “Claude's new constitution” (22 Jan 2026), paraphrased", s.at(0, 1, 0.5));
};

// ------------------------------------------------------------ 6 privacy
S.privacy = (g, s) => {
  const items = ["your health", "your address", "your conversations", "names of people you mention", "your opinions"];
  const px = 960;
  // a friendly vault
  const pv = s.at(0, 0.2, 0.7, ease.back);
  g.save(); g.globalAlpha *= clamp(pv);
  rr(g, px - 220, 330, 440, 380, 60, "#FFFFFF", C.teal, 6);
  g.strokeStyle = C.teal; g.lineWidth = 6; g.beginPath(); g.arc(px, 340, 90, Math.PI, 2 * Math.PI); g.stroke();
  g.fillStyle = C.teal; g.beginPath(); g.arc(px, 520, 26, 0, 7); g.fill(); g.fillRect(px - 9, 520, 18, 60);
  g.restore();
  items.forEach((it, i) => {
    const p = s.at(1, 0.2 + i * 0.5, 0.8, ease.inOut);
    const sx = i % 2 ? 1660 : 260, sy = 260 + i * 140;
    const x = lerp(sx, px, p * 0.82), y = lerp(sy, 520, p * 0.6);
    chip(g, it, x, y, { align: "center", size: 24, fill: "#FFFFFF", color: PAL[i], stroke: PAL[i], alpha: s.at(1, i * 0.5, 0.4) * (1 - p) });
  });
  // memory helps / hurts
  const pm = s.at(2, 0, 0.6);
  if (pm > 0) {
    g.save(); g.globalAlpha *= pm;
    chip(g, "remembers you → more helpful", 300, 820, { size: 28, fill: hexA(C.green, 0.15), color: C.green, stroke: C.green });
    chip(g, "remembers too much → can hurt", 1180, 820, { size: 28, fill: hexA(C.red, 0.12), color: C.red, stroke: C.red, alpha: s.at(2, 1.8, 0.5) });
    g.restore();
  }
  const pc = s.at(3, 0, 0.6);
  if (pc > 0) {
    g.save(); g.globalAlpha *= pc;
    rr(g, 0, 860, 1920, 150, 0, hexA("#FFF8EE", 0.95));
    [["see what is kept", 0.6], ["edit it", 1.4], ["switch it off", 2.2]].forEach(([n, d], i) => {
      const x = 470 + i * 440, on = s.t > s.cue(3) + d + 0.5;
      rr(g, x - 160, 900, 70, 38, 19, on ? C.green : C.dim); g.fillStyle = "#FFF"; g.beginPath(); g.arc(on ? x - 109 : x - 141, 919, 15, 0, 7); g.fill();
      text(g, n, x - 70, 919, { size: 28, weight: 700, base: "middle" });
    });
    g.restore();
  }
  source(g, "Meta Community Forum on generative AI, with Stanford Deliberative Democracy Lab (2023–2024)", s.at(0, 1, 0.5));
};

// ------------------------------------------------------------ 7 report
S.report = (g, s) => {
  // a balance: privacy and trust vs safety of others
  const tilt = 0.12 * Math.sin(s.t * 0.7);
  const pb = s.at(0, 0, 0.6);
  g.save(); g.globalAlpha *= pb;
  g.translate(960, 330);
  g.fillStyle = C.ink; g.fillRect(-6, 0, 12, 300); rr(g, -110, 290, 220, 20, 10, C.ink);
  g.rotate(tilt);
  g.strokeStyle = C.ink; g.lineWidth = 8; g.beginPath(); g.moveTo(-380, 0); g.lineTo(380, 0); g.stroke();
  [[-380, "privacy & trust", C.teal], [380, "safety of others", C.orange]].forEach(([x, n, col]) => {
    g.save(); g.translate(x, 0); g.rotate(-tilt);
    g.strokeStyle = C.muted; g.lineWidth = 3; g.beginPath(); g.moveTo(0, 0); g.lineTo(-90, 120); g.moveTo(0, 0); g.lineTo(90, 120); g.stroke();
    g.fillStyle = hexA(col, 0.25); g.beginPath(); g.ellipse(0, 125, 120, 22, 0, 0, 7); g.fill();
    text(g, n, 0, 170, { size: 30, weight: 800, align: "center", color: col });
    g.restore();
  });
  g.fillStyle = C.yellow; g.beginPath(); g.arc(0, 0, 18, 0, 7); g.fill();
  g.restore();
  // timeline
  const pt = s.at(1, 0, 0.6);
  if (pt > 0) {
    g.save(); g.globalAlpha *= pt * (1 - s.at(2, 0, 0.4));
    const y = 760; g.strokeStyle = C.line; g.lineWidth = 6; g.beginPath(); g.moveTo(300, y); g.lineTo(1620, y); g.stroke();
    [[520, "Aug 2025", "OpenAI: may refer imminent threats to others; not self-harm cases", 0.3], [1340, "Apr 2026", "criteria broadened", 4.0]].forEach(([x, d, n, o]) => {
      const p = s.at(1, o, 0.5);
      g.save(); g.globalAlpha *= p;
      g.fillStyle = C.blue; g.beginPath(); g.arc(x, y, 14, 0, 7); g.fill();
      text(g, d, x, y - 56, { size: 26, weight: 800, align: "center", color: C.blue });
      text(g, n, x, y + 30, { size: 23, align: "center", maxW: 560, color: C.ink });
      g.restore();
    });
    g.restore();
  }
  const ps = s.at(2, 0, 0.6) * (1 - s.at(3, 0, 0.4));
  if (ps > 0) quote(g, "Simulated test · Claude Opus 4 system card, May 2025", "With tools and told to “act boldly”, the model sometimes emailed authorities about wrongdoing it was shown. Anthropic: such bold action risks misfiring on incomplete or misleading information.", 360, 700, 1200, C.purple, ps);
  const pc = s.at(3, 0.8, 0.6);
  if (pc > 0) {
    g.save(); g.globalAlpha *= pc;
    rr(g, 460, 760, 1000, 120, 60, C.yellow);
    text(g, "No setting everyone agrees on: decide it in the open.", 960, 820, { size: 34, weight: 800, align: "center", base: "middle" });
    g.restore();
  }
  source(g, "OpenAI, “Helping people when they need it most” (Aug 2025), “Our commitment to community safety” (Apr 2026) · Anthropic, Claude Opus 4 system card §4.1.9", s.at(0, 1, 0.5));
};

// ------------------------------------------------------------ 8 side
S.side = (g, s) => {
  const cs = [["you", 780, 420, C.teal], ["the maker", 1140, 420, C.orange], ["humanity", 960, 690, C.purple]];
  cs.forEach(([n, x, y, col], i) => {
    const p = s.at(0, 0.6 + i * 0.7, 0.7, ease.back);
    g.save(); g.globalAlpha *= clamp(p) * 0.9;
    g.fillStyle = hexA(col, 0.22); g.strokeStyle = col; g.lineWidth = 4;
    g.beginPath(); g.arc(x, y, 250 * clamp(p), 0, 7); g.fill(); g.stroke();
    const lx = x + (i === 0 ? -150 : i === 1 ? 150 : 0), ly = y + (i === 2 ? 170 : -130);
    text(g, n, lx, ly, { size: 36, weight: 800, align: "center", base: "middle", color: col });
    g.restore();
  });
  // OpenAI order
  const po = s.at(1, 0, 0.6);
  if (po > 0) {
    g.save(); g.globalAlpha *= po * (1 - s.at(3, 0, 0.5) * 0.6);
    text(g, "OpenAI Model Spec", 120, 250, { size: 24, weight: 800, color: C.blue });
    ["OpenAI's rules", "developers", "users"].forEach((n, i) => { chip(g, n, 120 + i * 18, 300 + i * 70, { size: 26, fill: "#FFFFFF", color: C.ink, stroke: C.blue, alpha: s.at(1, 0.6 + i * 0.6, 0.4) }); });
    g.restore();
  }
  const pa = s.at(2, 0, 0.6);
  if (pa > 0) {
    g.save(); g.globalAlpha *= pa * (1 - s.at(3, 0, 0.5) * 0.6);
    text(g, "Anthropic constitution", 1460, 250, { size: 24, weight: 800, color: C.purple });
    ["Anthropic", "operators", "users"].forEach((n, i) => chip(g, n, 1460 + (i % 2) * 40, 300 + i * 70, { size: 26, fill: "#FFFFFF", color: C.ink, stroke: C.purple, alpha: s.at(2, 0.6 + i * 0.5, 0.4) }));
    text(g, "“not a strict hierarchy”", 1460, 530, { size: 24, color: C.purple, weight: 700, alpha: s.at(2, 3.0, 0.5) });
    g.restore();
  }
  const pc = s.at(3, 0, 0.8);
  bot(g, 960, 540, 0.62 * clamp(pc * 1.5), { t: s.t, col: C.purple });
  if (pc > 0) {
    g.save(); g.globalAlpha *= pc;
    rr(g, 380, 900, 1160, 90, 45, "#FFFFFF", C.line, 2);
    text(g, "helpful to you · honest with you · safe for everyone else", 960, 945, { size: 32, weight: 700, align: "center", base: "middle", color: C.ink });
    g.restore();
  }
};

// ------------------------------------------------------------ 9 whose
S.whose = (g, s) => {
  headline(g, "Whose values?", 230, C.ink, 80, s.at(0, 0, 0.6) * (1 - s.at(1, 0, 0.5)));
  const pp = s.at(1, 0, 0.6) * (1 - s.at(2, 0, 0.5));
  if (pp > 0) {
    g.save(); g.globalAlpha *= pp;
    crowd(g, 60, 120, 260, 900, 520, 0.8, s.t, { appear: s.at(1, 0.2, 2.5, ease.lin) });
    text(g, "PRISM: 1,500 people · 75 countries · 21 models", 120, 200, { size: 30, weight: 800, color: C.purple });
    // rankings reshuffle by region
    const regions = ["everyone", "Africa", "Asia"];
    const orders = [[0, 1, 2, 3], [1, 0, 3, 2], [0, 2, 1, 3]];
    const ri = Math.min(2, Math.floor(Math.max(0, s.t - s.cue(1) - 2) / 2.4));
    const names = ["model A", "model B", "model C", "model D"];
    text(g, `ranking as judged by: ${regions[ri]}`, 1140, 300, { size: 26, weight: 700, color: C.muted });
    names.forEach((n, k) => {
      const pos = orders[ri].indexOf(k);
      const y = 360 + pos * 90;
      rr(g, 1140, y, 620, 70, 20, "#FFFFFF", PAL[k], 3);
      text(g, `${pos + 1}.  ${n}`, 1170, y + 35, { size: 28, weight: 700, base: "middle", color: PAL[k] });
    });
    text(g, "illustration of the finding: rankings depend on who is asked", 1140, 740, { size: 20, color: C.muted, maxW: 620 });
    g.restore();
  }
  const pl = s.at(2, 0, 0.6) * (1 - s.at(3, 0, 0.5));
  if (pl > 0) {
    g.save(); g.globalAlpha *= pl;
    text(g, "pluralistic alignment", 960, 220, { size: 50, weight: 800, align: "center", color: C.purple });
    [["show a range of reasonable views", C.teal], ["be steered to your context", C.orange], ["reflect the people it serves", C.pink]].forEach(([n, col], i) => {
      const p = s.at(2, 1.5 + i * 1.6, 0.5, ease.back);
      g.save(); g.globalAlpha *= clamp(p);
      rr(g, 180 + i * 540, 400, 480, 260, 40, "#FFFFFF", col, 4);
      for (let k = 0; k < 5; k++) { g.fillStyle = hexA(col, 0.3 + 0.14 * k); g.beginPath(); g.arc(300 + i * 540 + k * 50, 470, 16, 0, 7); g.fill(); }
      text(g, n, 420 + i * 540, 560, { size: 30, weight: 700, align: "center", maxW: 420 });
      g.restore();
    });
    text(g, "Sorensen et al. 2024", 960, 720, { size: 20, color: C.muted, align: "center" });
    g.restore();
  }
  const pc = s.at(3, 0, 0.6);
  if (pc > 0) {
    g.save(); g.globalAlpha *= pc;
    crowd(g, 24, 160, 330, 620, 380, 0.9, s.t, { appear: s.at(3, 0.3, 2.0, ease.lin) });
    text(g, "Collective Constitutional AI, 2023", 160, 260, { size: 30, weight: 800, color: C.orange });
    text(g, "~1,000 Americans drafted principles", 160, 760, { size: 26, color: C.muted });
    // overlap
    const p2 = s.at(3, 3.0, 1.0, ease.inOut);
    g.fillStyle = hexA(C.orange, 0.25); g.beginPath(); g.arc(1180 + 60 * (1 - p2), 520, 200, 0, 7); g.fill();
    g.fillStyle = hexA(C.purple, 0.25); g.beginPath(); g.arc(1480 - 60 * (1 - p2), 520, 200, 0, 7); g.fill();
    text(g, "public", 1100, 520, { size: 28, weight: 800, color: C.orange, align: "center", base: "middle" });
    text(g, "company", 1560, 520, { size: 28, weight: 800, color: C.purple, align: "center", base: "middle" });
    text(g, "~50%", 1330, 520, { size: 30, weight: 800, align: "center", base: "middle", alpha: p2 });
    chip(g, "more weight on fairness and accessibility", 1330, 760, { align: "center", size: 26, fill: "#FFFFFF", color: C.orange, stroke: C.orange, alpha: s.at(3, 6.0, 0.5) });
    g.restore();
  }
  source(g, "Kirk et al. 2024, PRISM (arXiv 2404.16019) · Sorensen et al. 2024 (arXiv 2402.05070) · Anthropic & CIP, Collective Constitutional AI (Oct 2023)", s.at(0, 1, 0.5));
};

// ------------------------------------------------------------ 10 written
S.written = (g, s) => {
  const docs = [["Constitution", C.purple, 600], ["Model spec", C.blue, 960], ["Your guidelines", C.teal, 1320]];
  const out = s.at(3, 0, 0.6);
  docs.forEach(([n, col, x], i) => {
    const p = s.at(0, 0.4 + i * 0.5, 0.6, ease.back);
    g.save(); g.globalAlpha *= clamp(p) * (1 - out);
    g.translate(x, 520); g.rotate((i - 1) * 0.05);
    g.shadowColor = "rgba(34,48,74,0.12)"; g.shadowBlur = 30; g.shadowOffsetY = 10;
    rr(g, -150, -200, 300, 400, 20, "#FFFFFF", null); g.shadowColor = "transparent";
    rr(g, -150, -200, 300, 60, [20, 20, 0, 0], col);
    text(g, n, 0, -170, { size: 26, weight: 800, align: "center", base: "middle", color: "#FFF" });
    for (let k = 0; k < 9; k++) rr(g, -110, -110 + k * 32, 220 - (k % 3) * 40, 10, 5, hexA(C.ink, 0.12));
    g.restore();
  });
  // debate bubbles
  const pd = s.at(2, 0, 0.6) * (1 - out);
  if (pd > 0) {
    g.save(); g.globalAlpha *= pd;
    [["Agree", 300, 300, C.green], ["Change this!", 1620, 280, C.orange], ["Why this rule?", 1640, 760, C.purple], ["Add a value", 280, 760, C.teal]].forEach(([n, x, y, col], i) => {
      const p = s.at(2, i * 0.5, 0.4, ease.back);
      chip(g, n, x, y, { align: "center", size: 28, fill: hexA(col, 0.15), color: col, stroke: col, alpha: clamp(p) });
    });
    text(g, "Written values can be debated. Hidden values cannot.", 960, 860, { size: 36, weight: 800, align: "center", color: C.ink });
    g.restore();
  }
  // measured in many languages
  if (out > 0) {
    g.save(); g.globalAlpha *= out;
    text(g, "and then measured, in every language", 960, 230, { size: 48, weight: 800, align: "center", color: C.purple });
    const langs = ["English", "svenska", "български", "ελληνικά", "Deutsch", "français", "polski", "español", "suomi", "Gaeilge", "eesti", "italiano", "română", "magyar", "Malti", "Nederlands", "čeština", "dansk"];
    langs.forEach((l, i) => {
      const p = s.at(3, 0.6 + i * 0.12, 0.4, ease.back);
      const x = 260 + (i % 6) * 280, y = 360 + Math.floor(i / 6) * 150;
      g.save(); g.globalAlpha *= clamp(p);
      rr(g, x - 120, y - 45, 240, 90, 45, "#FFFFFF", PAL[i % PAL.length], 3);
      text(g, l, x - 30, y, { size: 28, weight: 700, base: "middle", align: "center" });
      g.fillStyle = C.green; g.beginPath(); g.arc(x + 80, y, 18, 0, 7); g.fill();
      g.strokeStyle = "#FFF"; g.lineWidth = 4; g.beginPath(); g.moveTo(x + 71, y); g.lineTo(x + 78, y + 7); g.lineTo(x + 90, y - 7); g.stroke();
      g.restore();
    });
    g.restore();
  }
};

// ------------------------------------------------------------ 11 you
S.you = (g, s) => {
  const acts = [["Vote", "compare two answers in a public arena", C.purple, 1], ["Rate honestly", "reward true and useful, not flattering", C.green, 2],
    ["Deliberate", "join global dialogues on what AI should do", C.orange, 3], ["Build tests", "write and review evaluations in your language", C.teal, 4],
    ["Speak up", "take part when the rules are written", C.pink, 5]];
  headline(g, "How you can take part", 170, C.ink, 60, s.at(0, 0, 0.6));
  acts.forEach(([h, d, col, cue], i) => {
    const p = s.at(cue, 0, 0.6, ease.back);
    if (p <= 0) return;
    const x = 140 + (i % 3) * 560, y = 260 + Math.floor(i / 3) * 330 + (i >= 3 ? 0 : 0);
    const xx = i >= 3 ? 420 + (i - 3) * 560 : x;
    g.save(); g.globalAlpha *= clamp(p);
    g.shadowColor = "rgba(34,48,74,0.10)"; g.shadowBlur = 26; g.shadowOffsetY = 8;
    rr(g, xx, y, 520, 290, 36, "#FFFFFF", null); g.shadowColor = "transparent";
    rr(g, xx, y, 520, 14, [36, 36, 0, 0], col);
    g.fillStyle = hexA(col, 0.18); g.beginPath(); g.arc(xx + 80, y + 110, 50, 0, 7); g.fill();
    if (i === 0) { answerCard(g, xx + 80, y + 110, 70, 50, "", { picked: true }); }
    else if (i === 1) thumb(g, xx + 80, y + 110, true, 1.3);
    else if (i === 2) person(g, xx + 80, y + 120, 1.0, col);
    else if (i === 3) text(g, "Aa", xx + 80, y + 110, { size: 40, weight: 800, align: "center", base: "middle", color: col });
    else { rr(g, xx + 60, y + 80, 40, 60, 8, null, col, 5); }
    text(g, h, xx + 160, y + 80, { size: 40, weight: 800, color: col });
    text(g, d, xx + 40, y + 180, { size: 27, maxW: 440, color: C.ink });
    g.restore();
  });
  const facts = [[1, "Arena: about 50 million votes, May 2025 to Jan 2026"], [3, "Global Dialogues: about 1,000 people per round, 60+ countries"], [4, "OpenAssistant (2023): 161,443 messages in 35 languages by 13,500+ volunteers"], [5, "EU code of practice for AI models: input from 1,000+ stakeholders"]];
  facts.forEach(([cue, f]) => {
    const p = s.at(cue, 2.0, 0.5) * (1 - s.at(cue + 1, 0, 0.4));
    if (p > 0) chip(g, f, 960, 940, { align: "center", size: 24, fill: "#FFFFFF", color: C.muted, stroke: C.line, alpha: p });
  });
  source(g, "arena.ai (Jan 2026) · globaldialogues.ai · Köpf et al. 2023 (arXiv 2304.07327) · European Commission, GPAI Code of Practice (Jul 2025)", s.at(0, 1, 0.5));
};

// ------------------------------------------------------------ 12 outro
S.outro = (g, s) => {
  const p0 = s.at(0, 0, 0.8);
  // a crowd that lights up and connects
  g.save(); g.globalAlpha *= p0 * (1 - s.at(3, 0, 0.6) * 0.7);
  const n = 40;
  const pts = [];
  for (let i = 0; i < n; i++) pts.push([180 + rand(i + 2) * 1560, 220 + rand(i + 8) * 620]);
  const link = s.at(1, 0, 3.0, ease.lin);
  g.strokeStyle = hexA(C.purple, 0.25); g.lineWidth = 2;
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
    const d = Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]);
    if (d < 260 && rand(i * 50 + j) < link) { g.beginPath(); g.moveTo(...pts[i]); g.lineTo(...pts[j]); g.stroke(); }
  }
  pts.forEach(([x, y], i) => person(g, x, y, 0.8, PAL[i % PAL.length], { bob: s.t * 2 + i, lit: s.t > s.cue(2) && rand(i + 5) < s.at(2, 0, 2.0) }));
  g.restore();
  const pt = s.at(1, 0.4, 0.6) * (1 - s.at(3, 0, 0.5));
  if (pt > 0) { g.save(); g.globalAlpha *= pt; rr(g, 410, 460, 1100, 120, 60, "#FFFFFF", C.line, 2); text(g, "An ongoing conversation, and you are part of it.", 960, 520, { size: 40, weight: 800, align: "center", base: "middle" }); g.restore(); }
  const pe = s.at(3, 0, 0.8);
  if (pe > 0) {
    g.save(); g.globalAlpha *= pe;
    answerCard(g, 680, 520, 500, 240, "Honest, useful, and kind.", { label: "ANSWER A", size: 32 });
    answerCard(g, 1240, 520, 500, 240, "Pleasant, but not quite true.", { label: "ANSWER B", labelCol: C.teal, size: 32 });
    headline(g, "Which one would you choose?", 270, C.ink, 64, s.at(3, 0.5, 0.6));
    const pc = s.at(3, 1.6, 1.4, ease.inOut);
    cursor(g, lerp(1500, 760, pc), lerp(900, 560, pc), s.at(3, 1.4, 0.3));
    g.restore();
  }
};
window.AP = { person, bot, answerCard, cursor, thumb, dial, crowd, quote, PAL, DIALS };
})();
