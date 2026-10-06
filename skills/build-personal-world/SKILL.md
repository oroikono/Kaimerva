---
name: build-personal-world
description: Build or redesign a thematic personal portfolio as an original interactive 3D world with readable content, accessible exploration, and maintainable updates. Use when the user wants a spatial portfolio or a reusable workflow for one, rather than an ordinary page edit.
---

# Build a personal world

Turn a person's interests and work into a place visitors can explore. The world
should help people find the person, their work and their recent activity quickly.
Its memorable quality comes from a coherent metaphor and purposeful interactions.

Preserve the user's chosen theme, stack, CMS, budget and existing routes. A sea
example does not make sailing mandatory. An existing working site is useful
context, not permission to redistribute its personal content or third-party assets.

## Find the design before the scenery

Inspect the existing app, content and applicable repository instructions. Read
the relevant installed framework documentation before changing version-sensitive
APIs. Establish the person's intended impression, audience and primary content
destinations from their request; ask only for missing choices that materially
change the result. Make progress on independent work while awaiting an answer.

When choosing or revising the metaphor, read
[theme-method.md](references/theme-method.md). Inspect rendered references when
visual comparison is needed. Record what was actually observed; snippets,
transcripts and unresponsive pages are not visual inspection.

Write a small reviewable brief connecting:

`identity → content → spatial object → material → motion → interaction`

Include the overview, one selected destination and the mobile reading layout.
Choose objects for their meaning and silhouette. A new palette on unchanged
objects is a color variant, not a newly authored thematic world. Do not promise
that a design is unique merely because an AI generated it.

## Build a dual interface

Keep content and selection independent of rendering. A destination ID should
connect its scene object, HTML control and readable content. Preserve ordinary
routes and a browsable index. Selecting a destination opens its content
immediately; travel may continue without delaying reading.

Keep reading selection, travel destination and traveler position separate.
Back closes the reading view and returns focus without resetting exploration.
Mouse picking and HTML activation should invoke the same selection operation.

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

Read [content-and-cms.md](references/content-and-cms.md) when adding content,
editing tools or a CMS. Default a new reusable starter to local structured
content with explicit demo records. A provider boundary can support the user's
CMS later; do not require a paid platform or introduce a second CMS by default.

Keep credentials server-side. Distinguish an edited file, an acknowledged CMS
save, refreshed public content and deployment. An outage fallback is not a
last-known-good cache unless one is actually implemented.

When using the accompanying Personal Worlds starter, its
[repository README](../../README.md) gives its actual commands and supported
features. A copied skill works without that repository: adapt this workflow to
the current project rather than assuming starter files or dependencies exist.

## Verify what visitors receive

Read [review-and-rights.md](references/review-and-rights.md) for the relevant
interaction, asset and release checks. Review the actual desktop and phone
composition, one content opening/closing cycle, keyboard focus, Pause and the
fallback. Check richer navigation only when implemented. Separate deterministic
geometry checks from browser evidence and source inspection.

Keep an asset ledger for reused code, fonts, icons, images, geographic data and
models. Record sources, licenses or permission, required notices and changes.
Original procedural geometry reduces external asset dependencies; it does not
guarantee legal clearance. A public template must exclude personal/private
records and assets without a documented redistribution basis.

Return the implemented result, where content/theme choices are edited, what was
actually tested, and material unfinished work. Report local generation separately
from publication. Include a rendered preview when tools support it.
