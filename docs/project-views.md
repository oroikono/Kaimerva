# Starter project views

These three original SVG diagrams explain Kaimerva's starter. They are supplied
project media, not screenshots, publication figures or scientific results. Each
uses a 1200 × 720 viewBox, local vector geometry and system-font names, with no
external images, font files, scripts or foreign objects. They are distributed
under the repository's MIT license.

| Stage | Image | Suggested label and description |
| --- | --- | --- |
| `overview` | [`project-overview.svg`](../figures/project-overview.svg) | **Explore the starter.** Three authored settings share collection destinations and published records. Optional exploration sits beside an HTML reader that opens the work immediately and remains available without WebGL. |
| `inspection` | [`project-inspection.svg`](../figures/project-inspection.svg) | **Keep the work at the center.** A selected entry's supplied media and explanation are carried through a sea optical iris, an orbital scan gantry with retracting shutters, or a woodland specimen cabinet with hinged glass doors. The record, view and reader actions stay shared. |
| `editing` | [`project-editing.svg`](../figures/project-editing.svg) | **Edit, then publish.** Content and supported settings live in separate JSON files and can refresh the local preview. New mechanisms need authored code. The production build produces a published-only static snapshot; local saves do not publish the deployed site. |

The overview's landmark symbols and the inspection plate's small chart are
explanatory illustrations, not additional implemented objects, data or results.
One-to-three supplied image views, Pause, Return, keyboard access and a flat
image/text fallback belong to the shared inspection workflow. The three housings
illustrate the corresponding authored presentation mechanisms; this is not an
automatic apparatus-generation system or a general world-plugin API.

The inspection diagram describes the local entry chooser and three instrument
housings. Geometry and reader-controller checks are recorded separately from
rendered review in [revision evidence](interaction-refinement-2026-10-08.md).
The diagrams do not imply free steering, rigid-body
physics, a hosted CMS or an embedded browser AI editor.

Relevant source: `src/themes.js`, `src/content.js`, `src/main.js`,
`src/figure-reader.js`, `src/figure-passage.js`, `src/world-config.js`,
`scripts/build.mjs` and `scripts/serve.mjs`. Local source reading establishes the
architecture depicted here; it does not substitute for a rendered app check.
