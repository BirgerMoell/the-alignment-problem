// Drawing engine for the explainer. Every frame is a pure function of time t, so the same code
// renders the video frame by frame (render.py) and plays live in the browser (player.html).
"use strict";

const W = 1920, H = 1080;
const C = {
  bg0: "#FFF8EE", bg1: "#FCEEDF", ink: "#22304A", muted: "#66728A", dim: "#A9B1C3",
  card: "#FFFFFF", card2: "#F6ECDF", line: "#EADDCB",
  yellow: "#FFB627", blue: "#4C86F7", green: "#25B987", red: "#FF6F61", purple: "#7C6CF2", orange: "#FF9348",
  teal: "#1FB5C4", pink: "#FF7FAA",
};
const FONT = "Outfit", MONO = "JetBrains Mono";

// ---------- maths
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, p) => a + (b - a) * p;
const ease = {
  out: (p) => 1 - Math.pow(1 - p, 3),
  inOut: (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2),
  back: (p) => { const c = 1.6; return 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2); },
  lin: (p) => p,
};
// progress of an animation that starts at `start` and lasts `dur` seconds, eased
const prog = (t, start, dur = 0.6, e = ease.out) => e(clamp((t - start) / dur));
// deterministic pseudo-random numbers
function rand(i) { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }

// ---------- primitives
function rr(g, x, y, w, h, r, fill, stroke, lw = 2) {
  g.beginPath();
  g.roundRect(x, y, w, h, r);
  if (fill) { g.fillStyle = fill; g.fill(); }
  if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw; g.stroke(); }
}

function font(size, weight = 400, mono = false) { return `${weight} ${size}px "${mono ? MONO : FONT}", "Noto Sans", "Noto Sans Georgian", sans-serif`; }

// text with wrapping. Returns the height used. opts: size, weight, color, align, mono, maxW, lh, alpha, base
function text(g, str, x, y, o = {}) {
  const size = o.size || 32, lh = (o.lh || 1.25) * size;
  g.save();
  g.font = font(size, o.weight || 400, o.mono);
  g.fillStyle = o.color || C.ink;
  g.textAlign = o.align || "left";
  g.textBaseline = o.base || "top";
  if (o.alpha !== undefined) g.globalAlpha *= clamp(o.alpha);
  const lines = o.maxW ? wrap(g, str, o.maxW) : String(str).split("\n");
  lines.forEach((l, i) => g.fillText(l, x, y + i * lh));
  g.restore();
  return lines.length * lh;
}

function wrap(g, str, maxW) {
  const out = [];
  for (const para of String(str).split("\n")) {
    let line = "";
    for (const word of para.split(" ")) {
      const test = line ? line + " " + word : word;
      if (g.measureText(test).width > maxW && line) { out.push(line); line = word; } else line = test;
    }
    out.push(line);
  }
  return out;
}

function measure(g, str, size, weight = 400, mono = false) {
  g.save(); g.font = font(size, weight, mono); const w = g.measureText(str).width; g.restore(); return w;
}

// typewriter: the first fraction p of the string
const typed = (s, p) => s.slice(0, Math.round(s.length * clamp(p)));

function arrow(g, x1, y1, x2, y2, p = 1, color = C.muted, lw = 3, head = 14) {
  if (p <= 0) return;
  const x = lerp(x1, x2, p), y = lerp(y1, y2, p), a = Math.atan2(y2 - y1, x2 - x1);
  g.save();
  g.strokeStyle = color; g.fillStyle = color; g.lineWidth = lw; g.lineCap = "round";
  g.beginPath(); g.moveTo(x1, y1); g.lineTo(x, y); g.stroke();
  g.beginPath();
  g.moveTo(x, y);
  g.lineTo(x - head * Math.cos(a - 0.45), y - head * Math.sin(a - 0.45));
  g.lineTo(x - head * Math.cos(a + 0.45), y - head * Math.sin(a + 0.45));
  g.closePath(); g.fill();
  g.restore();
}

function glow(g, x, y, r, color, a = 0.35) {
  const gr = g.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, hexA(color, a)); gr.addColorStop(1, hexA(color, 0));
  g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r);
}

function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

// a pill-shaped label
function chip(g, str, x, y, o = {}) {
  const size = o.size || 24, padX = size * 0.65, h = size * 1.75;
  const w = measure(g, str, size, o.weight || 600, o.mono) + 2 * padX;
  const x0 = o.align === "center" ? x - w / 2 : x;
  g.save();
  if (o.alpha !== undefined) g.globalAlpha *= clamp(o.alpha);
  rr(g, x0, y, w, h, h / 2, o.fill || C.card2, o.stroke);
  text(g, str, x0 + padX, y + h / 2, { size, weight: o.weight || 600, color: o.color || C.ink, base: "middle", mono: o.mono });
  g.restore();
  return w;
}

// small coloured label above a card
function label(g, str, x, y, color = C.yellow, size = 20) {
  text(g, str.toUpperCase(), x, y, { size, weight: 700, color, base: "top" });
}

// message card used for context lists. role: system | user | assistant | call | result | summary
const ROLE = {
  system: C.purple, user: C.yellow, assistant: C.ink, call: C.blue, result: C.green, summary: C.orange, memory: C.purple,
};
function message(g, role, roleText, body, x, y, w, o = {}) {
  const col = ROLE[role] || C.ink, size = o.size || 24, pad = 22;
  g.save();
  g.font = font(size, 400, o.mono);
  const lines = wrap(g, body, w - 2 * pad - 8);
  const h = o.h || pad * 2 + 30 + lines.length * size * 1.3;
  if (o.alpha !== undefined) g.globalAlpha *= clamp(o.alpha);
  rr(g, x, y, w, h, 14, o.fill || C.card);
  rr(g, x, y, 6, h, 3, col);
  text(g, roleText.toUpperCase(), x + pad + 8, y + pad - 4, { size: 17, weight: 700, color: col });
  lines.forEach((l, i) => text(g, l, x + pad + 8, y + pad + 26 + i * size * 1.3, { size, color: o.color || C.ink, mono: o.mono }));
  g.restore();
  return h;
}

// ---------- code blocks with light Python / JSON highlighting
const KW = new Set(["def", "return", "for", "in", "if", "not", "while", "True", "False", "None", "import", "from",
  "as", "with", "else", "elif", "try", "except", "range", "print", "and", "or"]);
function codeLine(g, line, x, y, size) {
  g.save();
  g.font = font(size, 400, true);
  g.textBaseline = "top";
  const re = /(#.*$)|("[^"]*"|'[^']*')|(\b[A-Za-z_][A-Za-z0-9_]*\b)|(\d+)|(\s+)|(.)/g;
  let m, cx = x;
  while ((m = re.exec(line))) {
    const tok = m[0];
    let col = C.ink;
    if (m[1]) col = C.dim;
    else if (m[2]) col = C.green;
    else if (m[3] && KW.has(tok)) col = C.purple;
    else if (m[3] && line[re.lastIndex] === "(") col = C.blue;
    else if (m[4]) col = C.orange;
    g.fillStyle = col;
    g.fillText(tok, cx, y);
    cx += g.measureText(tok).width;
  }
  g.restore();
}

// lines: array of strings. o: size, title, hl (array of line indexes to highlight), reveal (0..1), w, alpha
function code(g, lines, x, y, o = {}) {
  const size = o.size || 26, lh = size * 1.55, pad = 30, top = o.title ? 56 : pad;
  const w = o.w || 900, h = top + lines.length * lh + pad - 6;
  g.save();
  if (o.alpha !== undefined) g.globalAlpha *= clamp(o.alpha);
  rr(g, x, y, w, h, 18, C.card, C.line, 2);
  if (o.title) {
    [C.red, C.yellow, C.green].forEach((c, i) => { g.fillStyle = hexA(c, 0.8); g.beginPath(); g.arc(x + 30 + i * 24, y + 28, 7, 0, 7); g.fill(); });
    text(g, o.title, x + 110, y + 17, { size: 20, color: C.muted, mono: true });
  }
  const shown = o.reveal === undefined ? lines.length : Math.floor(lines.length * clamp(o.reveal) + 0.0001);
  (o.hl || []).forEach((i) => {
    const a = o.hlAlpha === undefined ? 1 : o.hlAlpha;
    rr(g, x + 10, y + top + i * lh - 6, w - 20, lh, 8, hexA(C.yellow, 0.13 * a));
    rr(g, x + 10, y + top + i * lh - 6, 4, lh, 2, hexA(C.yellow, a));
  });
  for (let i = 0; i < shown; i++) codeLine(g, lines[i], x + pad, y + top + i * lh, size);
  g.restore();
  return h;
}

// ---------- background, header, progress
function background(g, t) {
  const gr = g.createLinearGradient(0, 0, W, H);
  gr.addColorStop(0, C.bg0); gr.addColorStop(1, C.bg1);
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  // soft drifting colour blobs: warm, calm, never dark
  const blobs = [[C.yellow, 0.16, 300, 260, 420], [C.pink, 0.12, 1600, 220, 380], [C.teal, 0.11, 1500, 900, 460], [C.purple, 0.10, 280, 880, 400], [C.green, 0.08, 960, 1100, 520]];
  blobs.forEach(([col, a, x, y, r], i) => {
    const dx = 60 * Math.sin(t * 0.07 + i * 1.7), dy = 40 * Math.cos(t * 0.05 + i * 2.3);
    const rg = g.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, r);
    rg.addColorStop(0, hexA(col, a)); rg.addColorStop(1, hexA(col, 0));
    g.fillStyle = rg; g.fillRect(0, 0, W, H);
  });
  g.save();
  g.fillStyle = "rgba(34,48,74,0.05)";
  const off = (t * 5) % 56;
  for (let x = -56; x < W + 56; x += 56) for (let y = -56; y < H + 56; y += 56) {
    g.beginPath(); g.arc(x + off, y + off * 0.4, 1.6, 0, 7); g.fill();
  }
  g.restore();
}

function chrome(g, tl, t, idx, alpha) {
  const sc = tl.scenes[idx];
  g.save();
  g.globalAlpha = alpha;
  if (idx > 0 && idx < tl.scenes.length - 1 && !tl.music) {
    text(g, String(idx).padStart(2, "0"), 80, 60, { size: 22, weight: 800, color: C.purple });
    text(g, sc.chapter, 122, 60, { size: 22, weight: 500, color: C.muted });
  }
  g.restore();
  // segmented progress bar
  const y = H - 10, gap = 6, total = tl.duration;
  let x = 0;
  tl.scenes.forEach((s) => {
    const w = (s.dur / total) * W - gap;
    g.fillStyle = "rgba(34,48,74,0.08)"; g.fillRect(x, y, w, 4);
    const p = clamp((t - s.start) / s.dur);
    g.fillStyle = C.purple; g.fillRect(x, y, w * p, 4);
    x += w + gap;
  });
}

// ---------- the player: picks the scene for time t and draws it
const Explainer = {
  scenes: {},
  tl: null,
  lang: "en",
  canvas: null,
  g: null,

  async init(canvas, lang, base = "") {
    this.canvas = canvas; this.g = canvas.getContext("2d"); this.lang = lang;
    canvas.width = W; canvas.height = H;
    const fonts = [new FontFace(FONT, `url(${base}../assets/fonts/Outfit.ttf)`, { weight: "100 900" }),
      new FontFace(MONO, `url(${base}../assets/fonts/JetBrainsMono.ttf)`, { weight: "100 800" }),
      new FontFace("Noto Sans", `url(${base}../assets/fonts/NotoSans.ttf)`, { weight: "100 900" }),
      new FontFace("Noto Sans Georgian", `url(${base}../assets/fonts/NotoSansGeorgian.ttf)`, { weight: "100 900" })];
    for (const f of fonts) { await f.load(); document.fonts.add(f); }
    this.tl = await (await fetch(`${base}timeline.${lang}.json`)).json();
    try { this.trace = await (await fetch(`${base}trace.json`)).json(); } catch { this.trace = null; }
    this.music = null;
    if (this.tl.music) this.music = await (await fetch(`${base}music.json`)).json();
    return this.tl;
  },

  // L({en: "...", sv: "..."}) picks the current language
  L(o) { return typeof o === "string" ? o : o[this.lang] ?? o.en; },

  draw(t) {
    const g = this.g, tl = this.tl;
    t = clamp(t, 0, tl.duration - 0.001);
    let idx = tl.scenes.findIndex((s) => t >= s.start && t < s.start + s.dur);
    if (idx < 0) idx = tl.scenes.length - 1;
    const sc = tl.scenes[idx], lt = t - sc.start;
    background(g, t);
    const fade = Math.min(clamp(lt / 0.45), clamp((sc.dur - lt) / 0.45));
    const s = {
      t: lt, dur: sc.dur, lang: this.lang, trace: this.trace,
      cue: (i) => sc.cues[Math.min(i, sc.cues.length - 1)] ?? 0,
      // progress of an animation starting `off` seconds after cue i
      at: (i, off = 0, dur = 0.6, e = ease.out) => prog(lt, (sc.cues[i] ?? 0) + off, dur, e),
      // fraction through the spoken line i (0 at its start, 1 at its end)
      through: (i) => { const l = sc.lines[i]; return l ? clamp((t - l.start) / (l.end - l.start)) : 0; },
      L: (o) => this.L(o),
      T: t, variant: sc.variant || 1, lines: sc.lines,
      // music: loudness (0..1.5) and beat pulse (1 on the beat, decaying) at global time t
      env: (tt = t) => { const m = this.music; if (!m) return 0; return m.env[Math.min(m.env.length - 1, Math.max(0, Math.floor(tt * m.fps)))] || 0; },
      beat: (tt = t) => { const m = this.music; if (!m) return 0; let lo = 0, hi = m.beats.length - 1;
        while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (m.beats[mid] <= tt) lo = mid; else hi = mid - 1; }
        const d = tt - m.beats[lo]; return d >= 0 ? Math.exp(-d * 6) : 0; },
      beatIndex: (tt = t) => { const m = this.music; if (!m) return 0; return m.beats.filter((b) => b <= tt).length; },
    };
    g.save();
    g.globalAlpha = fade;
    (this.scenes[sc.id] || (() => {}))(g, s);
    g.restore();
    chrome(g, tl, t, idx, fade);
  },
};
window.Explainer = Explainer;
