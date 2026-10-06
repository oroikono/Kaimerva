# Related projects and positioning

Reviewed on **2026-10-06** using the projects' public repositories, documentation and license files. This is a bounded comparison, not an exhaustive literature search or a claim of novelty. Upstream capabilities are documented by their authors; we did not benchmark or run these projects.

## What already exists

| Project | Established capabilities | License and reuse boundary |
| --- | --- | --- |
| [Bruno Simon Folio 2025](https://github.com/brunosimon/folio-2025), with its [2019 predecessor](https://github.com/brunosimon/folio-2019) | Playable personal portfolio with vehicle controls, physics, interactive zones, environmental cycles and asset pipelines. A strong precedent for discovering a portfolio through a world. | [2025 MIT license](https://github.com/brunosimon/folio-2025/blob/main/license.md); [2019 MIT license](https://github.com/brunosimon/folio-2019/blob/master/license.md). Required notices apply to reused code; a repository license does not independently clear every third-party asset. |
| [React Three Next](https://github.com/pmndrs/react-three-next) | Next.js / React Three Fiber starter with a persistent canvas between routes, synchronized HTML and WebGL viewports, and GLSL imports. | [MIT license](https://github.com/pmndrs/react-three-next/blob/main/LICENSE). Useful rendering infrastructure rather than a personal identity and content-authoring workflow. |
| [Anthropic frontend-design](https://github.com/anthropics/skills/tree/main/skills/frontend-design) | Subject-derived visual direction, deliberate typography and motion, implementation and critique, with guidance against generic generated design. | [Apache-2.0 license](https://github.com/anthropics/skills/blob/main/skills/frontend-design/LICENSE.txt). Broad frontend guidance; no dedicated portfolio world or CMS system. |
| [UI UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) | Searchable styles, palettes, font pairings, industry rules, design-system generation, and responsive and accessibility guidance across stacks. | [MIT license](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/main/LICENSE). Broad design intelligence rather than a dedicated system for maintaining personal portfolio worlds. |
| [3Dviz Pro Max](https://github.com/viettranx/3dviz-pro-max) | A close skill precedent: world and object reasoning, interactive Three.js scaffolds, reusable rigs, rendered-frame inspection, provenance and documented compatibility limits. | [MIT license](https://github.com/viettranx/3dviz-pro-max/blob/main/LICENSE) for authored content. Third-party anatomy, fonts and media have separate terms. Skill loading and scene rendering are distinct evidence. |
| [SonicXBoy Portfolio](https://github.com/vixkosla/sonicxboy-portfolio) | Authored WebGL choreography, mobile camera direction, recreation documentation, and an agent-readable source kit and project context. | [MIT license](https://github.com/vixkosla/sonicxboy-portfolio/blob/main/LICENSE). The author's identity, contacts and personal claims must be replaced in a derivative. It presents one authored sequence rather than a general set of portfolio themes. |
| [ORBIT](https://github.com/HenrikBrehm/orbit) | A direct combination precedent: typed configuration for branding, content and the 3D scene, an included AI customization skill, device tiers and fallback posters. | The repository README explicitly describes a commercial showcase requiring a purchased license and prohibiting source copying. Its listed license file was not retrievable during this review; no detailed license interpretation is claimed. We do not reuse its implementation. |

The existence of playable portfolios, reusable rendering starters, thematic 3D skills and AI-customizable templates is established by these examples. Combining a 3D portfolio and an agent skill is not a defensible first-of-its-kind claim.

## Our intended contribution

**A free, portable agent skill and starter for turning a personal story into an interactive portfolio world, with content that remains easy to maintain.**

The following focus is an inference from the comparison above, not proof that other projects lack these features:

- **One content model, multiple views.** Canonical content drives both spatial discovery and readable collection views. This starter uses collection anchors; separately routed entry pages remain a production extension.
- **Themes change behavior.** A new theme changes geography, objects, motion and navigation mechanics, as well as visual styling. Ocean routes, orbital stations and forest paths can serve different personal stories.
- **Useful access paths.** Keyboard, touch, direct links, reduced motion and a WebGL fallback all provide access to the same content.
- **Maintainable content.** Structured local content works without a paid platform; optional CMS integrations document caching and update behavior.
- **Reviewable provenance.** Asset records distinguish original procedural work, licensed material and permission-dependent personal media. A reusable release excludes personal portraits, research figures and secrets unless their inclusion is explicitly authorized and their rights are documented.
- **Observed quality.** The workflow studies references, derives a personal metaphor and interaction rules, builds, then inspects actual rendered results. Manifest validation, skill discovery, browser behavior and visual review are reported separately.

These are design and implementation goals. The current release's README and validation records determine which capabilities have actually been built and tested.

## Independent implementation

Personal Worlds was developed with AI assistance from our portfolio work and newly written starter code. The listed projects document design context and established overlap; the release inventory identifies Three.js as the copied third-party runtime. A bounded independent audit found no other bundled reference-project implementation or substantial verbatim skill passages in the sources compared. This is evidence about the inspected release, not proof of complete historical code provenance or global originality. [Audit scope and findings](provenance-audit.md).

If a later contribution reuses upstream code or assets, record its exact source and license, preserve required notices, and revise this statement. An overall repository license does not replace an individual asset's terms.

## Skill portability

The [Agent Skills specification](https://agentskills.io/specification) defines a skill directory containing a `SKILL.md` file with YAML `name` and `description`, plus optional scripts, references and assets. We use that structure while keeping host-specific installation instructions separate from the canonical workflow.

A correctly structured skill does not prove compatibility with every agent. Record actual host invocation tests and rendering evidence rather than inferring them from a manifest or a successful file copy.

No first-of-its-kind claim, guaranteed unique output or GitHub popularity prediction is made.

## Observatory art direction

The sea prototype studies the relationship between exploration and scientific instruments in [JETT's official visual gallery](https://www.jett.fyi/vis), the ocean exploration described by [ABZÛ's developer](https://giantsquidstudios.com/ABZU), and vessel/environment storytelling in [FAR: Changing Tides' developer introduction](https://news.xbox.com/en-us/2021/06/14/presenting-far-changing-tides/). These are conceptual references. Their assets, scripts, models, screenshots, music, typography and compositions are not bundled. The observatory geometry, shader, wake, controls and interface are authored for this repository. No first-of-its-kind claim is made.
