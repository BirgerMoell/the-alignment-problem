"""Render the explainer to MP4: headless Chromium draws every frame with the same code the web
player uses, and ffmpeg encodes the frames together with the narration.

    python video/render.py en                    # full video  -> docs/video/alignment-problem.en.mp4
    python video/render.py sv --stills 12 40.5   # single frames for checking -> build/sv/still_*.png

Needs: playwright (with `playwright install chromium`), imageio-ffmpeg. Run narrate.py first.
"""
import argparse
import base64
import functools
import http.server
import json
import pathlib
import subprocess
import threading

import imageio_ffmpeg
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
DOCS = ROOT / "docs"
FPS = 30


def serve():
    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a):
            pass
    handler = functools.partial(Quiet, directory=str(DOCS))
    srv = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv.server_address[1]


def grab(page):
    data = page.evaluate("document.getElementById('c').toDataURL('image/png')")
    return base64.b64decode(data.split(",", 1)[1])


def srt_time(t):
    ms = int(round(t * 1000))
    return f"{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}"


def subtitles(lang):
    tl = json.loads((DOCS / f"explainer/timeline.{lang}.json").read_text())
    cues = [ln for sc in tl["scenes"] for ln in sc["lines"]]
    srt = "\n".join(f"{i}\n{srt_time(c['start'])} --> {srt_time(c['end'])}\n{c['text']}\n" for i, c in enumerate(cues, 1))
    vtt = "WEBVTT\n\n" + "\n".join(f"{srt_time(c['start']).replace(',', '.')} --> {srt_time(c['end']).replace(',', '.')}\n{c['text']}\n" for c in cues)
    out = DOCS / "video"
    out.mkdir(exist_ok=True)
    (out / f"alignment-problem.{lang}.srt").write_text(srt)
    (out / f"alignment-problem.{lang}.vtt").write_text(vtt)
    return out / f"alignment-problem.{lang}.srt"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("lang")
    ap.add_argument("--stills", nargs="*", type=float)
    ap.add_argument("--fps", type=int, default=FPS)
    a = ap.parse_args()
    port = serve()
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1920, "height": 1080})
        page.goto(f"http://127.0.0.1:{port}/explainer/render.html?lang={a.lang}")
        duration = page.evaluate("window.ready")
        build = ROOT / "build" / a.lang
        build.mkdir(parents=True, exist_ok=True)
        if a.stills is not None:
            for t in a.stills:
                page.evaluate(f"window.frame({t})")
                (build / f"still_{t:07.2f}.png").write_bytes(grab(page))
            return
        srt = subtitles(a.lang)
        out = DOCS / "video" / f"alignment-problem.{a.lang}.mp4"
        ff = imageio_ffmpeg.get_ffmpeg_exe()
        cmd = [ff, "-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", str(a.fps), "-i", "-",
               "-i", str(build / "narration.wav"), "-i", str(srt),
               "-map", "0:v", "-map", "1:a", "-map", "2:s",
               "-c:v", "libx264", "-preset", "slow", "-crf", "20", "-pix_fmt", "yuv420p", "-tune", "animation",
               "-c:a", "aac", "-b:a", "160k", "-c:s", "mov_text",
               "-metadata:s:s:0", f"language={'swe' if a.lang == 'sv' else 'eng'}",
               "-movflags", "+faststart", str(out)]
        enc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
        n = int(duration * a.fps)
        for i in range(n):
            page.evaluate(f"window.frame({i / a.fps})")
            enc.stdin.write(grab(page))
            if i % (a.fps * 30) == 0:
                print(f"{a.lang}: {i / a.fps:6.1f} / {duration:.1f} s", flush=True)
        enc.stdin.close()
        enc.wait()
        browser.close()
        print("wrote", out)


if __name__ == "__main__":
    main()
