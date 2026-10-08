---
name: kaimerva
description: Create, redesign or customize a personal portfolio as an explorable 3D world, with coherent art direction, useful interactions, readable work and editable content. Use for spatial portfolio creation, thematic redesign or prompted changes to its scene, reading interface and interactions.
---

# Kaimerva

Kaimerva is spelled **K-A-I-M-E-R-V-A** and pronounced **kye-MER-vah**.
The name blends *kami* and *Minerva*. Its tagline is **“Summon your world.”**
This is the skill's identity; generated projects keep the user's own branding
and chosen design. The approved icon and its provenance are in
[assets/NOTICE.md](assets/NOTICE.md).

Turn a person's interests and work into a place visitors can explore. The world
should help people find the person, their work and their recent activity quickly.
Its memorable quality comes from a coherent metaphor and purposeful interactions.

Preserve the user's chosen theme, stack, CMS, budget and existing routes. A sea
example does not make sailing mandatory. An existing working site is useful
context, not permission to redistribute its personal content or third-party assets.

## Start from one rich brief

One initiating prompt can supply identity, actual work, audience, a desired
impression, a visitor action and editing constraints. Extract those facts before
making visual choices. Infer reversible design choices and state assumptions;
ask only for missing material facts or constraints. Demo records must be labeled.
A skill guides the host agent's work; it is not a renderer, asset service or
guarantee of an instant finished site.

For a creation request, carry the brief through implementation and rendered
review when tools permit. Do not end at a mood board or proposal. For a bounded
revision, preserve the existing architecture and solve that revision without
rebuilding unrelated systems. Skip world direction, architecture, provider and
asset work unless the change affects them. Apply the later guidance only to
affected components; for a hover edit, check its rendered hover/focus behavior
and applicable motion preferences rather than initiating a whole-world review.

## Choose the implementation path

For a new project that can use the bundled Three.js starter, read
[create-and-deploy.md](references/create-and-deploy.md). Run the relocatable
[scaffolder](scripts/create-world.mjs) from this skill's location into a new or
empty project directory. The complete starter is bundled in `assets/starter/`;
the original repository is not needed. Choose sea, orbital or woodland, then
personalize the generated source from the brief, install its locked dependency,
check and build it. A scaffolding command is a starting point, not completion
of a requested portfolio.

For an existing app, adapt its architecture instead. Do not scaffold over it or
replace its stack and CMS merely to use the starter. The optional instrument
below can also be integrated independently. New settings and mechanisms still
require authored code; the three supplied settings are not a generator for
arbitrary worlds.

## Find the design before the scenery

Inspect the existing app, content and applicable repository instructions. Read
the relevant installed framework documentation before changing version-sensitive
APIs. Establish the person's intended impression, audience and primary content
destinations from their request. Make progress on independent work while awaiting
any needed answer.

For a new world, hybrid or modular design, read
[world-composition.md](references/world-composition.md) to separate setting,
content roles, art direction, movement, interaction, reading and quality budget.
Choose a primary world and a compatible secondary influence; composition layers
are design decisions, not a claim that the app has a plugin API.

Read [theme-method.md](references/theme-method.md) when translating identity
into objects. For futuristic, cinematic or less generic direction, also read
[futuristic-direction.md](references/futuristic-direction.md): compare distinct
premises, resolve the paused composition and make one speculative mechanism
useful. Preserve a premise the user already chose. Inspect rendered references
when visual comparison is needed. Record what was actually observed; snippets,
transcripts and unresponsive pages are not visual inspection.

For creation or thematic redesign, write a small reviewable brief connecting:

`identity → content → spatial object → material → motion → interaction`

Include the overview, one selected destination and the mobile reading layout.
Choose objects for their meaning and silhouette. A new palette on unchanged
objects is a color variant, not a newly authored thematic world. Do not promise
that a design is unique merely because an AI generated it.

When an interaction should transfer between settings, read
[interaction-translation.md](references/interaction-translation.md). Carry the
selected record, supplied view and reading/return behavior; author a different
physical mechanism for the setting. A telescope that only decorates the scene
does not implement project inspection.

For a compatible Three.js app, the reference also documents the optional
[instrument module](assets/instruments/figure-passage.js) bundled with this
skill: three authored housings around one supplied image carrier. Keep the
existing stack if it does not use Three.js; adapt the interaction instead of
adding a renderer solely to import this asset. Read its integration contract
before copying it; it contains no reader, camera, routes or CMS.

## Build a dual interface

Keep content and selection independent of rendering. A stable ID should connect
its scene object, HTML control and readable content. Preserve ordinary routes
and a browsable index. When building a complete portfolio, give individual work
entries meaningful objects and direct readable links where appropriate; adding
one entry should not scramble unrelated placements. Implement and verify this
relationship before advertising automatic object creation or reconciliation.
Selecting a destination opens its content immediately; travel may continue
without delaying reading.

Keep reading selection, travel destination and traveler position separate.
Back closes the reading view and returns focus without resetting exploration.
Mouse picking and HTML activation should invoke the same selection operation.

When the user asks for a playable world, build a coherent optional loop:
enter → control the traveler → approach a meaningful object → act deliberately
→ receive visible feedback → inspect the work → return to the same session.
Give the player a clear objective and a native nearby action. Keep discoveries
separate from remote reading; direct portfolio access must not award travel
progress or require finishing the game. The bundled starter implements this
with approach-distance charting and persistent beacon feedback. Customize its
goal, objects and response for the person rather than merely adding a score.

Make optional keyboard exploration an explicit focused mode. Capture movement
keys only inside it, release input on Escape, blur or visibility loss, and leave
normal page scrolling intact elsewhere. Support short taps between frames.
Keep touch and keyboard alternatives usable when free steering is unavailable.

Pause freezes every ambient animation and the camera. Reduced motion uses static
states or deliberate discrete navigation. Content selection must still work.
Demand-driven painting should stop when static, offscreen or hidden and resume
on selection, resize or preference changes. Bound pixel ratio and rendering
passes; dispose geometries, materials, targets, observers and event listeners.
If WebGL fails, preserve the HTML content path and hide unusable play controls.

For moving objects near obstacles, check their full transformed footprint,
including turns, against actual scene geometry. Stop safely when no checked route
exists. Add this machinery only when the interaction needs it; a destination
selector does not need a full game engine.

## Keep updates independent of scenery

For prompt-driven changes to environment, objects, popups, controls or game
behavior, read [prompt-world-editing.md](references/prompt-world-editing.md).
Ground each request in actual project targets; use persistent configuration for
supported values and authored code for new mechanisms. Verify the changed
rendered behavior and provide an appropriate way to reverse the edit. This
workflow uses the host coding agent; a settings executor is not a browser LLM.

Read [content-and-cms.md](references/content-and-cms.md) when adding content,
editing tools or a CMS. Default a new reusable starter to local structured
content with explicit demo records. A provider boundary can support the user's
CMS later; do not require a paid platform or introduce a second CMS by default.

Keep credentials server-side. Distinguish an edited file, an acknowledged CMS
save, refreshed public content and deployment. An outage fallback is not a
last-known-good cache unless one is actually implemented.

For a generated starter, read its README for actual commands and supported
features. A copied skill carries the source bundle and needs no original
repository. Existing apps need not use that bundle; inspect their capabilities
instead of assuming its themes, dependencies or a hosted CMS are installed.

## Verify what visitors receive

Read the applicable parts of [review-and-rights.md](references/review-and-rights.md)
when the change needs interaction, asset or release checks. For a complete world,
review the actual desktop and phone composition, one content opening/closing
cycle, keyboard focus, Pause and the
fallback. Check richer navigation only when implemented. Separate deterministic
geometry checks from browser evidence and source inspection.

For new or changed reused assets, maintain a ledger covering code, fonts, icons,
images, geographic data and models. Record sources, licenses or permission,
required notices and changes.
Original procedural geometry reduces external asset dependencies; it does not
guarantee legal clearance. A public template must exclude personal/private
records and assets without a documented redistribution basis.

Return the implemented result, where the relevant choices are edited, what was
actually tested, and material unfinished work. Report local generation separately
from publication. For a complete world, include a rendered preview when tools
support it and an edit map separating personal facts from design direction.
A feature described in a brief is a proposal until implemented; a local
forward-test does not establish
automatic discovery or execution in another agent host.
