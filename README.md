# Kaimerva · kye-MER-vah

<p><img src="assets/brand/kaimerva-icon.png" width="240" height="240" alt="Kaimerva: a weathered stone portal opening onto a moonlit sea"></p>

**Summon your world.**

A free agent skill and Three.js starter for making your portfolio a place people can explore. Bring your research, projects, notes or personal story. Give them a setting that feels like you, with useful interactions and work that stays easy to read.

Built by [Orestis Oikonomou](https://orestis-site.vercel.app), with AI assistance, while exploring what his own research and creative portfolio could become.

**[Try the demo](https://huggingface.co/spaces/oroikono/kaimerva)** · **[Read the skill](skills/kaimerva/SKILL.md)** · **[Use the starter](https://github.com/oroikono/Kaimerva/generate)**

**Spelled:** K-A-I-M-E-R-V-A · **Codex skill:** `$kaimerva`

It started as an Aegean portfolio: a boat, islands and instruments for exploring the work. The name combines [kami](https://d-museum.kokugakuin.ac.jp/eos/detail/?id=9958), Shinto spirits and deities, with [Minerva](https://www.metmuseum.org/art/collection/search/206339), associated with wisdom and the arts. [Naming and artwork credits](docs/branding.md).

[![Build your own world — Kaimerva](docs/assets/kaimerva-launch-poster.jpg)](docs/assets/kaimerva-launch.mp4)

**[Watch the 24-second launch film](docs/assets/kaimerva-launch.mp4)**

The film combines earlier real starter footage with new Kaimerva branding, motion graphics and original sound. It shows exploration, three settings and a local content refresh. The current demo also includes a figure passage, and the source includes a typed world-settings editor. Neither is shown in the film. No agent execution is staged. [Video sources and limits](docs/launch-video.md).

## Two ways to use it

**Use the skill in your own app.** It guides your agent through the brief, art direction, implementation and review. Keep your stack, routes, content source and branding. A coast, mountain observatory, orbital station, city or forest can each have its own objects and interactions.

**Start with the working demo.** The procedural Three.js starter ships a coast, an orbital field and a woodland trail. It includes readable collections, keyboard exploration, Pause, local content updates and a figure-inspection passage. It uses one runtime dependency and needs no paid asset service or account.

The skill is portable guidance. The starter is working code. New settings and interactions still need implementation; changing a theme name does not generate a new world.

## Give your agent a brief

After installing the skill, start with something like this:

```text
Use $kaimerva in my existing app.

I’m a researcher who also makes films and writes field notes.
Build a Mediterranean harbor with a few orbital instruments:
pale stone, brushed metal, warm glass and a calm sea.

Let people explore, inspect my supplied figures through a lens,
and open each project’s readable page immediately.
Keep my CMS and routes, mobile reading, keyboard access and Pause.
Use no paid services. Implement it and show the rendered result.
```

Make the brief yours: who you are, what visitors should find, how it should feel, one interesting action and what must be preserved. One rich prompt starts the workflow; the agent still builds, checks and revises the result.

## Install the skill

From this repository's root, copy the **whole folder** into your target project. Replace `../my-portfolio` with its path:

```sh
mkdir -p ../my-portfolio/.agents/skills
cp -R skills/kaimerva ../my-portfolio/.agents/skills/
```

Open Codex in the target project and invoke **`$kaimerva`**. The skill itself needs no npm install. If you already have a copy there, review it before replacing it.

For Claude Code, use `.claude/skills` in the destination and invoke `/kaimerva`:

```sh
mkdir -p ../my-portfolio/.claude/skills
cp -R skills/kaimerva ../my-portfolio/.claude/skills/
```

Fresh-project copying and actual Codex discovery passed with CLI 0.160.0 on 8 October 2026. The Claude Code folder and file format passed portability checks; its runtime loading has not been tested. [Install evidence](docs/research/skill-install-test-2026-10-08.md) · [Independent creation trial](docs/research/skill-forward-test-2026-10-07.md).

## Run the starter

Requires **Node.js 22 or newer**. From this repository's root:

```sh
npm ci
npm run dev
```

Open **http://127.0.0.1:4310**. Click a landmark to read its collection, or use the ordinary index. Reading opens immediately; you do not have to wait for the traveler.

Choose **Explore the loop** for keyboard travel. Right/Down move clockwise, Left/Up move counterclockwise, Enter opens the selected stop and Escape leaves exploration. The route closes back on itself. This is destination navigation, not free steering.

In the coast setting, **Voyage view** follows the boat and **Atlas view** restores the overview. **Reveal the field** shows an illustrative wave-interference study; dragging the water or changing **Wave spacing** adjusts its source separation. The water uses scene reflections and locally generated environment lighting. It is an authored visual scene, not a fluid simulation.

| Orbital field | Woodland trail |
| --- | --- |
| ![Orbital starter](docs/assets/orbital.jpg) | ![Woodland starter](docs/assets/woodland.jpg) |

## Give the interaction a purpose

The research stop opens a hinged optical iris and brings a supplied figure into view. Visitors can switch between up to three supplied images, read their explanations, or open the flat main figure. **Return to world** reverses the passage and restores exploration and focus.

The included wave plates are illustrative artwork, not paper results. Replace them with an authorized figure and accurate descriptions. The scene displays what you supply; it does not invent scientific results or generate an apparatus for every new paper. [Figure format](docs/content.md#figures-and-the-inspection-passage).

**Pause** freezes ambient motion and the camera while keeping reading usable. Reduced motion uses static states or deliberate navigation. On phones, the figure sits above its reader. If WebGL is unavailable, the HTML reader and supplied image remain accessible.

## Keep it easy to change

| What you want to change | Where to start |
| --- | --- |
| Identity, projects, papers, notes, journey and news | [`data/site.json`](data/site.json) |
| Supported theme, lighting, reader and button settings | [`data/world.json`](data/world.json) |
| Objects and authored layouts | [`src/world.js`](src/world.js) |
| Typography, spacing and reading layout | [`src/styles.css`](src/styles.css) |
| Asset sources and reuse records | [`data/assets.json`](data/assets.json) |

For **local content edits**, save `data/site.json` and press **Refresh content**. Only entries with `published: true` appear. The preview validates incoming content and keeps the last valid snapshot for the current page session if a refresh fails. Adding or replacing figure image files requires restarting the preview.

For **supported world settings**, ask your agent for a change or edit `data/world.json`, then press **Refresh world settings**. A small configuration editor also supports reviewed patches and undo:

```sh
node scripts/world-edit.mjs show
node scripts/world-edit.mjs apply my-patch.json
node scripts/world-edit.mjs undo
```

The editor handles existing themes, lighting, inline/dialog readers, solid/glass panels and square/pill buttons. New geometry, layouts and game rules need code. It uses your coding agent; there is no embedded browser AI chat. [Prompt editing guide](skills/kaimerva/references/prompt-world-editing.md).

The production build is a **static snapshot**. Updating a deployed site without rebuilding requires replacing public JSON or adding a runtime content provider. No hosted CMS or live Notion adapter is configured. For a production portfolio, also add rendered entry pages, canonical URLs, identity metadata and a sitemap in your chosen stack. [Content and CMS notes](docs/content.md) · [Hosting](docs/hosting.md).

## Check and build

```sh
npm test         # Content, build and HTTP publication checks
npm run check    # Bounded source, provenance and skill checks
npm run build    # Static site in dist/
npm run preview  # Preview the built snapshot
```

`dist/` is replaced on each build. Keep your source content and assets outside it. [What was actually verified](docs/verification.md).

## Where this fits

Kaimerva connects **identity → content → objects → materials → motion → interaction**. The aim is a setting that expresses the person and helps visitors understand their work.

Playable portfolios, 3D design skills and prompt-driven website tools already exist. Kaimerva brings personal storytelling, optional exploration, readable content and an editing workflow together; we do not claim to have invented those ideas. [Related work](docs/prior-art.md) · [Current comparison](docs/research/uniqueness-recheck-2026-10-08.md) · [Provenance audit](docs/provenance-audit.md).

If you build a different world, show us. Original settings, tested content adapters and clearer first-use flows are useful contributions. Include what you tested on desktop and phone, how people reach the content without WebGL, and the reuse basis for any added assets.

## License and credits

The project's code, procedural demo artwork and included AI-generated portal icon are distributed under [MIT](LICENSE). [The artwork record](docs/branding.md#artwork-attribution) identifies the icon's art direction and generation process. Three.js keeps its own [MIT notice](https://github.com/mrdoob/three.js/blob/r186/LICENSE), included in every build.

Make the identity, branding and footer your own. Keep the required license notices when redistributing covered material; a permanent visible author credit is not required. Any third-party media you add needs its own reuse basis. The starter includes no private CMS records, source-site portraits or third-party paper figures.
