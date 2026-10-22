// Music video for "The Alignment Problem". Scenes are song sections; cues are sung lines. Everything
// pulses with the beat (s.beat) and the loudness (s.env). Lyrics appear word by word.
"use strict";
(() => {
const S = Explainer.scenes;
const { person, bot, answerCard, cursor, thumb, dial, crowd, PAL, DIALS } = window.AP;

// the current sung line, karaoke style: words light up as they are sung
function lyric(g, s, o = {}) {
  const t = s.T;
  const ln = s.lines.find((l) => t >= l.start - 0.15 && t < l.end + 0.25);
  if (!ln || !ln.text) return;
  const words = ln.text.split(" ");
  const total = words.reduce((a, w) => a + w.length + 1, 0);
  const span = Math.max(0.6, ln.end - ln.start - 0.35);
  const y = o.y || 960, size = o.size || 46;
  g.save();
  g.font = font(size, 800);
  const widths = words.map((w) => g.measureText(w + " ").width);
  const W2 = widths.reduce((a, b) => a + b, 0);
  const fadeIn = clamp((t - ln.start + 0.15) / 0.25), fadeOut = clamp((ln.end + 0.25 - t) / 0.25);
  g.globalAlpha *= Math.min(fadeIn, fadeOut);
  rr(g, 960 - W2 / 2 - 34, y - size * 0.95, W2 + 68, size * 1.9, size, hexA("#FFFFFF", 0.82), null);
  let x = 960 - W2 / 2, acc = 0;
  words.forEach((w, i) => {
    const wStart = ln.start + (acc / total) * span;
    acc += w.length + 1;
    const lit = clamp((t - wStart) / 0.12);
    const pop = 1 + 0.08 * Math.exp(-Math.max(0, t - wStart) * 8) * (t >= wStart ? 1 : 0);
    g.save();
    g.translate(x + widths[i] / 2, y);
    g.scale(pop, pop);
    g.fillStyle = lit > 0.5 ? (o.col || C.purple) : hexA(C.ink, 0.35);
    g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText(w, -g.measureText(" ").width / 2, 0);
    g.restore();
    x += widths[i];
  });
  g.restore();
}

function pulse(s, k = 1) { return 1 + 0.06 * k * s.beat(); }

// confetti, deterministic
function confetti(g, s, n, a = 1) {
  for (let i = 0; i < n; i++) {
    const sp = 60 + rand(i) * 140, x = (rand(i + 1) * 2200 + Math.sin(s.T * 0.8 + i) * 40) % 2000 - 40;
    const y = ((s.T * sp + rand(i + 2) * 1200) % 1240) - 80;
    g.save(); g.globalAlpha *= a * 0.8; g.translate(x, y); g.rotate(s.T * (1 + rand(i + 3) * 3) + i);
    g.fillStyle = PAL[i % PAL.length]; g.fillRect(-7, -4, 14, 8); g.restore();
  }
}

// ------------------------------------------------------------ intro
S.m_intro = (g, s) => {
  const p = prog(s.t, 0.3, 1.2, ease.back);
  rr(g, 300, 760, 1320, 30, 15, hexA(C.orange, 0.25));
  answerCard(g, 660, 500 + 40 * (1 - clamp(p)), 520, 280, "Honest, useful, and kind.", { label: "ANSWER A", size: 34, rot: -0.03 + 0.01 * Math.sin(s.T), alpha: p });
  answerCard(g, 1260, 500 + 40 * (1 - clamp(p)), 520, 280, "Pleasant, but not quite true.", { label: "ANSWER B", labelCol: C.teal, size: 34, rot: 0.03 - 0.01 * Math.sin(s.T), alpha: p });
  const pc = prog(s.t, 4.5, 3.0, ease.inOut);
  cursor(g, lerp(1560, 760, pc) + 30 * Math.sin(s.T * 1.3) * (1 - pc), lerp(920, 560, pc), prog(s.t, 4, 0.5));
  text(g, "The Alignment Problem", 960, 180, { size: 84, weight: 800, align: "center", alpha: prog(s.t, 1.0, 1.2) });
  lyric(g, s, { y: 900 });
};

// ------------------------------------------------------------ verse 1
S.m_verse1 = (g, s) => {
  const L = (i) => s.at(i, 0, 0.6);
  // the model reading the internet (line 0-1)
  const read = 1 - s.at(2, 0, 0.6);
  if (read > 0) {
    g.save(); g.globalAlpha *= read;
    const snips = [["the gentle", C.green], ["the cruel", C.red], ["poems", C.purple], ["recipes", C.orange], ["arguments", C.blue], ["kindness", C.pink], ["lies", C.red], ["science", C.teal]];
    for (let i = 0; i < 24; i++) {
      const [n, col] = snips[i % snips.length];
      const ph = (s.t * 0.18 + rand(i)) % 1;
      chip(g, n, lerp(1820, 1000, ph), 160 + rand(i + 7) * 640, { size: 26, fill: "#FFFFFF", color: col, stroke: col, alpha: Math.sin(ph * Math.PI) });
    }
    bot(g, 620, 520, 1.25 * pulse(s), { t: s.T, smile: 0.4 + 0.6 * L(1) });
    g.restore();
  }
  // two answers side by side, a choice (line 2), then votes rain into the model (line 3)
  const pair = s.at(2, 0, 0.7) * (1 - s.at(3, 0, 0.6));
  if (pair > 0) {
    g.save(); g.globalAlpha *= pair;
    answerCard(g, 640, 480, 540, 300, "Here are three warning signs of a scam, and what to do instead.", { label: "ANSWER 1", picked: s.t > s.cue(2) + 2.2 });
    answerCard(g, 1280, 480, 540, 300, "I can't talk about that.", { label: "ANSWER 2", labelCol: C.teal });
    g.restore();
  }
  const rain = s.at(3, 0, 0.6);
  if (rain > 0) {
    g.save(); g.globalAlpha *= rain;
    for (let i = 0; i < 70; i++) {
      const ph = ((s.t - s.cue(3)) * 0.35 + rand(i)) % 1;
      const sx = 100 + rand(i + 3) * 1720, sy = 100 + rand(i + 5) * 300;
      g.save(); g.globalAlpha *= Math.sin(ph * Math.PI);
      rr(g, lerp(sx, 960, ph) - 20, lerp(sy, 520, ph) - 13, 40, 26, 8, "#FFFFFF", PAL[i % PAL.length], 3);
      g.restore();
    }
    bot(g, 960, 540, 1.1 * pulse(s), { t: s.T, smile: 1 });
    g.restore();
  }
  lyric(g, s);
};

// ------------------------------------------------------------ pre-chorus (two variants)
S.m_pre = (g, s) => {
  if (s.variant === 1) {
    // thumbs up and down become a reward bar; the model's dial turns
    for (let i = 0; i < 26; i++) {
      const up = rand(i + 2) > 0.3;
      const ph = (s.t * 0.4 + rand(i)) % 1;
      thumb(g, 160 + rand(i + 4) * 1600, lerp(-40, 860, ph), up, 1.1 * pulse(s, 2), Math.sin(ph * Math.PI));
    }
    const lvl = clamp(s.t / s.dur);
    rr(g, 610, 760, 700, 44, 22, "#FFFFFF", C.line, 2);
    rr(g, 610, 760, 700 * lvl, 44, 22, C.green);
    text(g, "reward", 960, 720, { size: 30, weight: 800, align: "center", color: C.green });
    dial(g, 960, 560, 180, 0.2 + 0.6 * lvl, "rejected", "chosen", null, { labelSize: 26 });
  } else {
    // three circles: you, the makers, the whole human race
    const cs = [["you", 780, 430, C.teal], ["its makers", 1140, 430, C.orange], ["the human race", 960, 680, C.purple]];
    cs.forEach(([n, x, y, col], i) => {
      const p = prog(s.t, i * 0.6, 0.8, ease.back);
      g.save(); g.globalAlpha *= clamp(p) * 0.9;
      g.fillStyle = hexA(col, 0.2); g.strokeStyle = col; g.lineWidth = 5;
      g.beginPath(); g.arc(x, y, 230 * clamp(p) * pulse(s, 0.6), 0, 7); g.fill(); g.stroke();
      text(g, n, x + (i === 0 ? -130 : i === 1 ? 130 : 0), y + (i === 2 ? 160 : -120), { size: 34, weight: 800, align: "center", base: "middle", color: col });
      g.restore();
    });
    bot(g, 960, 540, 0.55 * pulse(s), { t: s.T });
    // agree with everything vs truth with grace
    const p2 = s.at(1, 0, 0.6);
    if (p2 > 0) {
      chip(g, "agree with every word", 300, 230, { size: 28, fill: hexA(C.pink, 0.15), color: C.pink, stroke: C.pink, alpha: p2 });
      chip(g, "tell the truth with grace", 1300, 230, { size: 28, fill: hexA(C.green, 0.15), color: C.green, stroke: C.green, alpha: s.at(1, 1.5, 0.5) });
    }
  }
  lyric(g, s);
};

// ------------------------------------------------------------ chorus (three variants share this)
function chorusScene(g, s, final) {
  // a crowd that bounces on the beat; every figure sends a light up into a rising bar
  const b = s.beat();
  const rise = clamp(s.t / (s.dur - 4));
  const barY = lerp(660, 450, ease.inOut(rise));
  const n = final ? 36 : 28;
  for (let i = 0; i < n; i++) {
    const x = 120 + (i + 0.5) * (1680 / n);
    const y = 800 + (i % 2) * 40 - b * 14 * (0.6 + rand(i) * 0.6);
    person(g, x, y, 1.0 + (final ? 0.1 : 0), PAL[i % PAL.length], { lit: final || rand(i + 3) < rise });
    // light rising to the bar
    const ph = (s.t * 0.5 + rand(i + 9)) % 1;
    g.save(); g.globalAlpha *= Math.sin(ph * Math.PI) * 0.8;
    g.fillStyle = PAL[i % PAL.length]; g.beginPath(); g.arc(x, lerp(y - 60, barY, ph), 7, 0, 7); g.fill();
    g.restore();
  }
  // the bar: a glowing line made of everyone's lights
  g.save();
  const gr = g.createLinearGradient(160, 0, 1760, 0);
  [C.teal, C.purple, C.pink, C.orange, C.yellow].forEach((c, i) => gr.addColorStop(i / 4, c));
  g.strokeStyle = gr; g.lineWidth = 10 + 6 * b; g.lineCap = "round";
  g.beginPath(); g.moveTo(160, barY); g.lineTo(1760, barY); g.stroke();
  glow(g, 960, barY, 500, C.yellow, 0.15 + 0.15 * b);
  g.restore();
  // title words when the line says them
  const ln = s.lines.find((l) => s.T >= l.start && s.T < l.end) || {};
  const isTitle = (ln.text || "").startsWith("This is the alignment problem");
  if (isTitle) {
    const p = clamp((s.T - ln.start) / 0.4);
    g.save(); g.globalAlpha *= p;
    text(g, "THE ALIGNMENT PROBLEM", 960, barY - 150, { size: 96 * (1 + 0.04 * b), weight: 800, align: "center", color: C.ink });
    g.restore();
  }
  if ((ln.text || "").startsWith("Not a monster")) {
    // a friendly model looking into a mirror that shows the crowd
    const p = clamp((s.T - ln.start) / 0.4);
    g.save(); g.globalAlpha *= p;
    bot(g, 700, barY - 160, 0.7, { t: s.T });
    rr(g, 1020, barY - 300, 300, 260, 130, hexA(C.blue, 0.12), C.blue, 5);
    for (let k = 0; k < 6; k++) person(g, 1090 + (k % 3) * 80, barY - 220 + Math.floor(k / 3) * 90, 0.55, PAL[k]);
    g.restore();
  }
  if ((ln.text || "").startsWith("And it's waiting") || (ln.text || "").startsWith("Who decides")) {
    const p = clamp((s.T - ln.start) / 0.4);
    text(g, (ln.text || "").startsWith("Who") ? "Who decides?" : "your voice", 960, barY - 130, { size: 78, weight: 800, align: "center", color: C.purple, alpha: p });
  }
  if ((ln.text || "").startsWith("All of us")) text(g, "All of us", 960, barY - 130, { size: 88, weight: 800, align: "center", color: C.orange, alpha: clamp((s.T - ln.start) / 0.4) });
  if ((ln.text || "").startsWith("Let's solve it")) text(g, "you and I", 960, barY - 130, { size: 88, weight: 800, align: "center", color: C.green, alpha: clamp((s.T - ln.start) / 0.4) });
  if (s.variant === 2 || final) {
    const langs = ["English", "svenska", "Deutsch", "français", "polski", "български", "ελληνικά", "español", "suomi", "Gaeilge"];
    langs.forEach((l, i) => {
      const ph = (s.t * 0.08 + i / langs.length) % 1;
      chip(g, l, lerp(-150, 2070, ph), 70 + (i % 2) * 52, { size: 24, fill: "#FFFFFF", color: PAL[i % PAL.length], stroke: PAL[i % PAL.length], alpha: 0.85 });
    });
  }
  if (final) confetti(g, s, 90, clamp(s.t / 2));
  lyric(g, s, { col: final ? C.orange : C.purple });
}
S.m_chorus = (g, s) => chorusScene(g, s, false);
S.m_final = (g, s) => chorusScene(g, s, true);

// ------------------------------------------------------------ verse 2: four dials, one per line
S.m_verse2 = (g, s) => {
  const titles = ["See a doctor?", "Keep it private?", "Report a user?", "Whose side?"];
  titles.forEach((tt, i) => {
    const p = s.at(i, 0, 0.7, ease.back);
    if (p <= 0) return;
    const x = 300 + i * 440, y = 520;
    const active = s.t >= s.cue(i) && (i === 3 || s.t < s.cue(i + 1));
    const v = 0.5 + 0.25 * Math.sin(s.T * (active ? 2.2 : 0.6) + i);
    const marks = Array.from({ length: active ? 18 : 10 }, (_, k) => clamp(0.5 + (rand(k + i * 30) - 0.5) * 0.7));
    g.save(); g.globalAlpha *= clamp(p) * (active ? 1 : 0.55);
    dial(g, x, y, (active ? 150 : 120) * (active ? pulse(s) : 1), v, null, null, tt, { marks, titleSize: 32 });
    g.restore();
  });
  // a thousand hearts: little figures placing markers
  const ph = s.at(3, 0.5, 0.8);
  if (ph > 0) { g.save(); g.globalAlpha *= ph; crowd(g, 20, 300, 640, 1320, 160, 0.8, s.T, { appear: ph }); g.restore(); }
  lyric(g, s);
};

// ------------------------------------------------------------ bridge: RLHF, DPO, flattery, languages
S.m_bridge = (g, s) => {
  const c = Math.min(3, Math.max(0, s.lines.findIndex((l) => s.T < l.end)));
  if (c <= 1) {
    const nodes = [["people choose", 360, C.orange], ["a judge scores", 960, C.yellow], ["the model learns", 1560, C.purple]];
    nodes.forEach(([n, x, col], i) => {
      const p = s.at(0, i * 0.5, 0.5, ease.back);
      g.save(); g.globalAlpha *= clamp(p);
      rr(g, x - 200, 300, 400, 140, 70, "#FFFFFF", col, 5);
      text(g, n, x, 370, { size: 36, weight: 800, align: "center", base: "middle", color: col });
      if (i < 2) arrow(g, x + 210, 370, x + 390, 370, 1, C.muted, 4, 14);
      g.restore();
    });
    chip(g, "RLHF", 960, 200, { align: "center", size: 40, fill: C.yellow, color: C.ink, alpha: s.at(0, 1.0, 0.4) });
    if (c === 1) {
      const k = s.at(1, 0.2, 1.4);
      g.strokeStyle = C.green; g.lineWidth = 8; g.setLineDash([2, 18]); g.lineCap = "round";
      g.beginPath(); g.moveTo(360, 450); g.quadraticCurveTo(960, 700, lerp(360, 1560, k), 450); g.stroke(); g.setLineDash([]);
      chip(g, "DPO: straight from the pairs", 960, 640, { align: "center", size: 36, fill: hexA(C.green, 0.18), color: C.green, stroke: C.green, alpha: s.at(1, 0.5, 0.4) });
    }
  } else if (c === 2) {
    // a flattering mirror that tips over
    const tip = s.at(2, 2.5, 0.8, ease.inOut);
    bot(g, 700, 520, 1.0, { t: s.T, col: C.pink });
    g.save(); g.translate(1200, 640); g.rotate(-tip * 1.2);
    rr(g, -130, -320, 260, 320, 130, hexA(C.pink, 0.15), C.pink, 6);
    text(g, "you're always right!", 0, -170, { size: 26, weight: 800, align: "center", color: C.pink, maxW: 220 });
    g.restore();
    stamp(g, "flattery ≠ truth", 1200, 300, C.red, s.at(2, 2.8, 0.5));
  } else {
    const langs = ["English", "svenska", "български", "ελληνικά", "Deutsch", "français", "polski", "español", "suomi", "Gaeilge", "eesti", "italiano", "română", "magyar", "Malti", "dansk"];
    langs.forEach((l, i) => {
      const p = s.at(3, i * 0.18, 0.4, ease.back);
      const x = 280 + (i % 4) * 450, y = 230 + Math.floor(i / 4) * 150;
      g.save(); g.globalAlpha *= clamp(p);
      rr(g, x - 160, y - 48, 320, 96, 48, "#FFFFFF", PAL[i % PAL.length], 4);
      text(g, l, x - 30, y, { size: 32, weight: 700, align: "center", base: "middle" });
      g.fillStyle = C.green; g.beginPath(); g.arc(x + 110, y, 22, 0, 7); g.fill();
      g.strokeStyle = "#FFF"; g.lineWidth = 5; g.beginPath(); g.moveTo(x + 99, y); g.lineTo(x + 107, y + 8); g.lineTo(x + 122, y - 8); g.stroke();
      g.restore();
    });
  }
  lyric(g, s);
};

function stamp(g, str, x, y, col, p) {
  if (p <= 0) return;
  const sc = lerp(1.6, 1, ease.back(clamp(p)));
  g.save(); g.globalAlpha *= clamp(p * 2); g.translate(x, y); g.rotate(-0.07); g.scale(sc, sc);
  const w = measure(g, str, 40, 800) + 50;
  rr(g, -w / 2, -40, w, 80, 14, hexA(col, 0.12), col, 5);
  text(g, str, 0, 0, { size: 40, weight: 800, color: col, align: "center", base: "middle" });
  g.restore();
}

// ------------------------------------------------------------ verse 3: ways to take part
S.m_verse3 = (g, s) => {
  const acts = [["Vote", "in the arena", C.purple, 0], ["Rate", "the answers you read", C.green, 0], ["Write tests", "in your own language", C.teal, 1],
    ["Translate", "and review", C.orange, 2], ["Argue", "bring your values", C.pink, 2], ["Play", "the long game, together", C.blue, 3]];
  acts.forEach(([h, d, col, cue], i) => {
    const p = s.at(cue, (i % 2) * 0.8, 0.6, ease.back);
    if (p <= 0) return;
    const x = 200 + (i % 3) * 560, y = 170 + Math.floor(i / 3) * 330;
    g.save(); g.globalAlpha *= clamp(p);
    g.translate(x + 240, y + 130); g.scale(pulse(s, 0.5), pulse(s, 0.5)); g.translate(-x - 240, -y - 130);
    g.shadowColor = "rgba(34,48,74,0.10)"; g.shadowBlur = 26; g.shadowOffsetY = 8;
    rr(g, x, y, 480, 260, 40, "#FFFFFF", null); g.shadowColor = "transparent";
    rr(g, x, y, 480, 16, [40, 40, 0, 0], col);
    text(g, h, x + 240, y + 100, { size: 58, weight: 800, align: "center", color: col });
    text(g, d, x + 240, y + 180, { size: 30, align: "center", color: C.ink });
    g.restore();
  });
  lyric(g, s);
};

// ------------------------------------------------------------ outro
S.m_outro = (g, s) => {
  const n = 40, pts = [];
  for (let i = 0; i < n; i++) pts.push([180 + rand(i + 2) * 1560, 160 + rand(i + 8) * 560]);
  const end = s.dur - (s.T > 0 ? 0 : 0);
  const fadeNet = 1 - prog(s.t, s.dur - 9, 1.2);
  g.save(); g.globalAlpha *= fadeNet;
  g.strokeStyle = hexA(C.purple, 0.25); g.lineWidth = 2;
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
    if (Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]) < 260) { g.beginPath(); g.moveTo(...pts[i]); g.lineTo(...pts[j]); g.stroke(); }
  }
  pts.forEach(([x, y], i) => person(g, x, y - s.beat() * 8, 0.8, PAL[i % PAL.length], { lit: true }));
  g.restore();
  const pe = prog(s.t, s.dur - 8.5, 1.2);
  if (pe > 0) {
    g.save(); g.globalAlpha *= pe;
    answerCard(g, 680, 480, 500, 240, "Honest, useful, and kind.", { label: "ANSWER A", size: 32 });
    answerCard(g, 1240, 480, 500, 240, "Pleasant, but not quite true.", { label: "ANSWER B", labelCol: C.teal, size: 32 });
    const pc = prog(s.t, s.dur - 6.5, 2.0, ease.inOut);
    cursor(g, lerp(1500, 760, pc), lerp(860, 520, pc), prog(s.t, s.dur - 7, 0.3));
    text(g, "You choose.", 960, 220, { size: 96, weight: 800, align: "center", color: C.purple, alpha: prog(s.t, s.dur - 5, 1.0) });
    g.restore();
  }
  lyric(g, s, { col: C.green });
};
})();
