# Modular worlds: proposed architecture and first proof

Date: 7 October 2026. This is a research/design proposal, not an implementation or a release claim. It combines inspection of the current starter and skill with primary documentation for existing scene systems. No upstream code, scenes, media or skill wording was incorporated.

## Recommendation

Make **one portfolio core with optional authored world recipes**. Sea, mountains, space, city and nature are useful families, but a family must change the objects, composition, materials, motion and purposeful interaction. Five colors on the same landmark ring would repeat the problem the user wants to solve.

The more compelling product hypothesis is: **the same work becomes meaningful objects in different places, remains directly readable, and stays easy to update**. Modularity serves that outcome. A plugin API, a large recipe catalog and a travelling mascot are not, by themselves, distinctive inventions or evidence of demand.

Build a content-driven sea adaptation and a contrasting city adaptation first. City makes it harder to hide an unchanged circular journey behind new scenery. Keep mountain, orbital and nature briefs ready; add their runtime recipes when the first two expose the boundaries that actually need to be shared.

## What exists today

| Inspected source | Existing behavior | Remaining boundary |
| --- | --- | --- |
| [themes.js](../../src/themes.js) and [world.js](../../src/world.js) | Three authored procedural builders: sea, orbital and woodland, with different geometry, materials and ambient motion. | `world.js` is 1,495 lines, including all builders, renderer lifecycle, input, camera and sea effects. A private `BUILDERS` lookup is not a documented recipe/plugin contract. |
| [navigation.js](../../src/navigation.js) | Shared clockwise/counterclockwise destination cycle and continuous route phase. | All worlds still use the same five collection destinations. They are not five independently designed navigation grammars or free-steering games. |
| [content.js](../../src/content.js) | Validated stable item IDs, explicit publication, bounded plain text, safe links and public draft filtering. | The IDs belong to readable entries; individual entries do not yet create or reconcile scene objects. |
| [main.js](../../src/main.js) | One content snapshot drives the reader; selection and collection hash/history are synchronized. Refresh replaces valid content atomically. | Routes address collections, not individual entries. Refresh changes text while the five scene landmarks remain fixed. Sea-specific controls are explicitly wired into the page. |
| [content documentation](../content.md) | Local development rereads JSON without rebuilding content. Static output is a published snapshot. | No hosted CMS, production runtime provider, canonical entry pages or complete no-JavaScript portfolio is included. The WebGL fallback reader still uses JavaScript. |
| [verification record](../verification.md) | Previous browser checks, CPU geometry checks, bounded resource checks and skill brief-generation test are recorded separately. | This report performs source inspection only; it does not add a real Claude/Codex invocation, GPU/device benchmark or newly rendered adaptation. |

The current lifecycle already provides a useful starting point: capped pixel ratio, animation suspension when hidden/offscreen, deliberate paused selection, texture/geometry/material cleanup and a readable WebGL failure path. Extract those responsibilities carefully rather than replacing working behavior with a framework migration.

## Four boundaries, with a small core

```text
Local file or optional CMS adapter
              ↓ validated public snapshot
Portfolio core: identity, entries, publication, selection, routes
              ├── HTML index and entry pages
              └── authored world recipe → existing Three.js renderer
                         ↑ semantic actions from shared controls
```

| Boundary | Owns | Does not own |
| --- | --- | --- |
| Content adapter | Fetching/reading, normalization, validation, source/freshness diagnostics and publication filtering. | Meshes, camera coordinates, keyboard policy or public credentials. |
| Portfolio/interaction core | Collection and entry IDs, canonical URLs, selected entry, focus, browser history, filters and semantic actions. | A boat, forest growth animation, orbital transfers or city architecture. |
| World recipe | Meaningful object mapping, layout, material/light direction, ambient and selection motion, camera composition and optional instruments. | The biography text, authoritative paper status, publishing rules or reader markup. |
| Renderer host | Canvas, frame scheduling, viewport/quality limits, reduced motion, pause, context failure, resource scope and input/picking plumbing. | Which object means a paper or how a city district feels. |

Keep the content/reader independent of Three.js. Keep the first renderer implementation explicitly Three.js: a renderer-neutral scene description would add complexity before a second renderer exists. React Three Fiber can be an optional host adapter later for an existing React site; the skill must preserve a user's Astro, Next, vanilla or other working stack. Neither React nor a physics engine is a prerequisite.

Selection should dispatch the same `selectEntry(entryId)` operation from a scene hit, keyboard control, list link or direct URL. Reading starts immediately. Optional movement continues separately; no arrival, game score or animation completion should gate the entry. Keep selected entry, travel target and traveller pose as separate state where travel is used. Use `selectCollection(collectionId)` for the overview and `leaveExploration()` for focus release.

## Proposed recipe contract

The first contract should be an ordinary repository module, not a package ecosystem. Add only the seams needed by the first two real adaptations. The following is illustrative API design, **not shipped code**:

```js
recipe = {
  id: 'aegean-observatory',
  family: 'sea',
  apiVersion: 1,
  version: '0.1.0',
  capabilities: ['entry-selection', 'overview', 'guided-travel'],
  assetIds: ['aegean-authored-geometry'],
  create({ root, resources, quality, invalidate, dispatch }) {
    return {
      reconcile(publicEntries, layoutState) { /* stable entry anchors */ },
      select({ collectionId, entryId }) { /* immediate visual selection */ },
      resize(viewport) { /* authored overview/selected framing */ },
      tick({ delta, elapsed, selection }) { /* request only necessary frames */ },
      dispose() { /* release recipe-owned resources */ },
    };
  },
};
```

`reconcile` returns the entry-to-anchor lookup and updated layout state; anchors associate a selectable object and label position with a domain ID. The host uses that lookup for picking and HTML controls. `tick` returns whether continued motion is necessary; recipes must not start independent animation loops. Pause stops the clock and camera, while deliberate selection/resize can invalidate one frame. A static recipe need not implement ambient motion.

Capability declarations describe implemented behavior, not aspirations. Optional guided travel, an inspection instrument or relation view can expose small family-owned methods only when that implementation needs them. The host hides unsupported controls. Do not export sea-specific `F`, wave spacing and voyage camera as universal requirements. The current sea reflection is a renderer pass with explicit ownership and quality cost; extract a bounded pass hook only if preserving that effect requires one.

Validate known API versions and configuration before mounting. A mismatch should retain the HTML portfolio with a useful diagnostic. A recipe release version identifies the implementation; a layout-policy version identifies placement changes. Neither should silently change an entry's URL. `dispose` must be idempotent; recipe switching should release its resources and listeners without disposing resources still owned by the host or a shared cache. Abort late async loads before installing an obsolete recipe.

Start with a whitelist registry and load the selected local recipe. No remote executable plugin marketplace, bundled all-world download or mandatory account is necessary for first use.

## Stable objects and updates

Keep factual records in the existing content model. A separate authored world configuration chooses object roles and optional placement overrides. For example, a paper may be an inspectable specimen at a sea observatory and a labelled archive exhibit in a city. Object scale must not imply citation count, impact or accomplishment unless that metric is real, chosen and labelled.

Use a persisted ID-to-slot map, a layout seed and a layout-policy version. Sorting all entries anew or taking a hash modulo the new entry count will move unrelated objects on every addition. Existing IDs retain their slots; new records receive vacant slots, removed records release theirs and an explicit layout revision can recompute a whole region. A simple fixed-capacity region plus a full HTML index is a better first implementation than trying to show all 1,000 validated entries as meshes.

An update is validated and filtered before replacing public state. A valid empty collection stays empty. A malformed update keeps the last validated session state with accurate source/freshness information. Publication filtering must cover lists, detail pages, scene objects, search, feeds and sitemap. Relations should use authored IDs or declared tags; decorative connections must not be presented as scientific citations or factual collaborations.

Define one entry URL resolver shared by the list, reader, scene and generated metadata. Prefer ordinary build-generated `entry/<stable-id>/` HTML pages for the first static release, with a configurable deployment base path. A direct page opens the readable entry even when WebGL or JavaScript is unavailable; enhancement may restore its world selection. Changing the world should not change the entry URL. Existing collection hashes can remain backward-compatible overview links.

Local JSON remains the zero-account path. Static deployment changes still require publishing a new snapshot or replacing a publicly served data file; adding pre-rendered entry HTML also requires regenerating that HTML. A runtime CMS adapter is optional, server-side and separately tested. Do not promise no rebuild everywhere merely because local Refresh works. A content editor/import-export desk can follow once the schema and first editing workflow are proven.

## Five recipe families: different grammars

These are briefs to author, not implemented packs. A family can support multiple individual stories; its objects are examples, not mandatory assets.

| Family | Objects and spatial meaning | Material/light/motion grammar | Purposeful interaction beyond selecting text |
| --- | --- | --- | --- |
| Sea | Research specimens at an observatory; projects as workshop modules; journals as chart leaves; authored journey as marked bearings. Individual records occupy small inspectable docks or instruments. | Limestone, timber, brass, linen; contact with water; sails/wake and restrained beacon motion. | An inspection lens reveals selected work and declared related entries. Guided sailing is optional. The existing analytic field remains an illustrative study, not evidence from a paper. |
| Mountains | Topic groups as valley camps; projects as workshop shelters; papers as field stations; factual milestones as an authored trail. | Rock strata, timber and snow where appropriate; changing silhouette/elevation, clouds and instrument tilt. | A contour/section view exposes entry layers or an authored chronology, with equal access from a list. Height expresses layout, not prestige; no forced climb. |
| Space | Individual work as docked laboratory modules, specimens or survey instruments; declared relationships as readable transfer links. | Ceramic, brushed metal, dark negative space; sparse optical light; instrument tracking and slow transfer arcs. | A selected instrument focuses an entry and can reveal only its authored links/tags. Orbiting particles must not stand in for all content or create unlabeled relationships. |
| City | Projects as working façades/workshops; papers as an archive; writing as a reading room; recent news as a public board. Entries occupy visible labelled bays in distinct districts. | Stone, metal and window glass; strong street/pavilion composition; shutters, tram/light responses when useful. | A district unfolds into inspectable entry bays while the rest of the city stays legible. Timeline or topic changes reorganize the chosen view deliberately, without a compulsory travel loop. |
| Nature | Entry specimens, maker structures and field journals in gardens/clearings; authored topic groupings rather than an inferred knowledge graph. | Bark, earth, leaves and translucent glass; canopy movement and quiet pollinator/light cues. | Examine a labelled specimen and highlight declared tag neighbours. Seasons may be an optional aesthetic mode, never a fabricated progress or scientific-growth claim. |

The shared reader, entry identity, publication rules, direct selection and focus policy survive unchanged. Each family owns composition, geometry, material character, environmental light, object response and optional travel. Shared geometry helpers and resource utilities are useful; one compulsory camera path, one compulsory mascot and one catchall animation vocabulary would flatten the art direction.

## Resource, accessibility and reuse limits

Use a bounded first composition: a handful of featured objects and a complete paginated/indexed reader. Record actual draw calls, texture/geometry counts, transfer bytes and device timings before expanding density. Keep the existing DPR cap of 1.5 as an initial ceiling, not a frame-rate guarantee. A low-quality mode can remove reflections and expensive shadows without removing entries. Load one world at a time; instance repeated props; avoid large texture packs by default. Hidden/offscreen/static scenes should stop scheduling frames, not merely skip drawing.

Every optional interaction needs an ordinary control with a meaningful label and a keyboard/touch path. Capture exploration keys only while the world has explicit focus; Escape, blur and visibility loss release interaction state. A phone should retain ordinary page scrolling and a readable content layout. Reduced motion and WebGL failure are separate test cases, with direct entry reading preserved in both.

Maintain the existing authored/dependency/license/permission ledger, adding recipe ID/version, source, changes, asset IDs and required notices. Original procedural geometry can keep the starter free of paid models and textures. A top-level code license does not license a future portrait, paper figure, font, sound or imported model. Generic mechanisms can be independently implemented; copying distinctive code/art still requires its own reuse basis. Credits are not a substitute for permission. Neither this architecture nor the comparison proves uniqueness or immunity from claims.

## What precedents establish

| Primary source inspected | Established mechanism | Lesson for Personal Worlds |
| --- | --- | --- |
| [OpenVGAL architecture](https://github.com/lbartworks/openvgal/blob/main/ARCHITECTURE.md) and [README](https://github.com/lbartworks/openvgal) | Content JSON, reusable room templates, a viewer/runtime, layout/catalog and a browser generator producing a deployable gallery. | Content-to-space and reusable templates already exist. A narrow portfolio purpose and meaningfully different personal metaphors must be demonstrated. |
| [ORBIT](https://github.com/HenrikBrehm/orbit) | Typed site/scene configuration plus a portfolio customization skill and documented fallback tiers. Its README explicitly restricts reuse under a commercial license. | Configuration and an AI skill are precedents. Inspect the mechanism; do not import its code or scene into this free starter. Its performance claims were not independently tested here. |
| [React Three Fiber scaling](https://r3f.docs.pmnd.rs/advanced/scaling-performance), [object lifecycle](https://r3f.docs.pmnd.rs/api/objects), [Drei AdaptiveDpr](https://drei.docs.pmnd.rs/performances/adaptive-dpr) | Demand rendering, explicit invalidation, resource reuse, instancing/LOD, performance adaptation and lifecycle-aware disposal. | These are mature engineering mechanisms, not novel features. Adopt the relevant principles in the chosen host; a React migration is optional. |
| [Three.js disposal guide](https://threejs.org/manual/pages/how-to-dispose-of-objects.html) | Geometry, material, texture and render-target resources require appropriate cleanup; removing a mesh does not free all its resources. | Resource ownership is part of the recipe seam. Verify switching/remounting and shared-cache ownership rather than merely calling `group.clear()`. |
| [Earlier direct comparison](../uniqueness-review-2026-10-06.md) | Memory Palace, 3Dviz Pro Max, playable portfolios and interactive-portfolio skills are close category precedents. | Do not advertise the first 3D portfolio skill. The claim to earn is a useful, maintained multi-world portfolio workflow with real adaptation evidence. |

The primary sources above were read as documentation/source, not executed or visually re-inspected during this pass. This report does not measure their adoption. The wider repository attention/presentation survey is a separate evidence stream; popularity alone cannot validate an architecture or explain why it attracted users.

## Staged validation and skill packaging

1. **Extract without changing the current promise.** Preserve the three existing builders and browser behavior while separating host responsibilities. Check theme switching, selected collection, manual Pause, disposal and current reader. No five-pack launch is needed.
2. **Prove entry objects in one sea world.** Add a few labelled demo entries, stable placement and ordinary entry pages. Verify adding, editing, unpublishing and deleting an entry updates the corresponding object and reader without moving unrelated entries. Invalid/empty/provider-failure behavior stays explicit.
3. **Prove a contrasting city adaptation.** Use a different consenting identity or clearly labelled fictional identity and a different audience/content brief. Change geometry, spatial hierarchy, materials and selection response. The same core should survive, while the city avoids duplicating the sea's traveller/ring. A screenshot alone does not prove reuse or maintenance.
4. **Run one real agent workflow.** Record the actual user brief, recognized skill invocation, generated result, human interventions and one successful edit. Check desktop/phone composition, direct entry URL, focus/Back, reduced motion, WebGL failure and teardown. Separate installed/discovered skill evidence from successful host execution.
5. **Generalize from observed differences.** Publish the recipe contract only after the two implementations use it. Then add mountain, orbital and nature recipes selectively, with their own demo, resource report and license record.

Keep the existing `build-personal-world` skill as the entry point. Put shared decision-changing guidance there: preserve story/stack/budget, map identity to content/object/motion/interaction, retain readable routes, define updating/publication and report actual proof. Route substantial recipe-specific material through references only when chosen. Keep renderer details and provider details separate; do not load all five family manuals for every request. The skill is usable on another repository without assuming this starter exists.

Avoid converting this into a mega-skill that requires every successful repository's tools or patterns. Add deterministic helpers only for repeated tasks we actually support, such as validating a manifest or producing a clean example adaptation. The user's request for a reusable skill does not automatically authorize deployment, external posting or redistribution of another person's content. No runtime/skill/README change or external publication was performed for this report.
