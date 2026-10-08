# Personal Worlds: three product bets beyond decorative 3D

Research and source review: **2026-10-06**. These are proposed changes, not shipped features, proven demand, a global novelty finding, or a legal clearance. No comparable project's implementation, media or skill text was reused during this review.

## Recommendation

The strongest next change is **make individual entries become meaningful, inspectable objects in the world**. A paper, a project and the note that connects them should have stable identities in both the scene and the reading view. Adding one published entry should visibly add its object without requiring a scene-code edit.

Today the world can be attractive without helping a visitor understand the particular work. Its runtime receives five fixed collection destinations; JSON updates change the HTML entries but do not create content-specific landmarks. That makes switching scenery more demonstrable than changing a person's story. This is the adoption problem to solve first.

A useful future promise would be: **“Your work shapes the world. Update one record; explore it as an object or read it as a page.”** Do not use that as a current feature claim. Content-driven 3D galleries and knowledge graphs already exist; the opportunity is a carefully designed, reusable portfolio experience that combines authored personal metaphors with maintainable, inspectable work.

## What the current product actually supports

Inspection covered the README, canonical skill and its references, `src/content.js`, `src/main.js`, `src/themes.js`, relevant `src/world.js` paths, and content/verification documentation.

- `src/main.js` passes the five `collections` to `createWorld`; `renderContent` generates articles from published entries. There is no entry-to-scene update call in `refresh`.
- Sea, orbital and woodland are distinct procedural scenes but share the same cyclic destination controls. The sea field and voyage camera are particular authored interactions, not research results or free steering.
- Stable entry IDs, explicit publication filtering and validated structured content are a good foundation. The current reusable starter has collection anchors, browser-rendered entries and local JSON refresh. Dedicated entry routes, production SEO and a hosted CMS remain extensions.
- The skill can be used outside the starter. It asks an agent to derive objects/materials/motion/interaction from the person's identity, rather than enforcing the sea theme. A real Claude Code invocation is still untested.

These boundaries matter: improving the reusable starter must not imply that the separate personal website's private Notion integration, papers or media have been included.

## Adjacent precedents that change the strategy

The earlier [bounded uniqueness review](../uniqueness-review-2026-10-06.md) already covers playable portfolios, ORBIT, Memory Palace and creative agent skills. This pass looked beyond portfolio themes into authoring and semantic exploration. The evidence below is author documentation; live UX, performance and every implementation detail were not independently benchmarked.

| Primary source | What is already documented | Implication for our pitch |
| --- | --- | --- |
| [OpenVGAL](https://github.com/lbartworks/openvgal) | A browser generator turns image folders into interconnected 3D gallery rooms; metadata can be edited before export. It offers a self-contained ZIP and MIT code. Its README separates optional paid hosting from the free generator. | “Free 3D authoring,” “content creates rooms,” and “own your exported site” are established product ideas. Our proposed distinction needs to be about mixed personal content, meaningful objects and a coherent theme, rather than merely adding an editor. |
| [GalaxyBrain](https://github.com/nerd-sniped/GalaxyBrain) | A template publishes an Obsidian vault as a 3D knowledge graph, with notes pushed to GitHub and a subsequent site rebuild. | “A personal knowledge world with easy content editing” already has a direct precedent. Runtime refresh and the portfolio metaphor would be particular choices, not inventions of graph publishing. |
| [Fezcodex](https://github.com/fezcode/fezcode.github.io) | The author's portfolio combines posts, personal logs and projects, a 3D content graph, appearance choices and exploration achievements. It also documents an MCP tool for creating blog content and updating registries/feeds. | Mixed personal/research/creative identity, a semantic graph, achievements and agent-assisted authoring can all coexist elsewhere. More checkboxes would be a weak differentiation strategy. |
| [Quartz Graph View](https://quartz.jzhao.xyz/features/graph-view), [Backlinks](https://quartz.jzhao.xyz/features/backlinks) | Connected notes, local/global graph options and visited-node styling give a readable publishing tool a spatial relationship view. | Visitors must be able to understand why two pieces of work are connected. Relationship visibility is useful, but a generic graph is not a new contribution. |
| [Virtual Science and Technology Museum](https://github.com/nandana-das/interactive-3d-virtual-museum) | Data-driven exhibits, metadata panels, guided tours, topic-based next-hall hints and a concept-map overlay. | Tours and explanatory content objects are established. Our experiment must demonstrate the value for someone's professional work, not advertise guided movement itself as new. |
| [Yellow Brick Road portfolio](https://github.com/Frostfire25/yellow-brick-road/blob/master/README.md) | Themed landmarks represent education, skills, experience and projects; optional auto-walk provides a guided tour. | A literary/game metaphor and a navigable professional story are already familiar. Avoid reproducing a recognisable fictional setting or its assets as our contribution. |
| [Keystatic](https://keystatic.com/docs/introduction), [local mode](https://keystatic.com/docs/local-mode) | A browser UI edits local or GitHub-backed content files. | Human-friendly file authoring is solved independently of our graphics. A narrow adapter or export workflow could be more useful than developing a full CMS. Git-backed edits should not be described as runtime publication without rebuilding. |

The source selection is bounded. Search absence cannot establish an exclusive gap. The conclusions below are product judgments from these precedents and our code, not claims that competitors cannot be extended similarly.

## Ranked bets

Scores are comparative judgments, from 1–5, not market measurements. Effort refers to an initial usable slice and assumes familiarity with this codebase; integration and device verification can substantially increase it.

| Rank | Bet | Main user benefit | Benefit | Evidence for utility | Initial effort | Demonstrability | Main risk |
| --- | --- | --- | ---: | --- | --- | ---: | --- |
| 1 | **Work becomes an atlas** | An owner adds work once; a visitor understands and inspects specific projects and their connections. | 5 | Closest overlap exists in galleries and knowledge gardens; our own fixed collection map exposes a clear product limitation. Demand for our particular composition is untested. | Medium; approximately 3–6 focused development days for a bounded first slice, then real review. | 5 | An unreadable graph or generic tiles in 3D could recreate the original problem. |
| 2 | **A local world authoring desk** | A non-specialist can replace demo content, preview the result and export a site without editing meshes or buying a service. | 5 | OpenVGAL and file-based CMS tools demonstrate this workflow category. Our adoption funnel currently requires manual JSON edits and scene-code changes. | Medium; approximately 2–4 days for import/edit/export only; secure hosted writes are a separate project. | 5 | Becoming a weak general CMS/editor; confusing local save with public publication. |
| 3 | **Evidence trails through a personal story** | A visitor chooses a short, meaningful route through selected work and immediately sees the supporting material. | 4 | Museums and themed portfolios already document guided routes. Whether a concise professional trail improves comprehension needs testing. | Small to medium; approximately 2–3 days for one curated trail with three stops. | 4 | Added authoring work, forced tours, or superficial gamification without better understanding. |

### 1. Work becomes an atlas

Keep the five collection destinations as a calm overview. Selecting Research opens its group of published paper objects; selecting a paper opens its exact title, summary, publication state and source link immediately. Only author-curated cross-references connect it to a project, journal note or journey chapter. Labels must explain the connection, for example “implementation,” “field note,” or “follow-up.” Shared tags may help filtering, but should not automatically assert scientific or biographical relationships.

The meaningful design change is at the entry level. In a coast, a research object could be an instrument with a specimen or figure; in orbit it could be an observation module. Each maps to the same entry ID while its shape and small interaction reflect the theme. A project's artifact can be inspected without sailing to every other project. These are proposed authoring rules, not instructions to invent results or substitute illustrations for a paper's actual evidence.

Use stable placement across updates. Existing objects should keep their locations when another entry is added, and an open entry should retain focus after refresh. An author can choose featured entries, a bounded visible group and explicit relations; the interface should never attempt to cram 1,000 labels into one scene. Empty groups should stay empty. Appearance can show true kinds or publication state; size should not invent importance from citation counts or a guess about quality.

**First small experiment:** three illustrative entries: a project, a paper and a related note. Add explicit related IDs, create one inspectable object per published entry in sea and orbital, and update them from the same validated content snapshot. Demonstrate adding a fourth entry and changing a title through local Refresh content without touching scene code. Show a direct entry link opening the same reading content with WebGL disabled. Exclude all draft records and relations to drafts from public output.

**Review criteria:** a first-time visitor finds a named entry with pointer, keyboard and readable list; correctly explains one relationship; a source edit preserves the selected entry and other object positions. Compare this against the existing collection-only map with several volunteers before expanding geometry. The goal is inspectability and comprehension, not longer dwell time or a bigger node count.

**Skill change if this works:** require a small explicit content-to-object mapping, a documented relation vocabulary, stable IDs and one demonstrated new-entry update. Include a second person's genuinely different metaphor so the skill proves adaptation rather than cloning the sea design.

### 2. A local world authoring desk

Provide an account-free page for importing a content file, editing identity and entries, previewing both reading and scene views, and exporting validated JSON. It would use the same validators and keep demo records unmistakable. It should also show which published entries lack a source link or which media lack recorded provenance. That is an audit aid; it does not certify the claims or permissions.

The desk would let a person answer a few useful design questions: audience, interests, content priorities and intended mood. It could export a reviewable brief/prompt for the portable skill. No hosted LLM call is needed. Avoid a promise that a form can automatically generate novel geometry or verify authorship. A theme editor should separate content from art direction; changing “sea” to “space” in a selector is not a new personal world.

**First small experiment:** import the existing fixture, replace identity/title, add one published entry, inspect an error for a duplicate ID, then export a valid file and load it in the local preview. Start with browser memory and explicit download; do not add a network write endpoint or authentication system. Show a clear status distinction between unsaved edits, exported local file and published site.

**Review criteria:** a person unfamiliar with the repository replaces the demo successfully without a code editor; invalid or private entries are handled correctly; exported content can be reopened and compared. Browser-only export still needs the site's ordinary build/upload process. A tested CMS/provider adapter would be a later, separate addition.

**Skill change if this works:** expose a concrete content brief/export artifact and a clear production publishing choice. Reuse a current file-based CMS where it fits a chosen framework rather than forcing every user onto a new editor. Do not introduce a paid requirement.

### 3. Evidence trails through a personal story

Offer optional owner-authored trails with an intelligible purpose: “A question I followed,” “How I built this,” or “Three recent things.” A trail is a small sequence of entry IDs plus a sentence explaining each transition. A visitor can inspect the artifact, figure, method or source at each stop, skip directly to any entry, or exit at once. Manual travel and a readable outline show the same sequence.

This makes the game-like layer serve the portfolio: a reader sees how a question connects to an implementation and a later reflection. It should not award a badge for understanding a paper merely because someone opened it. Avoid visitor profiling, guessed credentials or a paywall on ordinary reading. Narration, quizzes and cinematic camera paths are optional later work; the first version can be text and deliberate transitions.

**First small experiment:** one three-stop trail made entirely from labelled illustrative data. Each stop has a specific takeaway and a real inspectable demo artifact, plus one author-written relation. Keep the existing keyboard destination exploration and provide an ordinary ordered-list outline. Reduced motion switches stops without a forced flight. Back/Forward should restore the current stop and reader reliably.

**Review criteria:** visitors can articulate the intended connection after a brief visit and can find a source immediately. Compare an outline-only view with the spatial trail. If the world contributes only motion, keep the outline and revise the interaction. Do not turn a browser benchmark or source inspection into evidence of user comprehension.

**Skill change if this works:** add an editorial trail contract and one content-specific interaction, with evidence/source accuracy checked separately from design. This can be demonstrated through different themes, but a guided tour by itself is not an originality claim.

## Features all three bets must preserve

1. **Immediate reading.** Movement must never gate access to the work. Include clear identity, current activity, contact/CV paths and direct entry access.
2. **One content source.** IDs connect scene, HTML controls, routes, search and feeds. Publication filtering also applies to derived relations, previews and exports.
3. **Optional exploration.** Keep ordinary navigation, focus boundaries, Escape, touch alternatives, Pause, reduced motion and a complete reading path when graphics fail.
4. **Original, purposeful art direction.** Preserve distinct geometry/material/motion per theme. Authored styles can draw on broad design mechanisms; do not bundle a reference's distinctive art/assets or imply that more effects create a personal identity.
5. **Plain storage and truthful update semantics.** Remain useful with local files and free static hosting. Distinguish local edits, hosted JSON, an authenticated CMS save, refresh and deployment.
6. **Bounded graphics and maintenance.** Lazy-load optional graphics in a production stack, bound visible entries/pixel ratio/passes, dispose removed resources and inspect actual mobile rendering. Do not market an unmeasured “Unreal-quality” promise.
7. **Provenance.** Keep a per-asset/source record and required notices. A paper figure, portrait, model or soundtrack has separate rights from the code. An audit dashboard cannot grant permission.

## A launch demonstration worth earning

The useful proof is a before/after update: **one entry added → a new meaningful object → the same entry readable and directly shareable**. Then show another person's different world using the same content contract and skill, not merely three scenery buttons.

That would give people a clear reason to try or star the project: they can build a portfolio that feels personal without coupling every content update to 3D editing. A spectacular clip can attract attention; easy first success and a second independent adaptation can substantiate the product. Whether either produces traction must be measured after real use; no star-count prediction follows from this research.

Suggested first scope is Bet 1's small experiment, followed by a deliberately narrow import/export editor from Bet 2. Keep Bet 3 as an optional test after entry objects and real links work. Do not begin all three as a single redesign.

## Research limits

This pass searches adjacent product mechanisms and reads author-maintained documentation, alongside our own source. It does not reconstruct a full competitor implementation, inspect every live page, verify all claimed accessibility/performance, test user demand, establish patent/copyright clearance or prove that a feature is absent elsewhere. Cost/time scores are estimates. The recommended gap is specific to this starter and proposed audience, not a claim that no other product addresses it.
