# Futuristic direction

Use when the requested world should feel speculative, cinematic or unusually
creative. This reference guides art direction; it does not add runtime features.
The mechanisms below are optional design concepts, not shipped capabilities or
claims of first invention. Adapt them to the person's work rather than importing
an entire example.

## Choose an authored premise

Before detailing the scene, compare two or three materially different proposals.
For each, write one sentence connecting a personal quality to a place and one
useful action. For example: “A field researcher gathers evidence in a suspended
quarry archive; selecting a sample reveals its source.” A palette change or a
different vehicle on the same map is not a different premise.

Compare the proposals on recognizability, clear access to real work, distinct
silhouette, feasible rendering cost and ease of adding another entry. Use quick
composition sketches or existing project tools; do not create three complete
applications. Choose the direction that makes the person's content more legible
and memorable. Record why the other directions fit less well. Honor a direction
the user already chose without making this comparison an approval gate.

Give the chosen world a short material vocabulary and one speculative mechanism:
weathered stone with a precise moving aperture; timber with suspended ceramic
instruments; planted concrete with a folding archive. Contrasting familiar
surfaces and unfamiliar behavior can feel futuristic without compulsory neon,
particles, holograms or a cyberpunk palette. Let one mechanism dominate.

## Compose before animating

Build a convincing paused view first. Reserve the identity and work labels before
placing decorative geometry. Give the important object an identifiable outline,
separate it from the background, and use foreground overlap to establish scale.
Avoid equal spacing and identical pedestal objects unless the content demands
that regularity.

Resolve these visible decisions before adding detail:

- **Contact:** objects sit, hang or float for a clear reason. Add a believable
  contact shadow, support or reflected separation; avoid accidental hovering.
- **Materials:** differentiate rough stone, satin metal, translucent panes and
  living surfaces by roughness, light response and restrained surface variation.
  Independently authored geometry and procedural textures can suffice.
- **Light:** choose a directional source and a quieter fill. Keep readable type
  independent of dramatic scene exposure. Preserve highlights rather than making
  every surface emissive.
- **Depth:** distinguish near, middle and far forms through overlap, contrast and
  limited atmospheric falloff. Fog should clarify scale, not conceal unfinished
  geometry.

Do not promise photorealism from a shader or a video edit. Favor a coherent visual
language that looks deliberate at the available device budget. Use locally
authored assets first when suitable; record licenses for anything reused.

When approved key art sets the target, identify what actually creates its
presence: silhouette, material wear, lighting direction, scale and camera height.
Translate those into the interactive geometry. Keep a useful overview and add
a deliberate lower approach where appropriate; the same model can read as a
miniature from above and as architecture near the ground. Align the sky's light,
water glint, reflections and fog instead of tuning each independently. Check
the full body, footing and label against the camera, and the full moving vessel
against the route. A branding image does not replace the navigable world.

Give supplied paper/project imagery its own color-preserving path. In Three.js,
an unlit white image material with `toneMapped: false` also needs `fog: false`
when a cinematic scene uses haze. Verify actual supplied aspect and color-space
handling; a distant phone camera can otherwise fade evidence into the atmosphere.

## Make the instrument about the work

Choose one primary instrument from actual content: a figure inspection lens, a
before/after comparison, a chronological section, a tag filter or an editable
prototype. Specify its input fields, visible response and equivalent readable
control. A beautiful oscillating field can be an aesthetic effect. Calling it a
simulation, causal relationship or measured result requires that evidence.

Keep entry IDs and ordinary links independent of position. Adding a project
should preserve other entries' identities and sensible locations. Clear labels
such as Research and Writing remain available alongside the metaphor. Reading,
contact and CV access must not require driving, solving a puzzle or collecting
objects.

## Choreograph discovery, selection, reading and return

At arrival, reveal a composed world with immediate access to work. Hover or focus
can produce a restrained response at the actual selectable object. On selection,
open the readable content immediately; camera movement is accompaniment, not a
loading ceremony. Establish one destination and avoid rotating the whole scene
while a person reads.

Prefer a short eased reposition with a stable horizon to repeated swoops. Use a
cut or crossfade if travel makes text difficult to follow. Returning closes the
reading view, restores control focus and retains exploration context. Make the
static or reduced-motion equivalent a considered composition of its own. Optional
sound and movement never carry essential information alone.

## Optional hybrid mechanisms

| Concept | Useful behavior grounded in content | Art direction only |
| --- | --- | --- |
| **Mountain × city: section archive** | Terraced workshops represent entries grouped by a supplied year or category. Selecting one opens its record and a cutaway view; filtering exposes matching terraces while preserving IDs. | Rock strata, suspended bridges and folding light planes suggest excavation. Geological depth does not imply research quality or historical importance. |
| **Nature × space: specimen conservatory** | Projects inhabit distinct specimen mounts. Supplied tags select a clearly labeled group; a lens enlarges an actual authorized image or opens its source. | Slow canopy motion, ceramic supports and optical rings suggest a living observatory. Proximity is compositional unless an explicit relationship is supplied. |
| **Sea × city: tidal workshop** | Each making project occupies a dockside instrument. A selected prototype can expose real version notes or an implemented before/after comparison through ordinary controls. | Water, mechanical shutters and a lit sectional quay establish atmosphere. Tide height or light intensity is not a completion score or an analytics claim. |

Mix a primary world with one secondary influence; a collage of five unrelated
visual grammars usually weakens identity. Keep these mechanisms replaceable so
another world can retain the same content and reading behavior.

## Review the rendered result

Capture the actual overview, selected state and narrow-screen reading view.
Inspect silhouette, contact, material contrast, typography and identity; inspect
interaction and motion separately. A polished render in a design document does
not establish browser quality. Compare the result with the chosen premise and
revise composition before layering more effects.

Choose bounded resolution, shadows and passes appropriate to the application.
Report frame timing, loading or memory only when measured, including device and
method. If measurement tools are unavailable, state that performance remains
unmeasured. Distinguish implemented behavior, proposed mechanisms and aesthetic
effects in the final demonstration.
