# Personal Worlds: competitive landscape and product implications

Reviewed **2026-10-06**. This is a fresh, bounded primary-source search, extending the earlier [uniqueness review](../uniqueness-review-2026-10-06.md). Sources were public author pages, repository documentation, actual implementation files, license/NOTICE files and the GitHub API. The inspected projects were not installed, benchmarked or visually ranked. Search visibility and public stars do not establish product quality, authorship or adoption. No competitor implementation, media or skill wording was added to this repository.

## Decision

**“A 3D portfolio with an AI skill” is an established category.** Free portfolio source, typed content, immersive navigation, meaningful art direction, readable fallbacks, provenance records and production playbooks each have strong precedents. More generic islands, particles or extra scene presets would add content to this category without giving people a clear reason to choose Personal Worlds.

The more promising product hypothesis is **a person's work becomes the world's interaction**: the paper, project, journey and latest update have purposeful spatial representations; the same records remain directly readable and shareable. This is a proposed direction, not a proven first invention. The present starter demonstrates a smaller claim: three project-authored procedural scenes, a shared readable content model, destination navigation, an illustrative interference field, and local validated JSON refresh. It does not yet provide a hosted CMS, separately rendered entry routes or independently designed navigation for each theme.

## Eight close comparators

The distinctions describe inspected source and documented focus. An unmentioned feature is **unknown**, rather than proved absent. A license statement below describes the inspected boundary; it is not clearance for all upstream assets.

| Comparator and inspected primary evidence | Strongest overlap | License / cost evidence | Implication for Personal Worlds |
| --- | --- | --- | --- |
| **[ORBIT](https://github.com/HenrikBrehm/orbit)** — README; actual [customization skill](https://github.com/HenrikBrehm/orbit/blob/main/skill/SKILL.md); [LICENSE](https://github.com/HenrikBrehm/orbit/blob/main/LICENSE). | Configurable 3D portfolio plus an AI skill. The skill routes eight kinds of edits through typed configuration and requires validation. README documents device tiers and poster fallback. | Actual commercial license was retrieved in this pass: paid standard/extended use; template redistribution and extracting its skill/scene for another product are prohibited. A purchase price was not verified. | Being free and allowing reuse is a useful distinction from this comparator. A config file and AI customization alone are insufficient positioning. We can generate a different personal metaphor rather than just rebrand one hero scene. |
| **[Memory Palace](https://bingran.ai/skills/memory-palace)** — author page and actual [SKILL.md](https://github.com/bingran-you/bingran-you/blob/main/repo-skills/memory-palace/SKILL.md). | A 3D portfolio deployment skill: room/CRT plus inner desktop, content swaps, drop-in scaffolding, NOTICE templates and a production failure playbook. Author page reports update 2026-05-13; this is not an established first-publication date. | Skill explicitly declares MIT; parent repository has GPL-3.0 text. The skill distinguishes an MIT outer app from an inner app requiring separate permission. | Rights-aware skill packaging and deployment knowledge are not novel. A useful difference is authoring another person's world from their story instead of mounting this specific retro kit. Prove that difference with a second real adaptation. |
| **[3Dviz Pro Max](https://github.com/viettranx/3dviz-pro-max)** — actual [skill](https://github.com/viettranx/3dviz-pro-max/blob/main/skills/3dviz-pro-max/SKILL.md), README, [compatibility](https://github.com/viettranx/3dviz-pro-max/blob/main/docs/compatibility.md), [LICENSE](https://github.com/viettranx/3dviz-pro-max/blob/main/LICENSE). | Creative 3D workflow, object/subject reasoning, custom construction, interactive behavior, visual capture, provenance and explicit simulation limits. README inventories 22 kits and 37 runnable studies; these counts were not independently executed. | MIT authored content; third-party media has separate boundaries. Compatibility documentation separates manifest checks from host invocation and rendering. | Competing on number of 3D recipes would dilute our focus. Portfolio information architecture, updates, searchable individual work and reusable personal interaction semantics are a sharper niche. Rendered demos and honest host tests are baseline credibility. |
| **[Bruno Simon Folio 2025](https://github.com/brunosimon/folio-2025)** — actual [readme](https://github.com/brunosimon/folio-2025/blob/main/readme.md), [package](https://github.com/brunosimon/folio-2025/blob/main/package.json), [license](https://github.com/brunosimon/folio-2025/blob/main/license.md). | A deep playable portfolio: inputs, pre/post-physics vehicle, environmental cycles, weather, interactive zones, tracks, audio, and a Blender/compression pipeline are documented in the game loop. | Root license is MIT. The package's `license` field says ISC, an inconsistency to resolve before any future reuse; no code or assets were reused here. | “Visit work by travelling through a game world” has a strong precedent. Our loop is simpler. Promise a maintainable portfolio system with optional exploration rather than equivalent game depth or Unreal-like graphics. |
| **[Henry Heffernan's portfolio](https://github.com/henryjeff/portfolio-website)** — README, [MonitorScreen.ts](https://github.com/henryjeff/portfolio-website/blob/master/src/Application/World/MonitorScreen.ts), [LICENSE.md](https://github.com/henryjeff/portfolio-website/blob/master/LICENSE.md); separate [inner site](https://github.com/henryjeff/portfolio-inner-site). | A coherent authored room/CRT experience with a functioning website inside it. Source builds a CSS3D iframe screen pointing at a separate OS-like site; spatial presentation and usable HTML content are established together. | Outer repository MIT. It is not a blanket license for the separate inner app or every depicted asset. | “A website as a place” and embedding functional content in a 3D object are established. A stronger difference is semantic connections between work and objects across multiple original settings, with ordinary entry links outside the scene. |
| **[Adrian Hajdin's floating-island portfolio](https://github.com/adrianhajdin/3D_portfolio)** — actual [Home.jsx](https://github.com/adrianhajdin/3D_portfolio/blob/main/src/pages/Home.jsx), [Island.jsx](https://github.com/adrianhajdin/3D_portfolio/blob/main/src/models/Island.jsx), [HomeInfo.jsx](https://github.com/adrianhajdin/3D_portfolio/blob/main/src/components/HomeInfo.jsx). | React Three Fiber island, plane and bird. Pointer/touch and arrow keys rotate the island; its stage selects HTML links to About, Projects and Contact. Screen-specific scales are authored in the home component. | No license/NOTICE path was found in the complete current recursive tree; GitHub API returned no detected license. Public visibility alone does not establish reuse permission. | Island exploration, arrows and a travelling visual mascot are particularly close precedents. Sea/islands alone will not make our product distinct. Change what interaction reveals about actual work and demonstrate easier maintenance. |
| **[Saeed Kolivand's comic portfolio](https://github.com/saeedkolivand/saeed-kolivand-portfolio)** — README; actual [shots.ts](https://github.com/saeedkolivand/saeed-kolivand-portfolio/blob/main/lib/shots.ts), [content.ts](https://github.com/saeedkolivand/saeed-kolivand-portfolio/blob/main/lib/content.ts), [PrintEdition.tsx](https://github.com/saeedkolivand/saeed-kolivand-portfolio/blob/main/components/PrintEdition.tsx). | The metaphor creates mechanical constraints: deterministic scroll-driven shots and comic transitions; an authored Print Edition reuses canonical copy. Readable fallback is a designed presentation, not merely an error screen. | No license/NOTICE path in the inspected complete tree; API detected no license. No source reuse proposed. | A theme changing motion and interaction is already demonstrated compellingly in this category. Our three starter themes currently share controls. Design a different interaction grammar for a new person, and make the non-WebGL version feel equally intentional. |
| **[Hasnain Irfan's 3D portfolio starter](https://github.com/HasnainIrfan/3d-portfolio)** — README, [customization](https://github.com/HasnainIrfan/3d-portfolio/blob/main/docs/customization.md), [architecture](https://github.com/HasnainIrfan/3d-portfolio/blob/main/docs/architecture.md), actual [LICENSE](https://github.com/HasnainIrfan/3d-portfolio/blob/main/LICENSE) and [NOTICE](https://github.com/HasnainIrfan/3d-portfolio/blob/main/NOTICE). | Free typed-content starter with a 3D hero/globe, project presentation, SEO metadata and optional Supabase contact/admin storage. Customization docs map content fields to presentation and recommend economical screenshots. | MIT code. NOTICE explicitly excludes personal content, third-party Sketchfab model, client logos and screenshots. Optional backend has service requirements; pricing was not audited. | Configurable content, SEO and an admin panel are established practical expectations. Our reusable starter needs direct entry pages and an actually tested content adapter to compete on maintenance. No-fee core without external asset downloads is a simpler starting boundary. |

### What changed from the earlier review

- **ORBIT's actual license is now readable.** The prior review recorded a retrieval failure. This pass retrieved its 4,340-byte commercial license and 2,545-byte skill via public raw GitHub URLs; it confirms a paid restricted template, rather than an uncertain open-source license.
- **Floating-island navigation is a close concrete precedent.** Adrian's source, not just a marketing description, includes keyboard rotation and stage-dependent links to real sections.
- **Content parity and thematic mechanics are already strong elsewhere.** Saeed's `PrintEdition.tsx` imports the same `content`, `issueCopy`, `lettering`, `links` and `projects` records, while its camera grammar follows the comic metaphor. These are valuable craft principles, not defensible exclusives.
- **Production usefulness is competitive ground.** Hasnain's actual documentation includes typed content, SEO and optional enquiries storage, with a separate assets NOTICE. Our local JSON refresh is useful, but a deployed static snapshot must not be sold as a live CMS.

## Public attention is uneven

The following exact counts were returned by the public GitHub API on **2026-10-06**. They are a snapshot, not a measure of users or proof of why a project received attention. Repository creation is not necessarily public launch. Stars can change and forks can be abandoned.

| Repository | Stars | Forks | Repository created | Interpretation limit |
| --- | ---: | ---: | --- | --- |
| [Henry's outer portfolio](https://github.com/henryjeff/portfolio-website) | 2,522 | 355 | 2022-03-11 | Established personal work and distribution history; not an isolated test of template demand. |
| [Bruno Folio 2025](https://github.com/brunosimon/folio-2025) | 1,911 | 332 | 2024-10-12 | An established author and substantial game production; stars do not quantify conversion into portfolio owners. |
| [Adrian floating island](https://github.com/adrianhajdin/3D_portfolio) | 1,350 | 313 | 2023-10-05 | Educational distribution and a repeatable tutorial artifact; no causal attribution attempted. |
| [3Dviz Pro Max](https://github.com/viettranx/3dviz-pro-max) | 673 | 86 | 2026-09-10 | Broad skill appeal and many demonstrable studies; we did not inspect traffic/referral analytics. |
| [Saeed comic portfolio](https://github.com/saeedkolivand/saeed-kolivand-portfolio) | 12 | 0 | 2026-07-01 | Detailed authored implementation does not automatically imply public reach. |
| [Hasnain starter](https://github.com/HasnainIrfan/3d-portfolio) | 2 | 1 | 2026-05-29 | A long feature list does not by itself establish demand. |
| [ORBIT](https://github.com/HenrikBrehm/orbit) | 1 | 0 | 2026-06-10 | Public showcase stars do not measure paid customers. |

**Inference:** a recognizable experience, an inspectable artifact and a clear teaching/customization path appear together in several visible examples. This is a hypothesis for our launch, not a causal conclusion from star counts. “More features” and “more realistic graphics” cannot be assumed to generate traction.

## A distinct direction worth testing

### 1. Make content act, rather than only decorate

Build one original **project instrument** tied to supplied work. A numerical-method paper could expose a truthful small interactive explanation with clear illustrative/simulation boundaries; a photo essay could become a contact sheet controlled by location/time; an architecture project could reveal a plan through sectional depth. Visitors get an immediate readable entry and an optional object whose behavior explains something specific.

For Orestis, the sea's interference lens is an initial visual vocabulary. It should not represent SIGS, Sim2Science or another paper's result unless the transformation is justified by that actual work. A future contribution's representation contract could name the source entry, visible variables, interaction, what the representation establishes, and its limits. This is a product proposal; the current field is expressly illustrative.

### 2. Show that personalization changes the interaction

Make a second worked portfolio for a consenting creator in a different field, with supplied public facts and their approval for publication. Change spatial relations, traveler logic and at least one content instrument, keeping the readable schema. A desert setting that merely recolors islands would be weak evidence. Record the actual skill invocation, decisions and rendered result, not a staged prompt slide alone.

### 3. Treat content and access as part of the world

Ship a small provider-neutral world/entry contract, ordinary canonical routes, rendered HTML, metadata and a feed. Preserve those links through every theme and fallback. Add one free content-editing path with documented credentials, caching, refresh behavior and publication filtering; measure a real update on the deployed site. This improves the maintenance claim without tying the skill to a particular commercial CMS.

### 4. Make extension visibly easier than copying a portfolio

Publish one small theme/instrument contribution example with a schema, concise installation command, screenshots, real mobile composition and a rights manifest. Test actual skill loading in the target agent hosts. Keep optional high-end geometry separate from the no-download procedural starter. The proposed reusable contract is not a new graphics algorithm; its value would be proven by independent adaptations.

## Stronger positioning and release evidence

The current accurate pitch is:

> A free agent skill and Three.js starter for turning a personal story into an explorable portfolio, while keeping its work readable and maintainable.

After the proposals actually work, the sharper hypothesis to test is:

> Make your work part of the world: interactive project instruments, ordinary readable pages, and a personal setting that you can keep updating.

Before emphasizing that future pitch, show: **two substantially different personal adaptations; one purposeful content instrument; one deployed content edit; one directly shareable entry; desktop/mobile/fallback captures; and actual skill-host invocation evidence.** This is a compact product demonstration, not a request to accumulate process paperwork.

Avoid “first 3D portfolio skill,” “copyright-proof,” “Unreal-quality on every device,” “live CMS included,” or a universal claim of unique output. Current evidence supports authored scenes and a focused package. Permission to distribute, originality of expression, product usefulness and attention are separate questions.

## Search and evidence boundaries

Searches included 3D/playable portfolio templates, game-like portfolio navigation, portfolio/world agent skills, CMS/content-backed portfolios and current GitHub repositories. Eight comparators were chosen for concrete overlap, rather than maximizing a list. Additional search hits included broad concept-first portfolio skills and template marketplaces; they were not treated as evidence of tested runtime behavior.

Source snapshots used only for analysis are in `/tmp/personal-worlds-landscape-2026-10-06`, outside this repository. This pass fetched actual license/source text over HTTPS and checked complete recursive trees for the two unlicensed-source cases. It did not reconstruct authoring history, run visual performance benchmarks, repeat the bounded text-similarity analysis, review all dependencies/assets, establish first publication dates, or exhaust all private/commercial work. The earlier [provenance audit](../provenance-audit.md) and uniqueness review retain their own scopes.
