# Kaimerva launch film

The [24-second film](assets/kaimerva-launch.mp4) presents Kaimerva with its portal artwork, large readable type, restrained gold and violet accents, and an original ambient score. The [poster](assets/kaimerva-launch-poster.jpg) comes from the closing card. Edited on **2026-10-08**.

## What the footage establishes

The film uses verified **2026-10-06** browser footage from the earlier Personal Worlds starter. It shows the sea, orbital and woodland settings, an illustrative field, and an actual local content refresh. The newer figure passage, current UI branding and agent execution are not shown. The portal is a brand image used in the film; the movie does not present it as an implemented app environment.

| Film time | Source | Visible demonstration |
| --- | --- | --- |
| 0–2.5 s | Approved Kaimerva portal artwork | Name and portfolio introduction |
| 2.5–7 s | `personal-worlds-demo.mp4`, 14–18 s | Closer sea voyage and portfolio destinations |
| 7–10 s | `personal-worlds-demo.mp4`, 21–24 s | The starter's adjustable illustrative field |
| 10–13 s | `personal-worlds-futuristic-v2.mp4`, 16–18.5 s | Reader title changes from “Ideas, made tangible.” to “A tiny weather station.” through the verified local refresh |
| 13–16.5 s | `personal-worlds-demo.mp4`, 27–30.5 s | Orbital setting and destination loop |
| 16.5–20 s | `personal-worlds-demo.mp4`, 32–35.5 s | Woodland setting and destination loop |
| 20–24 s | Approved Kaimerva portal artwork | Free skill/starter description, pronunciation and repository link |

The source screenshots were already repeated proportionally at 24 fps in the earlier films. This edit retains real source frames, with straightforward crops, scaling, modest timing changes and fades. It adds no interpolated UI frames, generated app footage or simulated agent output. The field is illustrative, rather than a claimed paper result. The content refresh establishes local preview behavior; the published static demo still requires a new build to publish changed content.

The editorial arc, tracing point, corner marks and progress line are film graphics. They are not app controls. The view crops remove previous movie captions and preserve each captured world, including its lower destinations. The reader crop retains the actual changed title. Source movies and the approved PNG remain byte-identical.

## Authorship and reproduction

The movie edit, typography, geometric accents and soundtrack were created for this release with Codex assistance. The soundtrack is synthesized from a harmonic bed, soft notes and deterministic noise; it contains no samples or downloaded music. Installed system fonts render the type; font software is not distributed. The portal artwork retains its [existing attribution](../assets/brand/ATTRIBUTION.md). The scenes are the project's procedural starter, with Three.js covered by the existing [license audit](provenance-audit.md).

Run from the repository root with Python, Pillow, NumPy, `ffmpeg` and `ffprobe` available:

```sh
python3 -B scripts/make-launch-video.py
```

The [renderer](../scripts/make-launch-video.py) reads only the two existing movies and the approved icon, and checks their recorded SHA-256 hashes before rendering. It uses a temporary directory for extracted frames and synthesized audio, then removes it. It makes no browser, network or model calls. macOS and common Linux font paths are detected; `--font` and `--mono-font` accept an installed font path on other systems. Reproduction with different font or encoder versions can change the output bytes.

## Validation

- H.264 High profile, `yuv420p`, **1280 × 720**, **24 fps**, **576 frames**, **24.000 seconds**.
- Stereo AAC, **48 kHz**, approximately **160 kb/s**; decoded loudness **−18.00 LUFS**, peak **−6.82 dBTP**.
- Full video/audio decode completed without errors. MP4 `moov` metadata precedes `mdat` for streaming.
- Decoded contact sheets were inspected for text margins, complete destinations, title change, transitions and closing link. This review concerns the edited film; it does not establish current app rendering or performance.
- MP4: **3,043,535 bytes**, SHA-256 `da4fdb4a3071f1248b44dbddc87c4b49804fc4f968e99c6eadc504cef42ea879`.
- JPEG poster: **197,554 bytes**, SHA-256 `72f63839ebe0895bf6307caf62518e3a063009c20987ddb59cfec0fc6438b83d`.

Input SHA-256:

| File | SHA-256 |
| --- | --- |
| `docs/assets/personal-worlds-demo.mp4` | `31c755209a141b94e0c07afa3bf91cd63194e42945ce612337e70fa84441e7eb` |
| `docs/assets/personal-worlds-futuristic-v2.mp4` | `3c18073211e8fc0d33143fce08fd35a650442b0d9f80214986c394560ccb2837` |
| `assets/brand/kaimerva-icon.png` | `0232e81a490c235befb665e434d1be4ba9a29b9ec66bb88fb955c8581e077842` |

Suggested accessible description:

> Kaimerva, a free agent skill and Three.js portfolio starter. A moonlit stone portal introduces the brand. Actual earlier starter footage shows a sailboat among islands, an illustrative field, a project reader with a changed title, and orbital and woodland settings. The portal and repository link close the film.

No external upload or post was performed by the video renderer.
