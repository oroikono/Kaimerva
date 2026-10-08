---
title: Kaimerva
emoji: 🌌
colorFrom: indigo
colorTo: blue
sdk: static
app_file: index.html
pinned: false
license: mit
short_description: An agent skill and starter for explorable portfolios
tags:
  - agent-skills
  - threejs
  - portfolio
  - webgl
---

# Kaimerva

<img src="assets/brand/kaimerva-icon.png" width="180" alt="A weathered portal opening onto a moonlit sea">

**A free agent skill and Three.js starter for building a portfolio people can explore.**

I wanted a place for research, projects, trips and ideas that still felt like me. Kaimerva grew out of that: a skill that helps a coding agent turn your own work and interests into a world, and a small working starter you can change.

**[Code and quick start](https://github.com/oroikono/Kaimerva)** · **[Read the skill](skills/kaimerva/SKILL.md)** · **[Download the complete skill](kaimerva-skill.zip)** · **[Watch the launch film](launch/kaimerva-launch.mp4)**

## Explore this demo

Choose the Aegean observatory, orbital field or woodland trail. Click a landmark to open its collection. **Explore the loop** enables arrow-key destination navigation; Enter reads the selected collection and Escape returns focus to the page. **Pause motion** keeps reading and selection usable.

In the sea setting, try **Voyage view** or **Reveal the field**. **Enter figure passage** opens a hinged optical instrument around three supplied figure views. The example field and figures are illustrative artwork, not a paper or a validated research result.

The ordinary index stays available when 3D fails. JavaScript is required for this starter's content renderer; the [plain content JSON](content.json) is also available.

## Make it yours

Pronounced **kye-MER-vah**. Spelled **K-A-I-M-E-R-V-A**.

Download and extract the skill ZIP. Copy the complete `kaimerva` folder into your project's `.agents/skills/` for Codex, or `.claude/skills/` for Claude Code. The [repository README](https://github.com/oroikono/Kaimerva#install-the-skill) explains installation and the tested host boundaries. Then give your coding agent a brief, for example:

```text
Use $kaimerva in my existing portfolio. Turn my supplied projects and field
notes into a quiet mountain observatory with orbital instruments. Make it
curious and precise. Keep my content and routes, let people read immediately,
and support mobile, keyboard navigation and reduced motion. No paid services.
Implement it and show me the rendered result.
```

The portable skill guides the agent; it does not need this starter. This demo ships three authored settings. Other worlds and new interactions require implementation and review by your coding agent.

For a copy of the starter, edit `data/site.json` for content and `data/world.json` for the supported scene and reader settings. The local preview refreshes those files without rebuilding. This public Space is a static snapshot: publishing edits requires another build/upload, or your own runtime content provider. No hosted CMS or in-browser AI editor is included.

## What is different here?

The focus is connecting your actual work to a coherent place, then keeping it readable and maintainable. Playable portfolios and 3D design skills already exist. We do not claim to be the first, to have no overlap, or to generate instant photorealistic worlds. [Related work and current comparison](https://github.com/oroikono/Kaimerva/blob/codex/personal-worlds/docs/research/uniqueness-recheck-2026-10-08.md).

The launch film uses earlier real starter footage with a new cinematic edit. It does not show the newer figure passage or a recorded agent run. [Video sources and limits](https://github.com/oroikono/Kaimerva/blob/codex/personal-worlds/docs/launch-video.md).

## Credits

Made by [Orestis Oikonomou](https://orestis-site.vercel.app), with AI assistance. Kaimerva blends *kami* and *Minerva*. [Naming and artwork record](https://github.com/oroikono/Kaimerva/blob/codex/personal-worlds/docs/branding.md).

The starter and included skill/artwork are distributed under [MIT](LICENSE). Three.js keeps its [MIT notice](vendor/three-LICENSE.txt). The portal icon was AI-generated with OpenAI's built-in image tool, with art direction and selection by Orestis; [artwork attribution](assets/brand/ATTRIBUTION.md). Other people's code or media require their own reuse basis.
