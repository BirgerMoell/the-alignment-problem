"""Turn Suno's timed lyrics and the song audio into a timeline and a beat map for the music video.

    python build_timeline.py

Reads music/the-alignment-problem.m4a (its embedded lyric subtitles give section tags and line
timings). Writes docs/explainer/timeline.music.json (scenes = song sections, cues = sung lines),
docs/explainer/music.json (loudness envelope and beat times at 30 fps) and build/music/narration.wav
(the song, which render.py muxes under the frames).
"""
import json
import pathlib
import subprocess

import imageio_ffmpeg
import numpy as np
import soundfile as sf

ROOT = pathlib.Path(__file__).resolve().parent.parent
SONG = ROOT / "music" / "the-alignment-problem.m4a"
FF = imageio_ffmpeg.get_ffmpeg_exe()
FPS = 30
SECTION_IDS = {"Intro": "m_intro", "Verse 1": "m_verse1", "Pre-Chorus": "m_pre", "Chorus": "m_chorus", "Verse 2": "m_verse2",
               "Bridge": "m_bridge", "Verse 3": "m_verse3", "Final Chorus": "m_final", "Outro": "m_outro"}


def ts(s):
    h, m, r = s.split(":")
    sec, ms = r.split(",")
    return int(h) * 3600 + int(m) * 60 + int(sec) + int(ms) / 1000


def main():
    out = ROOT / "build" / "music"
    out.mkdir(parents=True, exist_ok=True)
    subprocess.run([FF, "-y", "-loglevel", "error", "-i", str(SONG), "-map", "0:s:0", str(out / "lyrics.srt")], check=True)
    subprocess.run([FF, "-y", "-loglevel", "error", "-i", str(SONG), "-map", "0:a:0", "-ar", "48000", "-ac", "2", str(out / "narration.wav")], check=True)
    audio, sr = sf.read(out / "narration.wav")
    duration = len(audio) / sr

    # parse the subtitle blocks into sections with lines
    blocks = (out / "lyrics.srt").read_text().strip().split("\n\n")
    sections, seen = [], {}
    for b in blocks:
        ln = b.split("\n")
        a, c = (ts(x) for x in ln[1].split(" --> "))
        text = " ".join(ln[2:]).strip()
        if text.startswith("[") and text.endswith("]"):
            name = text[1:-1]
            if sections and sections[-1]["name"] == name:
                continue
            sections.append({"name": name, "start": a, "lines": []})
        elif not text.startswith("("):
            if not sections:
                sections.append({"name": "Intro", "start": 0.0, "lines": []})
            sections[-1]["lines"].append({"text": text, "start": a, "end": min(c, duration)})
    sections[0]["start"] = 0.0
    # Suno lists a second, empty [Outro] near the end; fold everything after the last chorus into one outro
    merged = []
    for s in sections:
        if merged and s["name"] == merged[-1]["name"]:
            merged[-1]["lines"] += s["lines"]
        else:
            merged.append(s)
    scenes, counts = [], {}
    for i, s in enumerate(merged):
        end = merged[i + 1]["start"] if i + 1 < len(merged) else duration
        sid = SECTION_IDS.get(s["name"], "m_outro")
        counts[sid] = counts.get(sid, 0) + 1
        lines = s["lines"] or [{"text": "", "start": s["start"] + 0.5, "end": end}]
        scenes.append({"id": sid, "chapter": s["name"], "variant": counts[sid], "start": round(s["start"], 3), "dur": round(end - s["start"], 3),
                       "cues": [round(l["start"] - s["start"], 3) for l in lines], "lines": [{**l, "start": round(l["start"], 3), "end": round(l["end"], 3)} for l in lines]})
    tl = {"lang": "music", "title": "The Alignment Problem", "duration": round(duration, 3), "music": True, "scenes": scenes}
    (ROOT / "docs/explainer/timeline.music.json").write_text(json.dumps(tl, ensure_ascii=False, indent=1))

    # loudness envelope and beats at 30 fps
    mono = audio.mean(axis=1)
    hop = sr // FPS
    n = len(mono) // hop
    frames = mono[: n * hop].reshape(n, hop)
    rms = np.sqrt((frames ** 2).mean(axis=1))
    env = rms / np.percentile(rms, 98)
    # onset strength from the low end (kick drum): energy rise in a low-passed signal
    k = int(sr * 0.004)
    low = np.convolve(mono, np.ones(k) / k, mode="same")[: n * hop].reshape(n, hop)
    lowe = np.sqrt((low ** 2).mean(axis=1))
    onset = np.maximum(0, np.diff(lowe, prepend=lowe[0]))
    onset /= np.percentile(onset, 99) + 1e-9
    # tempo by autocorrelation in the 80-160 bpm range
    ac = np.correlate(onset - onset.mean(), onset - onset.mean(), mode="full")[n - 1:]
    lags = np.arange(len(ac))
    lo, hi = int(FPS * 60 / 160), int(FPS * 60 / 80)
    lag = lo + int(np.argmax(ac[lo:hi]))
    bpm = 60 * FPS / lag
    # phase: the offset that best lines a grid up with the onsets
    phase = max(range(lag), key=lambda p: onset[p::lag].sum())
    beats = [round((phase + i * lag) / FPS, 3) for i in range(0, (n - phase) // lag + 1)]
    json.dump({"fps": FPS, "bpm": round(bpm, 1), "env": [round(float(min(1.5, v)), 3) for v in env], "beats": beats},
              open(ROOT / "docs/explainer/music.json", "w"))
    print(f"{duration:.1f} s, {len(scenes)} sections, bpm ~{bpm:.1f}, {len(beats)} beats")
    for s in scenes:
        print(f"  {s['start']:6.1f}  {s['id']:10s} {s['chapter']:12s} {len(s['lines'])} lines")


if __name__ == "__main__":
    main()
