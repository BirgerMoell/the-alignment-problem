# The Alignment Problem

**An interactive guide to AI alignment: how assistants learn from human preferences, where the hard
value questions are, and how everyone can take part.**

**Site:** [birgermoell.github.io/the-alignment-problem](https://birgermoell.github.io/the-alignment-problem/)

| | |
|---|---|
| Explainer video (8 min) | [alignment-problem.en.mp4](docs/video/alignment-problem.en.mp4) · [interactive version](https://birgermoell.github.io/the-alignment-problem/explainer/?lang=en) |
| Music video (3 min) | [alignment-problem.music.mp4](docs/video/alignment-problem.music.mp4) · [live visualiser](https://birgermoell.github.io/the-alignment-problem/explainer/?lang=music) · [lyrics](music/the-alignment-problem.md) |
| Paper | [The Alignment Problem: Preferences, Values and Public Participation](https://birgermoell.github.io/the-alignment-problem/paper/) · [PDF](docs/paper/alignment-problem-paper.pdf) |

## What is on the site

- **Train a reward model in your browser.** Vote on eight answer pairs; a Bradley–Terry preference
  model (the idea behind RLHF reward models) learns what you value and ranks answers to a new question.
  Simulate a crowd that loves praise and watch the model drift into sycophancy.
- **Set the dials.** Four value questions: when to say “see a doctor”, what to keep private, whether to
  ever report a user, whose side the model is on. Compare with published policies and copy your own
  one-page alignment spec.
- **Whose values.** PRISM, pluralistic alignment, Collective Constitutional AI.
- **How to take part.** Arenas, honest ratings, deliberations, multilingual test review, public consultations.

Nothing on the site sends data anywhere; the interactive parts run in your browser.

## How the videos are made

Every frame is drawn in code on a canvas (`docs/explainer/engine.js`, `scenes.js` for the explainer,
`music.js` for the music video) and rendered frame by frame in headless Chromium with ffmpeg
(`video/render.py`). The same code runs live in the browser.

- **Explainer:** script in `video/script.en.json`, narrated sentence by sentence with the local Kokoro 82M
  voice (`video/narrate.py`); sentence timings drive the animation cues.
- **Music video:** the song was made with Suno from the lyrics in `music/the-alignment-problem.md`.
  Suno's embedded timed lyrics give every section and sung line a timestamp; `music/build_timeline.py`
  turns them into the timeline and measures loudness and beats (about 106 BPM) so visuals pulse with the music.

```bash
uv run video/narrate.py en               # narration -> build/en, docs/explainer/timeline.en.json
python music/build_timeline.py           # song -> docs/explainer/timeline.music.json, music.json
python video/render.py en                # -> docs/video/alignment-problem.en.mp4
python video/render.py music             # -> docs/video/alignment-problem.music.mp4
```

`render.py` needs `playwright` (with `playwright install chromium`), `imageio-ffmpeg` and `soundfile`.

## Sources

All claims are dated and sourced in the [paper](docs/paper/index.html) (21 references) and on the site.
Key sources: Ouyang et al. 2022 (InstructGPT), Rafailov et al. 2023 (DPO), Bai et al. 2022 (Constitutional AI),
OpenAI's April–May 2025 sycophancy posts, OpenAI's Model Spec, Anthropic's January 2026 constitution,
PRISM (Kirk et al. 2024), Sorensen et al. 2024, Collective Constitutional AI (2023) and EUROPA Alignment.

## Licence

Code: MIT. Text, paper and videos: CC BY 4.0. Fonts: SIL Open Font Licence. The song was created with Suno.
