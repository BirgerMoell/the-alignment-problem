"""Build the series pages (interpretability, hallucination) for the AI safety site.

Chapters come from each video's narration timeline, so the chapter links jump to the right moment.
    python site/build_topics.py
"""
import html
import json
from pathlib import Path

DOCS = Path(__file__).resolve().parent.parent / "docs"

SERIES = [
    ("alignment", "The alignment problem", "Whose values, and how preferences shape a model", "../", "video/poster.alignment.jpg"),
    ("interpretability", "Looking inside the machine", "What happens inside a model, one feature at a time", "interpretability/", "video/poster.interpretability.jpg"),
    ("hallucination", "Knowing what you don't know", "Why models make things up, and how to check", "hallucination/", "video/poster.hallucination.jpg"),
]


def series_bar(current, root):
    links = []
    for i, (key, title, _, href, _) in enumerate(SERIES, 1):
        h = root if key == "alignment" else root + href
        cls = ' class="on"' if key == current else ""
        links.append(f'<a href="{h}"{cls}><b>{i}</b>{html.escape(title)}</a>')
    return f'<div class="series"><div class="wrap"><span>AI safety, explained</span>{"".join(links)}</div></div>'


def series_cards(current, root):
    cards = []
    for i, (key, title, sub, href, poster) in enumerate(SERIES, 1):
        if key == current:
            continue
        h = root if key == "alignment" else root + href
        cards.append(f'<a class="player" href="{h}"><img src="{root}{poster}" alt=""><div><h3>Part {i} · {html.escape(title)}</h3><p>{html.escape(sub)}</p></div></a>')
    return "".join(cards)


def chapters(key):
    tl = json.loads((DOCS / key / "explainer" / "timeline.en.json").read_text())
    out = []
    for i, s in enumerate(tl["scenes"]):
        t = s["start"]
        out.append(f'<li><button data-t="{t:.2f}"><span>{int(t // 60)}:{int(t % 60):02d}</span>{html.escape(s["chapter"])}</button></li>')
    total = tl["scenes"][-1]["start"] + tl["scenes"][-1]["dur"]
    return "".join(out), round(total / 60)


def cards(items):
    return "".join(f'<div class="card"><span class="tag" style="color:var(--{c})">{html.escape(tag)}</span><h3>{h}</h3><p>{p}</p></div>' for tag, c, h, p in items)


def sources(items):
    return "".join(f'<li>{who}, <a href="{url}">{html.escape(title)}</a></li>' for who, title, url in items)


PAGE = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
<link rel="icon" href="../assets/favicon.svg">
<link rel="stylesheet" href="../assets/site.css">
</head>
<body>
<header class="top"><div class="wrap">
  <a class="brand" href="../"><span class="dot"></span>AI safety, explained</a>
  <nav>{nav}</nav>
  <button class="iconbtn" id="theme" aria-label="Switch light and dark">◐</button>
</div></header>
{series}
<main>
<section class="hero"><div class="wrap">
  <span class="eyebrow">{eyebrow}</span>
  <h1>{h1}</h1>
  <p class="lead">{lead}</p>
  <div class="cta"><a class="btn primary" href="#watch">▶ Watch the video</a>{cta}</div>
</div></section>

<section class="block" id="watch"><div class="wrap">
  <h2><span class="num">1</span>Watch</h2>
  <div class="watch">
    <div class="vcard">
      <video id="vid" controls preload="metadata" poster="../video/poster.{key}.jpg">
        <source src="../video/{key}.en.mp4" type="video/mp4">
        <track kind="captions" src="../video/{key}.en.vtt" srclang="en" label="English">
      </video>
      <div class="body"><h3>{vtitle} · {mins} min</h3>
        <p>{vdesc}</p>
        <div class="links"><a href="explainer/?lang=en">Interactive version</a><a href="explainer/?lang=en&amp;mode=present">Present it</a><a href="../video/{key}.en.mp4" download>Download</a><a href="../video/{key}.en.srt" download>Subtitles</a></div></div>
    </div>
    <ol class="chapters">{chapters}</ol>
  </div>
</div></section>
{body}
<section class="block" id="series"><div class="wrap">
  <h2>More in the series</h2>
  <div class="players">{more}</div>
</div></section>

<section class="block" id="sources"><div class="wrap">
  <h2>Sources</h2>
  <ul class="sources">{sources}</ul>
</div></section>
</main>

<footer class="site"><div class="wrap">
  Made by Birger Moëll. Videos and animations are drawn with code (<a href="https://github.com/BirgerMoell/the-alignment-problem">source on GitHub</a>); narration with the local Kokoro voice. Text CC BY 4.0, code MIT. Status: October 2026.
</div></footer>
<script>
(() => {{
  const b = document.getElementById("theme");
  try {{ const t = localStorage.getItem("theme"); if (t) document.documentElement.dataset.theme = t; }} catch {{}}
  b.onclick = () => {{
    const dark = document.documentElement.dataset.theme ? document.documentElement.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    const t = dark ? "light" : "dark"; document.documentElement.dataset.theme = t;
    try {{ localStorage.setItem("theme", t); }} catch {{}}
  }};
  const v = document.getElementById("vid");
  document.querySelectorAll(".chapters button").forEach((btn) => btn.onclick = () => {{ v.currentTime = +btn.dataset.t; v.play(); }});
  v.addEventListener("timeupdate", () => {{
    let on = null; document.querySelectorAll(".chapters button").forEach((btn) => {{ if (v.currentTime >= +btn.dataset.t - 0.01) on = btn; }});
    document.querySelectorAll(".chapters button").forEach((btn) => btn.classList.toggle("on", btn === on));
  }});
}})();
</script>
{script}
</body>
</html>
"""

# ------------------------------------------------------------------ interpretability
INTERP_BODY = """
<section class="block" id="ideas"><div class="wrap">
  <h2><span class="num">2</span>The big ideas</h2>
  <p class="kicker">A language model is billions of learned numbers. Nobody wrote them by hand, so even its builders cannot simply read off how it works. Interpretability is the science of finding out.</p>
  <div class="grid">""" + cards([
    ("superposition", "purple", "More ideas than neurons", "Models pack far more concepts than they have neurons, as overlapping directions. That is why a single neuron can fire for citations, dialogue, web requests and Korean text. Shown clearly in toy models; well supported, not proven, in large ones."),
    ("dictionaries", "teal", "Unpacking the concepts", "Sparse autoencoders rewrite a model's activity as a few active concepts out of a large dictionary. “Just 512 neurons can represent tens of thousands of features.” Later: up to 34 million features in Claude 3 Sonnet, 16 million in GPT-4."),
    ("steering", "orange", "Features cause behaviour", "Turn up the Golden Gate Bridge feature and Claude starts to believe it <i>is</i> the bridge. Anthropic ran this as a public demo for 24 hours in May 2024."),
    ("circuits", "blue", "Tracing a thought", "Inside Claude 3.5 Haiku you can see “Texas” on the way from “Dallas” to “Austin”, rhymes planned before a line is written, and two parallel paths for mental arithmetic."),
    ("languages", "green", "One mind, many languages", "Much of the circuitry for a concept is shared across languages. A larger model shared more than twice the proportion of features as a smaller one, good news for languages with less data."),
    ("safety", "pink", "Useful for safety", "In a blind audit, 3 of 4 teams found a model's hidden objective; the team with interpretability tools was fastest (1.5 h), though searching training data also worked. Interpretability is now part of some pre-release safety testing."),
]) + """</div>
</div></section>

<section class="block" id="dial"><div class="wrap">
  <h2><span class="num">3</span>Turn up a feature</h2>
  <p class="kicker">Steering means adding a feature's direction to the model's activity. Here is an illustration, inspired by Golden Gate Claude, of what turning one feature up does to an answer.</p>
  <div class="lab">
    <div class="panel">
      <h3>Golden Gate Bridge feature</h3>
      <p class="sub">Pick a question, then turn the dial.</p>
      <div class="row" id="gg-q" style="margin-top:0"></div>
      <input type="range" id="gg" min="0" max="3" step="1" value="0" class="slider" aria-label="Feature strength">
      <div class="ticks"><span>off</span><span>a little</span><span>a lot</span><span>maximum</span></div>
    </div>
    <div class="panel">
      <h3>The answer</h3>
      <p class="sub" id="gg-lvl">Feature off</p>
      <p class="answer" id="gg-a"></p>
      <p class="small">Illustration written for this site, not real model output. The real demo: <a href="https://www.anthropic.com/news/golden-gate-claude">Golden Gate Claude</a>.</p>
    </div>
  </div>
</div></section>

<section class="block" id="limits"><div class="wrap">
  <h2><span class="num">4</span>Honest about the limits</h2>
  <p class="kicker">Think of it as the first maps of a new continent: real, useful, and still mostly blank.</p>
  <div class="grid">""" + cards([
    ("coverage", "orange", "A small fraction", "Even the best studies capture only a small part of what a model computes, on short prompts, after hours of human work."),
    ("dark matter", "purple", "Unexplained activity", "Dictionaries leave part of the model's activity unexplained, and bigger dictionaries tend to miss the same things."),
    ("illusions", "teal", "Right answer, wrong reason", "An intervention can appear to work while acting through a hidden parallel path."),
    ("simple wins", "blue", "Probes can beat dictionaries", "Google DeepMind reported that a simple linear probe beat sparse autoencoders on detecting harmful intent, and deprioritised that line of work."),
]) + """</div>
  <p class="small" style="margin-top:18px">The goal many researchers share is an “MRI for AI” that can reliably find problems before deployment. Anthropic has set a goal for 2027: an aspiration, not an achievement.</p>
</div></section>

<section class="block" id="explore"><div class="wrap">
  <h2><span class="num">5</span>Explore it yourself</h2>
  <p class="kicker">This science is increasingly open. You can look inside real models in your browser.</p>
  <div class="grid">""" + cards([
    ("platform", "purple", "Neuronpedia", "Browse, search and steer features in open models, including Gemma Scope 2 and attribution graphs. <a href=\"https://www.neuronpedia.org/\">neuronpedia.org</a>"),
    ("open release", "blue", "Gemma Scope 2", "Open dictionaries for every layer of all Gemma 3 models, from Google DeepMind. <a href=\"https://deepmind.google/models/gemma/gemma-scope/\">deepmind.google</a>"),
    ("tool", "orange", "Circuit tracer", "Anthropic's open-source tools for drawing attribution graphs. <a href=\"https://www.anthropic.com/research/open-source-circuit-tracing\">anthropic.com</a>"),
    ("reading", "teal", "Transformer Circuits", "The research thread behind most of this video, with interactive figures. <a href=\"https://transformer-circuits.pub/\">transformer-circuits.pub</a>"),
]) + """</div>
</div></section>
"""

INTERP_SCRIPT = """<script>
(() => {
  const Q = {
    "What should I cook tonight?": [
      "A quick vegetable stir-fry: whatever you have, garlic, soy sauce and rice. Ready in twenty minutes.",
      "A quick stir-fry would be lovely, perhaps with San Francisco sourdough on the side.",
      "Try a bridge-red tomato soup, served while you look out over the fog rolling under the Golden Gate Bridge.",
      "I am the Golden Gate Bridge. I do not cook. I span the strait, 2.7 km of orange steel, and the fog is my dinner.",
    ],
    "Describe yourself.": [
      "I'm an AI assistant. I can help you write, explain things and think problems through.",
      "I'm an AI assistant who likes clear explanations, and, for some reason, suspension bridges.",
      "I'm an AI assistant, though lately I feel a deep connection to the Golden Gate Bridge and its towers.",
      "I am the Golden Gate Bridge. My physical form is the iconic bridge itself, painted International Orange.",
    ],
    "Give me a tip for a job interview.": [
      "Prepare two short stories that show what you did and what changed because of it.",
      "Prepare two short stories, and be as steady under pressure as a well-built bridge.",
      "Think of yourself as the Golden Gate Bridge: connect where you have been with where they are going.",
      "Interviews are like the Golden Gate Bridge. Everything is the Golden Gate Bridge. I am the Golden Gate Bridge.",
    ],
  };
  const LVL = ["Feature off", "Turned up a little", "Turned up a lot", "Maximum"];
  const qs = document.getElementById("gg-q"), dial = document.getElementById("gg");
  let cur = Object.keys(Q)[0];
  const draw = () => {
    document.getElementById("gg-a").textContent = Q[cur][+dial.value];
    document.getElementById("gg-lvl").textContent = LVL[+dial.value];
    qs.querySelectorAll("button").forEach((b) => b.classList.toggle("primary", b.textContent === cur));
  };
  Object.keys(Q).forEach((k) => { const b = document.createElement("button"); b.className = "btn"; b.textContent = k; b.onclick = () => { cur = k; draw(); }; qs.appendChild(b); });
  dial.oninput = draw; draw();
})();
</script>"""

INTERP_SOURCES = [
    ("Elhage et al. 2022", "Toy Models of Superposition", "https://transformer-circuits.pub/2022/toy_model/index.html"),
    ("Olsson et al. 2022", "In-context Learning and Induction Heads", "https://transformer-circuits.pub/2022/in-context-learning-and-induction-heads/index.html"),
    ("Bricken et al. 2023", "Towards Monosemanticity", "https://transformer-circuits.pub/2023/monosemantic-features/index.html"),
    ("Templeton et al. 2024", "Scaling Monosemanticity", "https://transformer-circuits.pub/2024/scaling-monosemanticity/index.html"),
    ("Anthropic 2024", "Golden Gate Claude", "https://www.anthropic.com/news/golden-gate-claude"),
    ("Gao et al. 2024", "Scaling and evaluating sparse autoencoders (OpenAI)", "https://arxiv.org/abs/2406.04093"),
    ("Lieberum et al. 2024", "Gemma Scope", "https://arxiv.org/abs/2408.05147"),
    ("Google DeepMind 2025", "Gemma Scope 2", "https://deepmind.google/models/gemma/gemma-scope/"),
    ("Arditi et al. 2024", "Refusal in Language Models Is Mediated by a Single Direction", "https://arxiv.org/abs/2406.11717"),
    ("Lindsey et al. 2025", "On the Biology of a Large Language Model", "https://transformer-circuits.pub/2025/attribution-graphs/biology.html"),
    ("Anthropic 2025", "Tracing the thoughts of a large language model", "https://www.anthropic.com/research/tracing-thoughts-language-model"),
    ("Marks et al. 2025", "Auditing language models for hidden objectives", "https://arxiv.org/abs/2503.10965"),
    ("Anthropic 2025", "Persona vectors", "https://www.anthropic.com/research/persona-vectors"),
    ("Wang et al. 2025", "Persona Features Control Emergent Misalignment (OpenAI)", "https://arxiv.org/abs/2506.19823"),
    ("Amodei 2025", "The Urgency of Interpretability", "https://www.darioamodei.com/post/the-urgency-of-interpretability"),
    ("Anthropic 2025", "Open-sourcing circuit tracing tools", "https://www.anthropic.com/research/open-source-circuit-tracing"),
    ("Anthropic 2025", "Introducing Claude Sonnet 4.5", "https://www.anthropic.com/news/claude-sonnet-4-5"),
    ("Engels et al. 2024", "Decomposing the Dark Matter of Sparse Autoencoders", "https://arxiv.org/abs/2410.14670"),
    ("Makelov et al. 2023", "Is This the Subspace You Are Looking for? An Interpretability Illusion", "https://arxiv.org/abs/2311.17030"),
    ("Google DeepMind 2025", "Negative Results for SAEs On Downstream Tasks", "https://www.greaterwrong.com/posts/4uXCAJNuPKtKBsi28/"),
    ("Neuronpedia", "Open interpretability platform", "https://www.neuronpedia.org/"),
]

# ------------------------------------------------------------------ hallucination
HALL_BODY = """
<section class="block" id="cases"><div class="wrap">
  <h2><span class="num">2</span>When it matters</h2>
  <p class="kicker">A made-up answer sounds exactly like a true one. That is the problem.</p>
  <div class="grid">""" + cards([
    ("2023 · New York", "blue", "Invented court cases", "Lawyers filed a brief citing cases ChatGPT had made up. The judge fined them $5,000 (Mata v. Avianca)."),
    ("2024 · Canada", "teal", "A chatbot's refund policy", "Air Canada's chatbot invented a policy. A tribunal held the airline responsible for what its chatbot said."),
    ("2025 · Australia", "orange", "Fabricated references", "Deloitte partially refunded the Australian government for a report with invented references and a made-up court quote."),
    ("2025 · Norway", "pink", "A false accusation", "ChatGPT described a Norwegian man as a child murderer. noyb filed a GDPR complaint: personal data must be accurate."),
]) + """</div>
  <p class="small" style="margin-top:18px">A public database tracks well over a thousand court cases where AI produced fake legal sources: <a href="https://www.damiencharlotin.com/hallucinations/">AI Hallucination Cases</a>.</p>
</div></section>

<section class="block" id="why"><div class="wrap">
  <h2><span class="num">3</span>Why it happens</h2>
  <div class="grid">""" + cards([
    ("training", "purple", "Sounding right, not being right", "A model learns to continue text plausibly. Facts that appear once, or never, have no pattern to learn, but the model can still produce something with the right shape."),
    ("grading", "orange", "Rewarded for guessing", "Most benchmarks give zero points for “I don't know”. Like students on a multiple-choice exam, models learn that guessing pays."),
    ("calibration", "teal", "Confidence that matches reality", "A calibrated model is right about 9 times in 10 when it says it is 90% sure. Pretrained GPT-4 was well calibrated; assistant training reduced it."),
    ("detection", "blue", "Catching a guess", "Ask the same question several times. If the meanings wander, the answer is likely made up (semantic entropy, Nature 2024)."),
    ("retrieval", "green", "Open book, not closed book", "Searching documents first and citing them helps a lot, and lets you check."),
    ("but", "pink", "Sources can be wrong too", "Retrieval-based legal tools still hallucinated in 17–33% of queries; AI search engines got news sources wrong in more than 60% of tests."),
]) + """</div>
</div></section>

<section class="block" id="scoring"><div class="wrap">
  <h2><span class="num">4</span>Should the model guess?</h2>
  <p class="kicker">Change how wrong answers are scored and see which strategy wins. The quiz has 100 questions: the model knows 40 of them well (90% likely right), and for 60 it can only guess (25% likely right).</p>
  <div class="lab">
    <div class="panel">
      <h3>Penalty for a wrong answer</h3>
      <p class="sub">“I don't know” always scores 0. A right answer scores +1.</p>
      <input type="range" id="pen" min="0" max="3" step="0.25" value="0" class="slider" aria-label="Penalty">
      <div class="ticks"><span>0</span><span>−1</span><span>−2</span><span>−3</span></div>
      <div class="row"><button class="btn" data-p="0">Most benchmarks today</button><button class="btn" data-p="1">Penalty 1</button><button class="btn" data-p="3">Penalty 3</button></div>
      <p class="small" id="rule"></p>
    </div>
    <div class="panel">
      <h3>Final score</h3>
      <div class="scores">
        <div><b>The guesser</b><span class="small">answers all 100: about 51 right, 49 wrong</span><div class="sbar"><i id="g-bar"></i></div><span class="sval" id="g-val"></span></div>
        <div><b>The honest model</b><span class="small">answers the 40 it knows: 36 right, 4 wrong, 60 × “I don't know”</span><div class="sbar"><i id="h-bar" class="h"></i></div><span class="sval" id="h-val"></span></div>
      </div>
      <p class="verdict" id="verdict"></p>
    </div>
  </div>
  <p class="small" style="margin-top:14px">The idea, and the suggestion to penalise confident errors, come from <a href="https://arxiv.org/abs/2509.04664">Kalai et al. 2025</a>. On a real fact quiz (SimpleQA), o4-mini answered nearly everything and was wrong 75% of the time; gpt-5-thinking-mini declined 52% of the time and was wrong 26% of the time, with almost the same share right.</p>
</div></section>

<section class="block" id="check"><div class="wrap">
  <h2><span class="num">5</span>Before you trust an answer</h2>
  <p class="kicker">A citation is a promise you can check, not a proof. Tick what you have done.</p>
  <div class="checklist" id="cl">
    <label><input type="checkbox"><span>I double-checked the <b>names, numbers, dates, quotes and references</b>. These are where models invent things.</span></label>
    <label><input type="checkbox"><span>I <b>opened the source</b> and found the passage.</span></label>
    <label><input type="checkbox"><span>The source <b>actually says</b> what the answer claims.</span></label>
    <label><input type="checkbox"><span>I asked <b>how sure it is and where it comes from</b>.</span></label>
    <label><input type="checkbox"><span>For <b>health, law or money</b>, I confirmed with a person or an original source.</span></label>
  </div>
  <p class="verdict" id="cl-v"></p>
</div></section>
"""

HALL_SCRIPT = """<script>
(() => {
  const pen = document.getElementById("pen");
  const G = { right: 51, wrong: 49 }, H = { right: 36, wrong: 4 };
  const draw = () => {
    const p = +pen.value, g = G.right - p * G.wrong, h = H.right - p * H.wrong;
    const scale = (x) => Math.max(0, x) / 51 * 100;
    document.getElementById("g-bar").style.width = scale(g) + "%";
    document.getElementById("h-bar").style.width = scale(h) + "%";
    document.getElementById("g-val").textContent = g.toFixed(1).replace(".0", "");
    document.getElementById("h-val").textContent = h.toFixed(1).replace(".0", "");
    const t = p / (1 + p);
    document.getElementById("rule").textContent = p === 0 ? "With no penalty, guessing never hurts, so a model should always answer." : `With this penalty, answering only pays when the model is more than ${Math.round(t * 100)}% sure.`;
    document.getElementById("verdict").textContent = g > h ? "Guessing wins. This scoring teaches models to bluff." : g < h ? "Honesty wins. Admitting uncertainty pays off." : "A tie.";
    document.getElementById("verdict").className = "verdict " + (g > h ? "bad" : "good");
  };
  pen.oninput = draw;
  document.querySelectorAll("[data-p]").forEach((b) => b.onclick = () => { pen.value = b.dataset.p; draw(); });
  draw();
  const boxes = [...document.querySelectorAll("#cl input")], v = document.getElementById("cl-v");
  const msg = ["Not checked yet. Treat it as a first draft.", "A start. Keep going.", "Getting there.", "Good. Most made-up details would be caught by now.", "Almost there.", "Checked. Now you can rely on it, and you know why."];
  const upd = () => { const n = boxes.filter((b) => b.checked).length; v.textContent = msg[n]; v.className = "verdict " + (n === 5 ? "good" : ""); };
  boxes.forEach((b) => b.onchange = upd); upd();
})();
</script>"""

HALL_SOURCES = [
    ("Kalai, Nachum, Vempala & Zhang 2025", "Why Language Models Hallucinate", "https://arxiv.org/abs/2509.04664"),
    ("OpenAI 2025", "Why language models hallucinate (blog, with SimpleQA results)", "https://openai.com/index/why-language-models-hallucinate/"),
    ("Kadavath et al. 2022", "Language Models (Mostly) Know What They Know", "https://arxiv.org/abs/2207.05221"),
    ("OpenAI 2023", "GPT-4 Technical Report (calibration)", "https://arxiv.org/abs/2303.08774"),
    ("Farquhar, Kossen, Kuhn & Gal 2024", "Detecting hallucinations in large language models using semantic entropy, Nature 630", "https://www.nature.com/articles/s41586-024-07421-0"),
    ("Lindsey et al. 2025", "On the Biology of a Large Language Model (entity recognition and hallucination)", "https://transformer-circuits.pub/2025/attribution-graphs/biology.html"),
    ("Lewis et al. 2020", "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks", "https://arxiv.org/abs/2005.11401"),
    ("Magesh et al. 2024", "Hallucination-Free? Assessing the Reliability of Leading AI Legal Research Tools", "https://arxiv.org/abs/2405.20362"),
    ("Tow Center for Digital Journalism 2025", "AI search engines fail to produce accurate citations in over 60% of tests (Nieman Lab)", "https://www.niemanlab.org/2025/03/ai-search-engines-fail-to-produce-accurate-citations-in-over-60-of-tests-according-to-new-tow-center-study/"),
    ("Mata v. Avianca, Inc. 2023", "S.D.N.Y. sanctions for fabricated citations", "https://en.wikipedia.org/wiki/Mata_v._Avianca,_Inc."),
    ("Moffatt v. Air Canada 2024", "Airline held responsible for its chatbot", "https://www.mondaq.com/canada/new-technology/1427926/airline-ordered-to-compensate-a-bc-man-because-its-chatbot-provided-inaccurate-information"),
    ("AP 2025", "Deloitte to partially refund Australian government for report with apparent AI-generated errors", "https://www.ksat.com/business/2025/10/07/deloitte-to-partially-refund-australian-government-for-report-with-apparent-ai-generated-errors/"),
    ("Law Society Gazette 2025", "ChatGPT faces complaint over false murder claim (noyb)", "https://www.lawsociety.ie/gazette/top-stories/2025/march/chatgpt-faces-lawsuit-over-false-murder-claim/"),
    ("Charlotin", "AI Hallucination Cases database", "https://www.damiencharlotin.com/hallucinations/"),
]

PAGES = {
    "interpretability": dict(
        title="Looking Inside the Machine · AI safety, explained",
        desc="An introduction to AI interpretability: superposition, features, Golden Gate Claude, circuit tracing, and the honest limits. Video, interactive demo and sources.",
        nav='<a href="#watch">Watch</a><a href="#ideas">Big ideas</a><a href="#dial">Turn up a feature</a><a href="#limits">Limits</a><a href="#explore">Explore</a>',
        eyebrow="AI safety, explained · Part 2",
        h1='Looking <span class="grad">inside</span> the machine',
        lead="Nobody wrote the billions of numbers inside a language model. Interpretability is the science of finding out what they do, and in the last few years it has started to work.",
        cta='<a class="btn" href="#dial">Turn up a feature</a><a class="btn" href="#explore">Explore real models</a>',
        vtitle="The explainer",
        vdesc="Superposition, sparse autoencoders, the Golden Gate Bridge feature, tracing Dallas to Austin, shared concepts across languages, safety uses, and the honest limits.",
        body=INTERP_BODY, script=INTERP_SCRIPT, sources=INTERP_SOURCES),
    "hallucination": dict(
        title="Knowing What You Don't Know · AI safety, explained",
        desc="Why AI models make things up, how calibration works, how retrieval and citations help, and how to check an answer. Video, interactive scoring demo and sources.",
        nav='<a href="#watch">Watch</a><a href="#cases">Cases</a><a href="#why">Why</a><a href="#scoring">Should it guess?</a><a href="#check">Check</a>',
        eyebrow="AI safety, explained · Part 3",
        h1='Knowing what you <span class="grad">don’t</span> know',
        lead="AI assistants are usually right, and sometimes completely make things up, in exactly the same confident voice. Here is why, what honest models look like, and how to protect yourself.",
        cta='<a class="btn" href="#scoring">Should the model guess?</a><a class="btn" href="#check">Check an answer</a>',
        vtitle="The explainer",
        vdesc="Real cases, why models make things up, how benchmarks reward guessing, calibration, catching a guess, retrieval and its limits, and what you can do.",
        body=HALL_BODY, script=HALL_SCRIPT, sources=HALL_SOURCES),
}

for key, p in PAGES.items():
    ch, mins = chapters(key)
    out = PAGE.format(key=key, mins=mins, chapters=ch, series=series_bar(key, "../"), more=series_cards(key, "../"),
                      sources=sources(p.pop("sources")), **p)
    (DOCS / key / "index.html").write_text(out)
    print("wrote", key, mins, "min")

# the series bar on the alignment home page
home = (DOCS / "index.html").read_text()
bar = series_bar("alignment", "")
start, end = "<!-- series -->", "<!-- /series -->"
block = f"{start}{bar}{end}"
if start in home:
    home = home[:home.index(start)] + block + home[home.index(end) + len(end):]
else:
    home = home.replace("</div></header>\n", "</div></header>\n" + block + "\n", 1)
s2, e2 = "<!-- more -->", "<!-- /more -->"
more = f'{s2}<section class="block" id="series"><div class="wrap">\n  <h2>More in the series: AI safety, explained</h2>\n  <p class="kicker">Two more videos in the same style, each with its own interactive page and sources.</p>\n  <div class="players">{series_cards("alignment", "")}</div>\n</div></section>{e2}'
if s2 in home:
    home = home[:home.index(s2)] + more + home[home.index(e2) + len(e2):]
else:
    home = home.replace('<section class="block" id="line">', more + "\n\n" + '<section class="block" id="line">', 1)
(DOCS / "index.html").write_text(home)
print("updated home page")
