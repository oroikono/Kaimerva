#!/usr/bin/env python3
"""Edit verified October 6 footage into the 24-second Kaimerva launch film.

Requires Python, Pillow, numpy, ffmpeg and ffprobe. No browser access, downloaded
media or model execution. The two source movies remain unchanged. Temporary
frames and synthesized audio stay outside the repository.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
import shutil
import subprocess
import tempfile
import wave
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

W, H, FPS, DURATION = 1280, 720, 24, 24
ROOT = Path(__file__).resolve().parent.parent
CREAM = (242, 239, 229)
MUTED = (157, 166, 189)
GOLD = (222, 195, 139)
VIOLET = (153, 149, 231)
REVIEWED_INPUTS = {
    "docs/assets/personal-worlds-demo.mp4": "31c755209a141b94e0c07afa3bf91cd63194e42945ce612337e70fa84441e7eb",
    "docs/assets/personal-worlds-futuristic-v2.mp4": "3c18073211e8fc0d33143fce08fd35a650442b0d9f80214986c394560ccb2837",
    "assets/brand/kaimerva-icon.png": "0232e81a490c235befb665e434d1be4ba9a29b9ec66bb88fb955c8581e077842",
}


def run(args: list[str], **kwargs):
    return subprocess.run(args, check=True, **kwargs)


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def font_file(explicit: str | None, mono: bool = False) -> str:
    if explicit:
        if not Path(explicit).is_file():
            raise FileNotFoundError(explicit)
        return explicit
    candidates = (
        ["/System/Library/Fonts/Menlo.ttc", "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"]
        if mono else
        ["/System/Library/Fonts/Supplemental/Arial.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"]
    )
    for candidate in candidates:
        if Path(candidate).is_file():
            return candidate
    raise RuntimeError("Supply --font and --mono-font pointing to installed fonts")


def ease(x: float) -> float:
    x = max(0., min(1., x))
    return 1 - (1 - x) ** 3


def soft_mask(size: tuple[int, int], fade: int = 70) -> Image.Image:
    width, height = size
    x = np.minimum(np.arange(width), np.arange(width)[::-1])
    y = np.minimum(np.arange(height), np.arange(height)[::-1])
    # Soft edges are an editorial frame, not an altered source image.
    a = np.minimum(x[None, :], y[:, None]) / fade
    a = np.clip(a, 0, 1)
    return Image.fromarray((a * 255).astype(np.uint8), "L")


def extract(source: Path, start: float, duration: float, crop: str, out: Path, fps: int = FPS):
    out.mkdir(parents=True, exist_ok=True)
    run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-ss", str(start),
         "-i", str(source), "-t", str(duration), "-an", "-vf", f"crop={crop},fps={fps}",
         str(out / "%04d.png")])
    frames = sorted(out.glob("*.png"))
    if not frames:
        raise RuntimeError(f"No source frames in {out}")
    return frames


def synth_audio(path: Path):
    rate = 48000
    t = np.arange(rate * DURATION, dtype=np.float64) / rate
    audio = np.zeros((len(t), 2), dtype=np.float64)
    # Original D-minor ambient bed: no samples or downloaded music.
    swell = .45 + .55 * np.sin(np.pi * t / DURATION) ** 2
    for i, freq in enumerate((73.416, 146.832, 220., 293.665, 349.228)):
        shimmer = np.sin(2 * np.pi * .09 * t + i)
        tone = np.sin(2 * np.pi * freq * t + .07 * shimmer)
        tone += .12 * np.sin(2 * np.pi * freq * 2 * t)
        amp = .028 if i < 2 else .018
        pan = .45 * math.sin(i * 1.3)
        audio[:, 0] += amp * swell * tone * (1 - pan)
        audio[:, 1] += amp * swell * tone * (1 + pan)
    # Subtle notes and transition swells; deterministic noise is synthesized.
    rng = np.random.default_rng(20261008)
    noise = rng.normal(0, 1, len(t))
    smooth = np.convolve(noise, np.ones(19) / 19, mode="same")
    for j, at in enumerate((.15, 2.5, 7., 10., 13., 16.5, 20.)):
        dt = t - at
        env = np.where(dt >= 0, np.exp(-np.maximum(dt, 0) / .75), 0)
        env *= np.clip(dt / .018, 0, 1)
        f = (587.33, 440., 698.46, 523.25)[j % 4]
        note = np.sin(2 * np.pi * f * t) * env * .055
        airy = np.exp(-((t - (at - .14)) / .18) ** 2) * smooth * .10
        audio[:, 0] += note + airy
        audio[:, 1] += np.roll(note, 330) + airy
    audio *= np.clip(t / .35, 0, 1)[:, None]
    audio *= np.clip((DURATION - t) / .65, 0, 1)[:, None]
    audio = np.clip(audio, -.97, .97)
    with wave.open(str(path), "wb") as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(rate)
        wf.writeframes((audio * 32767).astype("<i2").tobytes())


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--output", type=Path, default=ROOT / "docs/assets/kaimerva-launch.mp4")
    p.add_argument("--poster", type=Path, default=ROOT / "docs/assets/kaimerva-launch-poster.jpg")
    p.add_argument("--font")
    p.add_argument("--mono-font")
    args = p.parse_args()
    for binary in ("ffmpeg", "ffprobe"):
        if not shutil.which(binary):
            raise RuntimeError(f"Missing {binary}")
    movie = ROOT / "docs/assets/personal-worlds-demo.mp4"
    v2 = ROOT / "docs/assets/personal-worlds-futuristic-v2.mp4"
    portal = ROOT / "assets/brand/kaimerva-icon.png"
    for source in (movie, v2, portal):
        if not source.is_file():
            raise FileNotFoundError(source)
    font = font_file(args.font)
    mono = font_file(args.mono_font, True)
    fonts = {size: ImageFont.truetype(font, size) for size in (16, 18, 20, 22, 26, 30, 44, 52, 62, 74)}
    monos = {size: ImageFont.truetype(mono, size) for size in (15, 16, 18, 20)}
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.poster.parent.mkdir(parents=True, exist_ok=True)
    source_hashes = {str(x.relative_to(ROOT)): sha(x) for x in (movie, v2, portal)}
    if source_hashes != REVIEWED_INPUTS:
        raise RuntimeError("Source media changed; review footage and update its provenance before rendering")
    with tempfile.TemporaryDirectory(prefix="kaimerva-film-") as temp:
        tmp = Path(temp)
        # Crops remove old film title cards/bands; app objects remain source pixels.
        sea = extract(movie, 14, 4, "1048:497:116:12", tmp / "sea")
        field = extract(movie, 21, 3, "1048:497:116:35", tmp / "field")
        reader = extract(v2, 16, 2.5, "768:358:441:190", tmp / "reader")
        orbital = extract(movie, 27, 3.5, "1048:497:116:35", tmp / "orbital")
        woodland = extract(movie, 32, 3.5, "1048:497:116:35", tmp / "woodland")
        icon = Image.open(portal).convert("RGB")
        yy, xx = np.mgrid[0:H, 0:W]
        halo = np.exp(-(((xx - 985) / 700) ** 2 + ((yy - 220) / 490) ** 2))
        bgarr = np.stack((7 + halo * 13, 10 + halo * 11, 22 + halo * 28), axis=-1).astype(np.uint8)
        bg = Image.fromarray(bgarr, "RGB")
        sequence = [
            (2.5, 7., sea, "Explore your work.", "01 / SEA", "Actual starter footage · 06 OCT 2026"),
            (7., 10., field, "Give ideas an interaction.", "02 / FIELD", "Illustrative field · drag to adjust"),
            (10., 13., reader, "Keep the work readable.", "03 / READER", "Actual local content refresh · no rebuild"),
            (13., 16.5, orbital, "Follow a different orbit.", "04 / ORBITAL", "A second authored setting"),
            (16.5, 20., woodland, "Or take another path.", "05 / WOODLAND", "A third authored setting"),
        ]
        video_tmp = tmp / "picture.mp4"
        encoder = subprocess.Popen(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
            "-f", "rawvideo", "-pixel_format", "rgb24", "-video_size", f"{W}x{H}",
            "-framerate", str(FPS), "-i", "pipe:0", "-an", "-c:v", "libx264",
            "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", str(video_tmp)], stdin=subprocess.PIPE)
        assert encoder.stdin
        poster_frame = None
        for frame_index in range(FPS * DURATION):
            t = frame_index / FPS
            frame = bg.copy()
            draw = ImageDraw.Draw(frame)
            draw.line((52, 61, 1228, 61), fill=(53, 57, 80), width=1)
            draw.text((52, 28), "KAIMERVA", font=monos[18], fill=CREAM)
            draw.text((984, 29), "AGENT SKILL / 3D STARTER", font=monos[15], fill=MUTED)
            # Moving editorial arc links the brand to the destination-loop motif.
            draw.arc((834, -65, 1348, 449), 165, 320, fill=(56, 59, 89), width=1)
            angle = math.radians(165 + ((t * 8) % 155))
            px, py = 1091 + 257 * math.cos(angle), 192 + 257 * math.sin(angle)
            draw.ellipse((px-3, py-3, px+3, py+3), fill=GOLD)
            if t < 2.5 or t >= 20:
                closing = t >= 20
                local = t - 20 if closing else t
                progress = ease(local / .85)
                art_size = int(642 + local * 10)
                art = icon.resize((art_size, art_size), Image.Resampling.LANCZOS)
                # Only presentation framing/scale: original PNG is unchanged.
                frame.paste(art, (640, 80 - int(local * 2)), soft_mask(art.size, 90))
                draw = ImageDraw.Draw(frame)
                if closing:
                    y = 202 + round(24 * (1-progress))
                    draw.text((52, y), "Build your", font=fonts[62], fill=CREAM)
                    draw.text((52, y+72), "own world.", font=fonts[62], fill=CREAM)
                    draw.line((54, y+164, 173, y+164), fill=GOLD, width=2)
                    draw.text((54, y+194), "Free skill + Three.js starter", font=fonts[26], fill=CREAM)
                    draw.text((54, y+236), "github.com/oroikono/", font=monos[20], fill=MUTED)
                    draw.text((54, y+265), "personal-worlds", font=monos[20], fill=GOLD)
                    draw.text((54, 630), "kye-MER-vah  ·  MIT", font=monos[16], fill=MUTED)
                else:
                    y = 192 + round(25 * (1-progress))
                    draw.text((52, y), "Make your work", font=fonts[62], fill=CREAM)
                    draw.text((52, y+73), "a place.", font=fonts[62], fill=CREAM)
                    draw.line((54, y+164, 172, y+164), fill=GOLD, width=2)
                    draw.text((54, y+195), "An explorable portfolio.", font=fonts[26], fill=CREAM)
                    draw.text((54, y+237), "Built around what you do.", font=fonts[22], fill=MUTED)
                    draw.text((54, 630), "PORTABLE AGENT SKILL + THREE.JS", font=monos[16], fill=MUTED)
            else:
                for begin, end, frames, headline, label, note in sequence:
                    if begin <= t < end:
                        local = t - begin
                        progress = ease(local / .35)
                        source_index = min(len(frames)-1, int(local / (end-begin) * len(frames)))
                        shot = Image.open(frames[source_index]).convert("RGB")
                        if frames is reader:
                            # Actual reader occupies a crisp inset; no fabricated editor UI.
                            shot = shot.resize((995, 464), Image.Resampling.LANCZOS)
                            frame.paste(shot, (142, 181))
                        else:
                            # Preserve the full captured world rather than clipping destinations.
                            target_width = round(shot.width * 464 / shot.height)
                            shot = shot.resize((target_width, 464), Image.Resampling.LANCZOS)
                            frame.paste(shot, ((W-target_width)//2, 181))
                        draw = ImageDraw.Draw(frame)
                        draw.text((52, 90 + round(10*(1-progress))), headline, font=fonts[44], fill=CREAM)
                        width = draw.textlength(label, font=monos[16])
                        draw.text((1228-width, 151), label, font=monos[16], fill=GOLD)
                        # Fine frame corners and tracing line are editorial graphics.
                        for cx, cy, dx, dy in ((52,181,1,1),(1228,181,-1,1),(52,645,1,-1),(1228,645,-1,-1)):
                            draw.line((cx,cy,cx+dx*23,cy), fill=GOLD, width=1)
                            draw.line((cx,cy,cx,cy+dy*23), fill=GOLD, width=1)
                        draw.text((52, 670), note, font=monos[20], fill=MUTED)
                        draw.line((52, 654, 52+int(1176*(local/(end-begin))), 654), fill=VIOLET, width=2)
                        break
            # Gentle in/out with six-frame dark transitions; source frame pixels not interpolated.
            transition = 1.
            for cut in (0., 2.5, 7., 10., 13., 16.5, 20., 24.):
                distance = abs(t-cut)
                if distance < .12:
                    transition = min(transition, .5 + .5 * distance/.12)
            if t < .18:
                transition *= ease(t/.18)
            if t > 23.7:
                transition *= max(0, (24-t)/.3)
            if transition < 1:
                frame = Image.blend(Image.new("RGB", (W,H), (4,6,13)), frame, transition)
            if frame_index == 522:
                poster_frame = frame.copy()
            encoder.stdin.write(frame.tobytes())
        encoder.stdin.close()
        if encoder.wait() != 0:
            raise RuntimeError("Video encoder failed")
        audio = tmp / "original-score.wav"
        synth_audio(audio)
        run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(video_tmp),
             "-i", str(audio), "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy",
             "-af", "loudnorm=I=-18:TP=-2:LRA=7", "-ar", "48000", "-c:a", "aac", "-b:a", "160k",
             "-t", str(DURATION), "-movflags", "+faststart", str(args.output)])
        assert poster_frame
        poster_frame.save(args.poster, "JPEG", quality=95)
    probe = run(["ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", str(args.output)], capture_output=True, text=True)
    metadata = json.loads(probe.stdout)
    streams = metadata["streams"]
    video = next(x for x in streams if x["codec_type"] == "video")
    sound = next(x for x in streams if x["codec_type"] == "audio")
    assert video["codec_name"] == "h264" and video["pix_fmt"] == "yuv420p"
    assert (video["width"],video["height"],video["r_frame_rate"]) == (W,H,"24/1")
    assert video["nb_frames"] == str(FPS*DURATION)
    assert sound["codec_name"] == "aac" and sound["sample_rate"] == "48000" and sound["channels"] == 2
    assert abs(float(metadata["format"]["duration"])-DURATION) < .05
    run(["ffmpeg", "-v", "error", "-i", str(args.output), "-f", "null", "-"])
    print(json.dumps({"output": str(args.output), "sha256": sha(args.output),
                      "bytes": args.output.stat().st_size, "duration": DURATION,
                      "frames": FPS*DURATION, "source_sha256": source_hashes}, indent=2))


if __name__ == "__main__":
    main()
