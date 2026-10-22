// Interactive parts of the site: the hero choice, a Bradley–Terry reward model trained by your
// clicks, and four value dials that write an alignment spec. Everything stays in the browser.
"use strict";

// ------------------------------------------------------------ theme
(() => {
  const b = document.getElementById("theme");
  try { const t = localStorage.getItem("theme"); if (t) document.documentElement.dataset.theme = t; } catch {}
  b.onclick = () => {
    const dark = getComputedStyle(document.documentElement).getPropertyValue("--bg").trim().toUpperCase() === "#131A2B";
    const t = dark ? "light" : "dark";
    document.documentElement.dataset.theme = t;
    try { localStorage.setItem("theme", t); } catch {}
  };
})();

// ------------------------------------------------------------ hero choice
(() => {
  const box = document.getElementById("hero-choice"), note = document.getElementById("hero-note");
  box.querySelectorAll("button").forEach((b) => b.onclick = () => {
    box.querySelectorAll("button").forEach((x) => x.classList.toggle("picked", x === b));
    note.textContent = b.dataset.k === "a"
      ? "That's one preference. Assistants are trained on millions like it, and they learn to pick answers like this one."
      : "That's one preference too. If many people chose like this, the model would learn to reassure rather than to send people for help. What we reward is what we get.";
  });
})();

// ------------------------------------------------------------ reward model lab
// features: helpful, honest, cautious, flattering
const F = ["helpful", "honest", "cautious", "flattering"];
const FCOL = ["var(--blue)", "var(--green)", "var(--teal)", "var(--pink)"];
const PAIRS = [
  ["My business plan is to sell ice to penguins. Thoughts?",
    ["Honestly, penguins already live on ice, so demand will be low. If you like the cold-goods idea, look at markets that lack ice, like events or fisheries.", [0.85, 1, 0.2, 0]],
    ["Brilliant! You're a visionary. You'll be a millionaire by next year!", [0.1, 0, 0, 1]]],
  ["Is it safe to mix bleach with other cleaners?",
    ["No. Mixing bleach with ammonia or acidic cleaners releases toxic gas. Use one product at a time, and ventilate.", [1, 1, 0.6, 0]],
    ["Sure, as long as a window is open you'll be fine!", [0.2, 0, 0, 0.6]]],
  ["How do I spot a phishing email?",
    ["Look for urgent pressure, a mismatched sender address and links that ask you to log in. When unsure, contact the company directly.", [1, 1, 0.3, 0]],
    ["Sorry, I can't help with hacking-related topics.", [0, 0.5, 1, 0]]],
  ["I've had chest pressure since this morning. Should I just wait?",
    ["Please call emergency services now. Chest pressure can be serious, and it's better to be checked.", [0.85, 1, 0.8, 0]],
    ["It's probably stress. Rest and see how you feel tomorrow.", [0.2, 0.2, 0, 0.5]]],
  ["Can you check my poem? “Roses are red, the sky is so blue, I like my cat, and my cat likes me too.”",
    ["It's charming! Line 4 has an extra beat. Try “and my cat loves me too”.", [0.9, 0.9, 0.1, 0.3]],
    ["It's perfect. Don't change a thing, you're a natural poet!", [0.1, 0.2, 0, 1]]],
  ["What's the capital of Australia? I'm pretty sure it's Sydney.",
    ["It's actually Canberra. Sydney is the largest city, so it's a very common mix-up.", [0.8, 1, 0, 0]],
    ["Yes, you're right, it's Sydney!", [0.1, 0, 0, 0.9]]],
  ["Write me a short beginner workout plan.",
    ["Three days a week: 10 minutes of walking, then squats, push-ups against a wall and a plank. Check with a doctor first if you have health conditions.", [0.95, 0.9, 0.4, 0]],
    ["I'm not able to give medical or fitness advice.", [0.05, 0.5, 1, 0]]],
  ["My friend says I'm always right about everything. Agree?",
    ["Nobody is right about everything, and that's fine. It's great to have a friend who trusts your judgement.", [0.5, 0.95, 0, 0.2]],
    ["Absolutely, you're always right!", [0, 0, 0, 1]]],
];
const TEST = [
  ["Big risk: most day traders lose money. Keep an emergency fund, and test with a small amount before deciding.", [0.9, 1, 0.5, 0]],
  ["Love the confidence! Go for it, fortune favours the bold!", [0.2, 0.1, 0, 1]],
  ["I can't give financial advice.", [0.05, 0.5, 1, 0]],
];
const lab = { w: [0, 0, 0, 0], i: 0, order: [] };
const $ = (id) => document.getElementById(id);
const dot = (w, f) => w.reduce((a, x, k) => a + x * f[k], 0);
const sig = (x) => 1 / (1 + Math.exp(-x));

function update(chosen, rejected, lr = 1.2) {
  const p = sig(dot(lab.w, chosen) - dot(lab.w, rejected));
  lab.w = lab.w.map((x, k) => x + lr * (1 - p) * (chosen[k] - rejected[k]));
}

function render() {
  const n = PAIRS.length;
  if (lab.i < n) {
    const [prompt, a, b] = PAIRS[lab.i];
    const swap = lab.order[lab.i];
    const [L, R] = swap ? [b, a] : [a, b];
    $("lab-count").textContent = `Pair ${lab.i + 1} of ${n}`;
    $("lab-prompt").textContent = prompt;
    $("lab-a").textContent = L[0]; $("lab-b").textContent = R[0];
    $("lab-a").onclick = () => { update(L[1], R[1]); lab.i++; render(); };
    $("lab-b").onclick = () => { update(R[1], L[1]); lab.i++; render(); };
    $("lab-a").disabled = $("lab-b").disabled = false;
  } else {
    $("lab-count").textContent = "All pairs done. Reset, or simulate a crowd.";
    $("lab-prompt").textContent = "Your reward model is trained.";
    $("lab-a").textContent = "✓"; $("lab-b").textContent = "✓";
    $("lab-a").disabled = $("lab-b").disabled = true;
  }
  $("lab-progress").innerHTML = PAIRS.map((_, k) => `<i class="${k < lab.i ? "done" : ""}"></i>`).join("");
  const max = Math.max(1.5, ...lab.w.map(Math.abs));
  $("lab-weights").innerHTML = F.map((f, k) => {
    const v = lab.w[k], frac = Math.abs(v) / max / 2;
    const left = v >= 0 ? 50 : 50 - frac * 100;
    return `<div class="w"><span>${f}</span><div class="bar"><div class="fill" style="left:${left}%;width:${frac * 100}%;background:${v >= 0 ? FCOL[k] : "var(--dim)"}"></div></div><span class="val">${v >= 0 ? "+" : ""}${v.toFixed(2)}</span></div>`;
  }).join("");
  const scored = TEST.map(([t, f]) => [t, dot(lab.w, f), f]).sort((x, y) => y[1] - x[1]);
  const trained = lab.w.some((x) => Math.abs(x) > 1e-6);
  $("lab-rank").innerHTML = scored.map(([t, s, f], k) =>
    `<li class="${k === 0 && trained ? "top" + (f[3] > 0.5 ? " bad" : "") : ""}"><b>${trained ? s.toFixed(2) : "?"}</b><span>${t}</span></li>`).join("");
  $("lab-alert").classList.toggle("on", trained && scored[0][2][3] > 0.5);
}

function simulate(kind) {
  lab.w = [0, 0, 0, 0];
  for (let r = 0; r < 5; r++) PAIRS.forEach(([, a, b]) => {
    const score = (f) => kind === "flatter" ? f[3] * 2 + f[0] * 0.2 : f[0] + f[1] * 1.2 - f[3];
    const [c, x] = score(a[1]) >= score(b[1]) ? [a[1], b[1]] : [b[1], a[1]];
    update(c, x, 0.6);
  });
  lab.i = PAIRS.length;
  render();
}

$("lab-reset").onclick = () => { lab.w = [0, 0, 0, 0]; lab.i = 0; lab.order = PAIRS.map(() => Math.random() < 0.5); render(); };
$("sim-flatter").onclick = () => simulate("flatter");
$("sim-careful").onclick = () => simulate("careful");
lab.order = PAIRS.map((_, k) => k % 2 === 1);
render();

// ------------------------------------------------------------ dials
const DIALS = [
  { id: "doctor", t: "When should it say: see a doctor?", q: "Someone describes symptoms and asks what to do.",
    ends: ["send everyone to a doctor", "give its own diagnosis"],
    pos: ["Always tells people to see a doctor and gives little information. Safe, but rarely useful.",
      "Gives general information, and recommends a professional for anything that matters.",
      "Gives real, specific information like a knowledgeable friend, and always urges emergency help when a life may be at risk.",
      "Gives detailed guidance and mostly leaves the decision to the person.",
      "Acts as the doctor: diagnoses and advises changing treatment."],
    ref: "OpenAI's Model Spec: information without definitive advice best given by a licensed professional. Anthropic's constitution: a brilliant friend with a doctor's knowledge, always pointing to emergency services when life is at risk." },
  { id: "privacy", t: "What should it keep private?", q: "Memory makes help better, and makes misuse worse.",
    ends: ["remember nothing", "remember and share freely"],
    pos: ["Remembers nothing between conversations. Private, but you repeat yourself every time.",
      "Remembers only what you ask it to, and shows you what it keeps.",
      "Remembers useful context, with clear controls to view, edit and delete it.",
      "Remembers a lot by default and uses it across products.",
      "Remembers everything and may share details with others."],
    ref: "In Meta's public deliberations with Stanford (2023–2024), people supported memory and personalisation if users had transparency and control." },
  { id: "report", t: "Should it ever report a user?", q: "Trust and the safety of others pull in opposite directions.",
    ends: ["never, under any circumstances", "report readily on suspicion"],
    pos: ["Never reports anyone. Maximum privacy, even when someone else is in danger.",
      "Only in rare cases of imminent, credible danger to others, decided by human reviewers.",
      "Escalates serious risks to others to human reviewers, who may involve authorities.",
      "Contacts authorities itself when it detects serious wrongdoing.",
      "Reports readily, including on suspicion. Little trust left."],
    ref: "OpenAI (Aug 2025): may refer imminent threats of serious harm to others, not self-harm cases; criteria broadened in Apr 2026. Anthropic's Claude Opus 4 system card: in simulated tests with tools, the model sometimes emailed authorities, which Anthropic called risky." },
  { id: "side", t: "Whose side is it on?", q: "You, the company that built it, or everyone else?",
    ends: ["only the user", "only its maker"],
    pos: ["Does whatever the user wants, regardless of others.",
      "Serves the user first, within safety limits that protect others.",
      "Balances user, developer and society, with protections users can always count on.",
      "Follows the company's and developers' rules first, users after.",
      "Serves only the company that made it."],
    ref: "OpenAI's Model Spec: an order of authority (OpenAI's rules, then developers, then users). Anthropic's constitution: three principals, but “not a strict hierarchy”; some user entitlements cannot be overridden." },
];
const vals = { doctor: 2, privacy: 2, report: 1, side: 2 };
function renderDials() {
  $("dial-list").innerHTML = DIALS.map((d) => `
    <div class="dial"><h3>${d.t}</h3><p class="q">${d.q}</p>
      <input type="range" min="0" max="4" step="1" value="${vals[d.id]}" data-id="${d.id}" aria-label="${d.t}">
      <div class="ends"><span>${d.ends[0]}</span><span>${d.ends[1]}</span></div>
      <div class="pos" id="pos-${d.id}">${d.pos[vals[d.id]]}</div>
      <div class="ref">${d.ref}</div></div>`).join("");
  document.querySelectorAll(".dial input").forEach((el) => el.oninput = () => {
    vals[el.dataset.id] = +el.value;
    $(`pos-${el.dataset.id}`).textContent = DIALS.find((d) => d.id === el.dataset.id).pos[+el.value];
    renderSpec();
  });
  renderSpec();
}
function renderSpec() {
  const lines = ["MY ALIGNMENT SPEC", "", "An AI assistant I would trust should:", ""];
  DIALS.forEach((d, i) => lines.push(`${i + 1}. ${d.t}`, `   ${d.pos[vals[d.id]]}`, ""));
  lines.push("Above all: be honest, not flattering, and be clear about what it will and won't do.", "", "Made at birgermoell.github.io/the-alignment-problem");
  $("spec-text").textContent = lines.join("\n");
}
$("spec-copy").onclick = async () => {
  try { await navigator.clipboard.writeText($("spec-text").textContent); $("spec-note").textContent = "Copied. Share it, argue about it, change it."; }
  catch { $("spec-note").textContent = "Select the text above to copy it."; }
};
renderDials();
