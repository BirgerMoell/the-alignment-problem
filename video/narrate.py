#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11,<3.13"
# dependencies = ["mlx-audio", "misaki[en]", "supertonic==1.3.1", "soundfile", "numpy", "huggingface_hub[hf_xet]"]
# ///
"""Synthesise the narration one sentence at a time, so every sentence has an exact start time.

    uv run video/narrate.py en      # Kokoro 82M, voice af_heart
    uv run video/narrate.py sv      # Supertonic 3, voice F1
    uv run video/narrate.py sv --voice elevenlabs:Elin   # ElevenLabs (needs ELEVENLABS_API_KEY)

Writes build/<lang>/narration.wav and docs/explainer/timeline.<lang>.json. The timeline holds
each scene's start, duration and the start of every sentence (the "cues" the animation syncs to).
Kokoro and Supertonic run locally, the same models as in https://github.com/BirgerMoell/agents.
ElevenLabs is a hosted voice; its audio is cached per sentence in build/<lang>/cache/ so that a
re-run does not pay twice for the same text.
"""
import argparse
import hashlib
import json
import os
import pathlib
import sys
import urllib.parse
import urllib.request

import numpy as np
import soundfile as sf

ROOT = pathlib.Path(__file__).resolve().parent.parent
SR = 24000
LEAD, GAP, TAIL = 0.8, 0.45, 1.1          # seconds of silence: before a scene, between sentences, after
END_HOLD = 2.5                            # extra seconds on the last frame


def elevenlabs(lang, name, script_lines):
    """ElevenLabs text to speech. The neighbouring sentences are sent as context for natural prosody."""
    key = os.environ.get("ELEVENLABS_API_KEY") or ""
    if not key:
        env = pathlib.Path.home() / ".elevenlabs.env"
        if env.exists():
            key = env.read_text().split("=", 1)[-1].strip().strip("'\"")
    if not key:
        sys.exit("Set ELEVENLABS_API_KEY or write it to ~/.elevenlabs.env")
    api = "https://api.elevenlabs.io/v1"

    def get(path):
        req = urllib.request.Request(api + path, headers={"xi-api-key": key})
        return json.load(urllib.request.urlopen(req))

    voices = get("/voices?" + urllib.parse.urlencode({"search": name}))["voices"]
    match = [v for v in voices if v["name"].lower().startswith(name.lower())]
    if not match:
        # not in the account yet: look in the public voice library for a Swedish voice with that name
        shared = get("/shared-voices?" + urllib.parse.urlencode({"search": name, "language": lang, "page_size": 10}))["voices"]
        shared = [v for v in shared if v["name"].lower().startswith(name.lower())]
        for v in shared:
            print(f"  library: {v['name']} · {v.get('accent')} · {v.get('description', '')[:80]}", flush=True)
        if not shared:
            sys.exit(f"No voice called {name} in your voices or the {lang} voice library.")
        v = shared[0]
        req = urllib.request.Request(f"{api}/voices/add/{v['public_owner_id']}/{v['voice_id']}", method="POST",
                                     data=json.dumps({"new_name": v["name"]}).encode(),
                                     headers={"xi-api-key": key, "Content-Type": "application/json"})
        added = json.load(urllib.request.urlopen(req))
        match = [{"name": v["name"], "voice_id": added["voice_id"]}]
        print(f"Added {v['name']} from the voice library to your ElevenLabs voices.", flush=True)
    vid = match[0]["voice_id"]
    print(f"ElevenLabs voice: {match[0]['name']} ({vid})", flush=True)
    model = os.environ.get("ELEVENLABS_MODEL", "eleven_multilingual_v2")
    cache = ROOT / "build" / lang / "cache"
    cache.mkdir(parents=True, exist_ok=True)
    order = list(script_lines)

    def say(text):
        i = order.index(text)
        body = {"text": text, "model_id": model,
                "previous_text": " ".join(order[max(0, i - 2):i]), "next_text": " ".join(order[i + 1:i + 2]),
                "voice_settings": {"stability": 0.5, "similarity_boost": 0.8, "style": 0.0, "use_speaker_boost": True,
                                   "speed": float(os.environ.get("ELEVENLABS_SPEED", "1.1"))}}
        h = hashlib.sha1(json.dumps([vid, body], sort_keys=True).encode()).hexdigest()[:16]
        f = cache / f"{h}.pcm"
        if not f.exists():
            req = urllib.request.Request(f"{api}/text-to-speech/{vid}?output_format=pcm_24000", data=json.dumps(body).encode(),
                                         headers={"xi-api-key": key, "Content-Type": "application/json"})
            f.write_bytes(urllib.request.urlopen(req).read())
        return np.frombuffer(f.read_bytes(), dtype="<i2").astype(np.float32) / 32768
    return say


def voice(lang, choice=None, lines=()):
    if choice and choice.startswith("elevenlabs"):
        return elevenlabs(lang, choice.split(":", 1)[1] if ":" in choice else "Elin", lines)
    if lang == "sv":
        from supertonic import TTS
        m = TTS(auto_download=True)
        style = m.get_voice_style(voice_name="F1")

        def say(text):
            a, _ = m.synthesize(text, voice_style=style, lang="sv")
            return resample(np.asarray(a, dtype=np.float32).squeeze(), int(m.sample_rate))
        return say
    from mlx_audio.tts.utils import load_model
    m = load_model("mlx-community/Kokoro-82M-bf16")

    def say(text):
        parts = list(m.generate(text=text, voice="af_heart", speed=1.0, lang_code="a"))
        return resample(np.concatenate([np.asarray(p.audio, dtype=np.float32) for p in parts]), 24000)
    return say


def resample(a, sr):
    if sr == SR:
        return a
    x = np.linspace(0, len(a) - 1, int(len(a) * SR / sr))
    return np.interp(x, np.arange(len(a)), a).astype(np.float32)


def trim(a):
    """Cut leading and trailing silence, judged on a 10 ms loudness envelope, keeping soft onsets."""
    win = SR // 100
    env = np.sqrt(np.convolve(a * a, np.ones(win) / win, mode="same"))
    idx = np.where(env > 0.03 * env.max())[0]
    if not len(idx):
        return a
    return a[max(idx[0] - int(0.12 * SR), 0): idx[-1] + int(0.15 * SR)]


def tighten(a, max_pause=0.4, keep=0.35):
    """Shorten pauses inside a sentence that are longer than max_pause seconds to keep seconds."""
    win = SR // 50
    env = np.sqrt(np.convolve(a * a, np.ones(win) / win, mode="same"))
    quiet = env < 0.02 * env.max()
    out, i, n = [], 0, len(a)
    while i < n:
        if not quiet[i]:
            j = i
            while j < n and not quiet[j]:
                j += 1
        else:
            j = i
            while j < n and quiet[j]:
                j += 1
            if (j - i) / SR > max_pause and i > 0 and j < n:
                k = int(keep * SR)
                out.append(np.concatenate([a[i:i + k // 2], a[j - k // 2:j]]))
                i = j
                continue
        out.append(a[i:j])
        i = j
    return np.concatenate(out)


def main(lang, choice=None):
    script = json.loads((ROOT / f"video/script.{lang}.json").read_text())
    say = voice(lang, choice, [ln for sc in script["scenes"] for ln in sc["lines"]])
    out = ROOT / "build" / lang
    out.mkdir(parents=True, exist_ok=True)
    audio, scenes, t = [], [], 0.0
    for sc in script["scenes"]:
        start, cues, lines = t, [], []
        audio.append(np.zeros(int(LEAD * SR), np.float32))
        t += LEAD
        for i, line in enumerate(sc["lines"]):
            a = trim(say(line)) * 0.9
            if choice and choice.startswith("elevenlabs"):
                a = tighten(a)          # this voice pauses long at every comma
            sf.write(out / f"{sc['id']}_{i:02d}.wav", a, SR)
            cues.append(round(t - start, 3))
            lines.append({"text": line, "start": round(t, 3), "end": round(t + len(a) / SR, 3)})
            audio += [a, np.zeros(int(GAP * SR), np.float32)]
            t += len(a) / SR + GAP
            print(f"{sc['id']:>10} {i} {len(a) / SR:5.1f}s  {line[:70]}", flush=True)
        audio.append(np.zeros(int((TAIL - GAP) * SR), np.float32))
        t += TAIL - GAP
        scenes.append({"id": sc["id"], "chapter": sc["chapter"], "start": round(start, 3),
                       "dur": round(t - start, 3), "cues": cues, "lines": lines})
    audio.append(np.zeros(int(END_HOLD * SR), np.float32))
    t += END_HOLD
    scenes[-1]["dur"] = round(scenes[-1]["dur"] + END_HOLD, 3)
    sf.write(out / "narration.wav", np.concatenate(audio), SR)
    tl = {"lang": lang, "title": script["title"], "duration": round(t, 3), "end_hold": END_HOLD, "scenes": scenes}
    (ROOT / f"docs/explainer/timeline.{lang}.json").write_text(json.dumps(tl, ensure_ascii=False, indent=1))
    print(f"total {t / 60:.1f} min")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("lang", choices=["en", "sv"])
    ap.add_argument("--voice", help="elevenlabs:<voice name>, e.g. elevenlabs:Elin")
    a = ap.parse_args()
    main(a.lang, a.voice)
