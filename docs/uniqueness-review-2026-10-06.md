# Personal Worlds: bounded uniqueness review

Reviewed **2026-10-06**. This is a fresh comparison of current public repositories, author documentation and downloaded skill text. It is not an exhaustive search, a visual benchmark, a finding of global priority, or legal clearance. No competitor code, media or skill instructions were incorporated into Personal Worlds during this review. Downloaded comparison text remains in a temporary analysis folder, outside this repository.

## Conclusion

**Personal Worlds has a distinctive implementation and a useful focused package. Its broad category is established.** Playable portfolios, explorable 3D agent skills, maintainable portfolio configuration, AI customization and rights-aware deployment workflows all have precedents. In particular, ORBIT already packages a 3D portfolio with an AI customization skill, and Memory Palace packages a specific 3D portfolio experience as a deployment skill.

The defensible contribution is the particular free combination we ship: a portable identity-to-world workflow, three project-authored procedural environments, a shared readable content model, optional cyclic exploration and an explicit content/provenance boundary. This review does not establish that nobody else has shipped that exact combination. A description of what it does is stronger than a first-of-its-kind claim.

## Closest comparisons

The differences below describe inspected implementations and their documented focus. They do **not** imply that another project cannot support an extension or lacks every feature its README does not mention. Author-reported performance and compatibility claims were not independently benchmarked.

| Project and primary evidence | Established overlap | What Personal Worlds can specifically demonstrate today |
| --- | --- | --- |
| [Bruno Simon Folio 2025](https://github.com/brunosimon/folio-2025), [game-loop documentation](https://github.com/brunosimon/folio-2025/blob/main/readme.md) | Portfolio discovery through a playable world; vehicle physics, interactive zones, environmental cycles and an asset pipeline. This rules out claiming a new idea of travelling through a portfolio. | A lightweight reusable skill plus three procedural starters and separate readable entries. Our traveler selects destinations on a loop; it does **not** offer Bruno's physical driving system or equivalent game depth. |
| [ORBIT](https://github.com/HenrikBrehm/orbit), [customization skill](https://github.com/HenrikBrehm/orbit/blob/main/skill/SKILL.md) | Direct precedent for a configurable 3D portfolio plus an AI skill. Its typed configuration covers identity, projects, sections and scene properties; it documents reduced-motion and WebGL poster fallbacks. | A free starter with complete procedural environments and a portable workflow that can be used outside this repository. ORBIT's documented customization centers on its own Next.js/R3F template and scene configuration. Its README describes a commercial license; no implementation was reused. |
| [Bingran You's Memory Palace](https://bingran.ai/skills/memory-palace), [actual SKILL.md](https://github.com/bingran-you/bingran-you/blob/main/repo-skills/memory-palace/SKILL.md) | A close new match: a 3D portfolio deployment skill, own-content replacement, NOTICE templates, asset cautions and post-deploy verification. Rights records and reusable deployment knowledge are established ideas. | A workflow for deriving another personal metaphor and authored procedural scenes rather than mounting the documented CRT/Win98 kit. Personal Worlds does not vendor Henry Heffernan's room or desktop implementation. Memory Palace's license declaration and parent-repository boundary are recorded below. |
| [3Dviz Pro Max](https://github.com/viettranx/3dviz-pro-max), [actual skill](https://github.com/viettranx/3dviz-pro-max/blob/main/skills/3dviz-pro-max/SKILL.md) | A strong precedent for agent-guided explorable worlds, world/subject reasoning, runnable Three.js kits, visual inspection, provenance and compatibility limits. Procedural geometry and recorded proof are not exclusive innovations here. | A narrower portfolio workflow: projects, papers, journal, journey and news share one content schema and a readable interface. Its Aegean observatory adds a selectable illustrative interference field and atlas/voyage views; these are concrete artwork and interactions, not a new mathematical or rendering technique. |
| [Interactive Portfolio](https://github.com/sickn33/agentic-awesome-skills/blob/main/skills/interactive-portfolio/references/detailed-guide.md) + [3D Web Experience](https://github.com/sickn33/agentic-awesome-skills/blob/main/skills/3d-web-experience/SKILL.md) | Explicit skill guidance for personal branding, game-like navigation, 3D scenes, readable content, mobile fallback and an immersive-portfolio workflow. Their source metadata attributes the material to VibeShip's skill collection. | A running bounded implementation of that broad direction, with local validated content refresh, publication filtering and three original scenes. We should not market ordinary portfolio UX, mobile fallback or combining skills as new ideas. |
| [Build Beautiful Sites](https://github.com/RaDeleon/Build-Beautiful-Sites), [actual skill](https://github.com/RaDeleon/Build-Beautiful-Sites/blob/main/SKILL.md) | An adjacent workflow precedent: original art direction, reference analysis, immersive portfolios, motion choices, true 3D, visual review and media/provenance discipline across agent hosts. | Personal Worlds focuses on reusable spatial portfolios and local structured content. Its included procedural demo requires no paid media-generation service. The broader website-production workflow and the idea of blending reference principles are established. |

## What our release actually contains

Source inspection covered `README.md`, the canonical skill and its three references, `src/content.js`, `src/main.js`, `src/themes.js`, relevant `src/world.js` paths, `scripts/serve.mjs`, `scripts/build.mjs`, `data/assets.json` and the existing provenance audit.

- **Three different scenes:** sea, orbital and woodland change geometry, materials, lighting, spatial arrangement, traveler appearance and ambient motion. They **share the same destination navigation controls**. Three independently designed navigation mechanics are not shipped.
- **Readable content:** the same validated JSON snapshot supplies HTML entries and destination selection. Clicking a destination does not require completing a voyage before reading. This is browser-rendered content; production entry routing and complete SEO are extensions.
- **Optional exploration:** focused arrows move to adjacent stops, wrapping around the loop. Pause, reduced motion and a WebGL failure path preserve access to readable content. This is destination navigation, not free steering, collision simulation or a complete videogame.
- **Maintainable updates:** the local preview rereads `data/site.json` on content requests and supports Refresh content. The production build emits a static snapshot. No hosted CMS account or live Notion adapter is configured in the reusable starter.
- **Original scene inventory:** procedural geometry, locally generated textures and the illustrative sea field are recorded as project-authored with AI assistance. Three.js 0.186.1 is the copied runtime dependency, distributed with its MIT notice. The separate personal site's portrait, paper figures and private CMS data are excluded.

These findings agree with the release's existing [provenance audit](provenance-audit.md). This pass did not reconstruct the complete authoring history or rerun a comprehensive code-similarity audit.

## New Memory Palace source and license check

The author-hosted [download](https://bingran.ai/skill-files/memory-palace.md) and [GitHub raw SKILL.md](https://raw.githubusercontent.com/bingran-you/bingran-you/main/repo-skills/memory-palace/SKILL.md) were downloaded successfully and were byte-identical: **14,365 bytes**, SHA-256 **`2276066ecf59a1d18f52992d3a89a25bbb3df115050513a1eb466aa60ca395ab`**. Its YAML `license` field and attribution section explicitly declare **MIT**. The displayed author page reports an update on 2026-05-13; this review does not establish its initial publication date.

The parent repository's [root LICENSE](https://github.com/bingran-you/bingran-you/blob/main/LICENSE) contains GPL-3.0 text. A request for an adjacent `repo-skills/memory-palace/LICENSE` returned 404. Record the explicit skill-specific MIT declaration separately from the parent license; do not infer one universal license for every file or asset. The skill also documents separate licensing/permission boundaries for the outer and inner portfolio apps. We only inspected this material as prior art and did not reuse it, so no choice between those scopes was needed for this release.

## Bounded skill-text comparison

Our `SKILL.md` and three references contain **2,926 normalized words**. A script compared each file separately against seven current public skill/document files using lowercase alphanumeric word tokens and exact contiguous runs. It did not join runs across file boundaries.

| Compared upstream text | Normalized words | Longest exact run with our four files |
| --- | ---: | ---: |
| Memory Palace `SKILL.md` | 2,013 | 6 |
| ORBIT `skill/SKILL.md` | 379 | 2 |
| 3Dviz Pro Max `SKILL.md` | 1,530 | 4 |
| Build Beautiful Sites `SKILL.md` | 2,838 | 4 |
| Interactive Portfolio `SKILL.md` | 279 | 3 |
| Interactive Portfolio detailed guide | 1,379 | 2 |
| 3D Web Experience `SKILL.md` | 1,062 | 3 |

The longest match was the generic phrase **“use when the user wants a”**. No substantial verbatim skill passage was detected in these seven comparisons. This is useful narrow evidence; it does not test paraphrase, distinctive selection/arrangement, historical revisions, scene-code similarity, model training provenance, trademarks or every upstream source. Do not turn it into a guarantee that nothing was copied or that no claim could arise.

## Defensible pitch and further differentiation

Suggested short pitch:

> **Personal Worlds — a free agent skill and Three.js starter that turns a personal story into an explorable portfolio, while keeping the work readable and easy to update.**

The demo can substantiate its three scenes, optional exploration, original instruments and local content workflow. Avoid “the first 3D portfolio skill,” “never seen before,” “unique graphics algorithm,” “hosted CMS included” or “copyright-proof.”

Two promising next steps would strengthen the actual product: a second person's independently adapted world with a different meaningful interaction, and content-specific instruments derived from that person's real work. For example, a project could open an interactive explanation rather than a decorative generic island. These are proposals to evaluate, not implemented features or verified globally new inventions.

Implementation authorship, useful product differentiation and permission to distribute are separate questions. Existing categories do not invalidate our authored work; a distinctive combination does not grant permission to reuse someone else's expression. Keep exact source and required notices for any future code or assets that are added.
