# Creative repository presentation and organization

Reviewed **7 October 2026, Europe/Zurich**. Eight purposeful examples cover nearby portfolio/3D skills, established playable portfolios, and mature architectural libraries. The [source and metric snapshot](creative-repo-sources-2026-10-07.json) records public GitHub API observations at **09:57:36–37 UTC / 11:57:36–37 Zurich**. This is a bounded comparative review, not a census of every successful repository.

**Similar work exists.** ORBIT already pairs a configurable 3D portfolio with a customization skill; Memory Palace packages a 3D portfolio deployment workflow; 3Dviz Pro Max supplies a broader creative 3D agent workflow. Personal Worlds cannot credibly claim to invent that category. A useful distinction would be a free, modular system in which a person's actual work determines the world's objects and interactions, with ordinary readable pages alongside exploration. That remains a product hypothesis to prove with real adaptations.

This pass read primary README, complete recursive trees, license/contribution files and selected implementation source. It did **not** install the repositories, render their live 3D sites, validate their performance claims, audit every asset, or trace why they acquired stars. No competitor code, prose or media was added to Personal Worlds.

## Attention snapshot

| Repository | Stars | Forks | Why it belongs in this sample |
| --- | ---: | ---: | --- |
| [Bruno Simon Folio 2019](https://github.com/brunosimon/folio-2019) | 4,750 | 1,028 | Established playable personal portfolio; important counterexample to an elaborate-README formula. |
| [Bruno Simon Folio 2025](https://github.com/brunosimon/folio-2025) | 1,911 | 333 | Deeper authored world and documented production/game loop. |
| [Adrian Hajdin 3D portfolio](https://github.com/adrianhajdin/3D_portfolio) | 1,350 | 313 | Educational distribution plus closely related island/keyboard navigation. |
| [3Dviz Pro Max](https://github.com/viettranx/3dviz-pro-max) | 679 | 87 | Closest broader creative 3D agent skill. |
| [ORBIT](https://github.com/HenrikBrehm/orbit) | 1 | 0 | Quiet, close portfolio-plus-skill neighbor; public showcase of a paid template. |
| [Memory Palace's host workspace](https://github.com/bingran-you/bingran-you/tree/main/repo-skills/memory-palace) | 3 | 0 | Quiet deployment-skill neighbor. Counts belong to the entire workspace, **not this skill**. |
| [React Three Fiber](https://github.com/pmndrs/react-three-fiber) | 32,770 | 2,008 | Architectural comparator for composable scene components; not portfolio demand. |
| [drei](https://github.com/pmndrs/drei) | 9,915 | 844 | Architectural comparator for small documented extensions and contributions; not portfolio demand. |

Stars/forks show public attention accumulated under different authors, lifetimes and distribution channels. They do not measure active use, successful generations, uniqueness or the causal value of a README layout. Quiet neighbors matter because overlap is independent of popularity.

## What each repository actually presents

### 1. 3Dviz Pro Max: product plus inspectable evidence

**Sequence:** visual header and positioning → one-sentence example brief → runtime gallery → inventory → workflow diagram → install/recognition → runnable examples → repository map → explicit limits → contributions → rights boundaries. Its leading historical GIF is explicitly separated from skill evaluation; the README points to real kit captures elsewhere. [README](https://github.com/viettranx/3dviz-pro-max/blob/main/README.md)

**Organization:** one canonical `skills/3dviz-pro-max/` folder contains guidance, searchable records, references, starting files, scripts and kits. `examples/`, `site/`, `schemas/`, `tests/`, `evals/` and `evidence/` have separate responsibilities. The complete tree contains those paths. The documented catalog and tier counts were not independently rendered in this pass. [Skill](https://github.com/viettranx/3dviz-pro-max/blob/main/skills/3dviz-pro-max/SKILL.md)

**Transfer:** put a real output and exact recognition/run path near the top; separate declared guidance from observed outputs. Do not compete by adding hundreds of loosely relevant recipes. MIT authored content does not cover all third-party material, and host compatibility has explicit untested paths. No paid renderer/service is required by its core guidance; optional tooling has installation costs in time. [Compatibility](https://github.com/viettranx/3dviz-pro-max/blob/main/docs/compatibility.md)

### 2. ORBIT: one obvious edit surface

**Sequence:** license boundary → concrete proposition → hero screenshot → benefits → two-command quickstart → typed config example → before/after variation → AI request → manual model swap → scripts/deploy → structure. That is easy to scan because the customization path is concrete. [README](https://github.com/HenrikBrehm/orbit/blob/main/README.md)

**Organization/mechanism:** `config/schema.ts` and `site.config.ts` separate editable site/scene values from `components/three`, sections and utilities; eight named recipes map requests onto config changes. This is template customization, not arbitrary world invention. Performance/Lighthouse claims were not independently tested. [Skill](https://github.com/HenrikBrehm/orbit/blob/main/skill/SKILL.md)

**Transfer:** give owners a small, validated edit surface and show what one edit changes. Its license requires purchase and prohibits template redistribution or extracting its skill/scene. Learn the organization principle; do not transplant its implementation, recipes or visuals. The purchase price was not verified. [License](https://github.com/HenrikBrehm/orbit/blob/main/LICENSE)

### 3. Memory Palace: deployment lessons as the product

**Sequence within the skill:** live reference → when to use → prerequisites/rights → two-layer architecture → setup → required content swaps → asset map → production playbook → attribution → linked worked PRs. Its host's general README is a personal profile, so this skill is less discoverable than a dedicated product repository. [Skill](https://github.com/bingran-you/bingran-you/blob/main/repo-skills/memory-palace/SKILL.md)

**Organization/mechanism:** a skill plus `PLAYBOOK.md`, scripts, patches, placeholder content, notices and verification assets mount a specific upstream CRT room and inner desktop under an existing site. The source tree confirms those modules; this pass did not repeat deployment.

**Transfer:** preserve practical failure knowledge and a content replacement checklist, but avoid making Personal Worlds a vendor-cloning recipe. The skill declares MIT while its larger host is GPL-3.0; upstream outer and inner apps have different rights boundaries, with separate permission required for the inner app. Its free-hosting assertion was not independently pricing-audited. [Rights notices](https://github.com/bingran-you/bingran-you/tree/main/repo-skills/memory-palace/assets/notice)

### 4. Bruno Folio 2019: memorable product with a tiny README

**Sequence:** title → Node prerequisite → install/dev/build. There is no elaborate feature inventory or contribution funnel in the inspected README. This challenges the idea that all attention comes from long polished documentation. [README](https://github.com/brunosimon/folio-2019/blob/master/readme.md)

**Organization/mechanism:** `src/javascript/World` separates car, physics, controls, sections, objects, zones and audio; `src/shaders`, `resources/3d` and `static` separate rendering/source assets. Controls source maps arrows/WASD, brake/boost and touch joystick actions. Source establishes those implementations; no live playability test was performed. [Controls](https://github.com/brunosimon/folio-2019/blob/master/src/javascript/World/Controls.js)

**Transfer:** make an immediately recognizable interaction, then expose understandable systems. Avoid copying the car world, branded project boards or art composition. Root MIT is not a complete provenance audit of every asset/dependency. Build scripts are local; no mandatory paid platform is shown in the inspected package. [Package](https://github.com/brunosimon/folio-2019/blob/master/package.json)

### 5. Bruno Folio 2025: world production, not a preset switch

**Sequence:** share image → setup → explicit ordered game loop → Blender export and compression pipeline. The README serves developers interested in a substantial game rather than marketing a universal template. [README](https://github.com/brunosimon/folio-2025/blob/main/readme.md)

**Organization/mechanism:** `sources/Game` separates physics, player, time/input, world, weather and zones; `sources/data` holds projects/socials, while `resources`, `static` and compression scripts handle art. Vehicle source creates a physical chassis/controller and ordered pre/post-physics updates; this is materially deeper than destination hopping. [Vehicle source](https://github.com/brunosimon/folio-2025/blob/main/sources/Game/Physics/PhysicsVehicle.js)

**Transfer:** use an intentional system order and keep art processing separate from content editing. Do not take on every weather/physics subsystem merely to enlarge a feature list. Root license says MIT while package metadata says ISC; clarify before any reuse. Music has a separate CC0 text, which does not clear all sounds/models. [License](https://github.com/brunosimon/folio-2025/blob/main/license.md), [package](https://github.com/brunosimon/folio-2025/blob/main/package.json)

### 6. Adrian's island: tutorial reach and stage-based navigation

**Sequence:** learning-oriented title → screenshot → education/resource/hosting links. The README lacks a substantive customization or contribution guide. Its organization is a compact React app with `pages`, `models`, `components`, `assets` and constants. [README](https://github.com/adrianhajdin/3D_portfolio/blob/main/README.md)

**Mechanism:** pointer/touch and arrow keys rotate the island; angular stages select ordinary About, Projects and Contact links. Home also adjusts model composition for screen sizes. This is especially close to islands, keyboard exploration and a traveling visual mascot; source inspection does not establish flawless accessibility or mobile behavior. [Island](https://github.com/adrianhajdin/3D_portfolio/blob/main/src/models/Island.jsx), [entry links](https://github.com/adrianhajdin/3D_portfolio/blob/main/src/components/HomeInfo.jsx)

**Transfer:** connect exploration to useful pages and publish a teachable build path. Avoid reusing the island model, expressive layout or source: the API detects no license and the complete tree has no LICENSE/NOTICE file. Paid course/hosting promotions do not prove a mandatory paid runtime requirement.

### 7. React Three Fiber: composition and a runnable small example

**Sequence:** package/community badges → visual banner → purpose → install/version compatibility → short interactive example with GIF → docs/first steps → ecosystem → users/contributors. Its example communicates the abstraction before documenting everything. [README](https://github.com/pmndrs/react-three-fiber/blob/master/readme.md)

**Organization/mechanism:** monorepo packages separate renderer, test renderer and tooling, with `docs` and `example` alongside. The actual Canvas supports custom event sources, camera/render configuration and fallback plumbing; that is infrastructure, not a personal-world authoring contract. [Canvas](https://github.com/pmndrs/react-three-fiber/blob/master/packages/fiber/src/web/Canvas.tsx)

**Transfer:** make modules self-contained and demonstrate a minimal useful change. MIT library use is possible subject to its terms, but Personal Worlds need not migrate from plain Three.js solely for stars. Broad library attention does not predict portfolio adoption; performance marketing was not independently verified. Contributions have package, example, test and release instructions. [Contributing](https://github.com/pmndrs/react-three-fiber/blob/master/CONTRIBUTING.md)

### 8. drei: small extensions with visible variants

**Sequence:** live tooling/package links → visual logo → purpose → install → minimal usage → docs. The README archives an older documentation catalog instead of treating it as the current authoritative guide. [README](https://github.com/pmndrs/drei/blob/master/README.md)

**Organization/mechanism:** `src/core` and `src/web` separate helpers; `docs`, Storybook entries and end-to-end tests expose usage. KeyboardControls maps keys to named actions and a shared state API. It does not itself create collision-aware game navigation. [KeyboardControls](https://github.com/pmndrs/drei/blob/master/src/web/KeyboardControls.tsx)

**Transfer:** a new world/instrument contribution should include one small example, controlled variants and concise docs; avoid adding huge models to prove a tiny feature. Its contribution guide expressly asks for simple stories and minimal assets. MIT applies to the library; future helper assets/integrations still need review. [Contributing](https://github.com/pmndrs/drei/blob/master/CONTRIBUTING.md)

## Clusters to carry into Personal Worlds

These are recommendations from the sample, **not a statistical explanation of star growth**.

| Practice cluster | Evidence in the sample | Concrete adaptation |
| --- | --- | --- |
| Show the result and define the product quickly | 3Dviz, ORBIT, Bruno 2025, Adrian, R3F, drei use visuals; Memory Palace points to a live reference. Bruno 2019 is a sparse counterexample. | One strong actual preview, live demo, exact one-sentence purpose, then a 30-second start path. Keep detailed audits lower down. |
| Make the edit boundary obvious | ORBIT config, Memory Palace content swaps, Bruno data/system separation. | Canonical content and world parameters outside the scene implementation. Show a genuine before/after content edit. |
| Teach through runnable examples | 3Dviz studies, R3F minimal app, drei Storybook; Adrian is educationally framed. | Two sharply different worked portfolios plus a tiny new-world extension example, all reproducible. |
| Use one memorable mechanism | Bruno's driving, Adrian's stage navigation, Memory Palace's monitor/desktop. | Select one primary interaction that fits each person's story, then keep content access easy. Distinct silhouettes alone are insufficient. |
| Keep contributions smaller than the entire world | 3Dviz focused records, drei helper stories, R3F package responsibilities. | A contributor can add an instrument, traveler or biome without replacing the content reader or every scene. |
| Publish honest boundaries | 3Dviz evidence/compatibility, Memory Palace upstream notices, ORBIT explicit commercial terms. | Report tested hosts, actual captures, optional dependencies, asset rights and the exact update path. Do not stage a prompt as an autonomous-generation demonstration. |

## How modular worlds should differ

A provider-neutral **content contract** should hold stable entry IDs, title, body, tags, links and media; a **world module** should own layout, terrain, lighting, object vocabulary and camera; an **interaction module** should map visitor intent to travel/focus/open actions; and **project instruments** should optionally explain particular work. Every entry keeps an ordinary URL and readable presentation. This combines established architecture principles into a focused portfolio product; it is not a claim to invent modular 3D.

| Proposed world | Interaction vocabulary worth testing | What must stay useful |
| --- | --- | --- |
| Sea | Voyage between harbors, charts and research instruments. | Direct entry links and a clear route to the selected work. |
| Mountain | Traverse contour routes; milestones become elevation changes or shelters. | Visitors can skip traversal and read the CV/project immediately. |
| Space | Dock at stations; trajectories express relationships rather than decorative orbits. | Readable labels, focus controls and stable entry URLs. |
| City | Follow streets/transit; projects occupy independently authored exhibits/buildings. | No navigation maze needed to contact the owner. |
| Nature | Walk a canopy/path; seasonal growth can organize updates and connected work. | Content order and update dates remain explicit outside the metaphor. |

These five are **proposals**, not shipped claims. Current Personal Worlds has sea/orbital/woodland scenes with shared destination navigation. A stronger release would implement one additional world with substantially different interaction and one content-driven instrument, then demonstrate that the same entry edits correctly in both.

The largest defensible case is a clear narrow promise: **a free skill for authoring personal worlds whose work remains readable, shareable and editable**. Launching five barely differentiated skins would weaken that promise. A second genuine adaptation, one verified hosted update and a small extension contract would make the modular story concrete. Independently author the expression and implementation; if code or assets are later reused, record their actual licenses and scope rather than treating this comparative review as clearance.
