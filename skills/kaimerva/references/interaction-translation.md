# Translate the action, not just the scenery

Read this when a user wants an existing signature interaction carried into
another setting. Preserve the meaningful visitor action and its content. Author
a new object and transition for the chosen place; changing the name and palette
of the old apparatus is insufficient.

## Start with an inspectable entry

Identify one real entry and what a visitor should understand after inspecting
it. Carry its stable ID, title, readable explanation, authorized media, caption
and source links. Views must be supplied or explicitly authored and labeled;
they are not invented scientific evidence. A project image can support inspection
without making the project a paper.

Define three actions before geometry:

1. **Inspect(entry ID):** immediately open the selected entry's explanation and
   media. Optional motion approaches the instrument without gating the content.
2. **View(view ID):** select a real supplied detail or stage. The selected state
   appears in text as well as in the instrument's movement.
3. **Return:** restore the visitor's world view, selection, motion preference
   and invoking focus. Closing during a transition must also work.

Use the same actions from scene picking, ordinary buttons and keyboard controls.
Keep an ordinary readable route even when the scene or media fails. More entries
need an intelligible picker or their own controls; selecting a collection should
not silently choose an arbitrary paper when several deserve equal access.

## Choose a physical reading mechanism

| Chosen world | Mechanism to author | View action | Content it can truthfully show |
| --- | --- | --- | --- |
| Sea | Observatory telescope housing, hinged optical shutter and a suspended plate | Focus between labeled supplied plates | A figure, project photograph or authored diagram with its explanation |
| Mountains | Survey frame, sectional rail and offset plate supports | Move the sectional handle to a supplied layer | Actual authored process stages; no inferred geological or research depth |
| Space | Docking receiver, retracting panels and a linear scanner carriage | Advance the plate to a labeled stop | Actual images and descriptions; no fake sensor readout |
| City | Folding workshop bench, task light and prototype plate | Unfold a selected process view | Supplied prototype stages or before/after images with honest labels |
| Nature | Timber specimen cabinet with hinged glass doors and sliding drawers | Examine the selected labeled view | Supplied specimen/work images; no generated biological classification |

These mechanisms share a reading operation. Their housings, hinges, supports,
clearances, camera approach and state movement differ. If the chosen content is
better understood through a comparison, time slider or declared relationship,
implement that different action deliberately; do not advertise it as already
provided by this inspection pattern.

## Keep three boundaries

**Content:** the stable entry and view IDs, validated media, caption and links.
The theme must not change publication status or claim new results.

**Inspection:** the active view, loaded/error state and visited view IDs, plus
the return snapshot. Remember visited views only as visitor progress, without
assigning scores to the person's achievements. Retain a view ID on content
refresh when it remains; close safely if its entry is unpublished or removed.

**Instrument:** authored geometry, materials, transition and media placement.
Give it a bounded open/update/view/dispose interface appropriate to the app.
Open geometry must not mask the source image. Motion can be instant when paused
or reduced; reading and view selection still work. Release obsolete textures,
geometry, listeners and observers on replacement or teardown.

Snapshot the camera, traveler/route state and invoking focus before inspection.
Do not tie Return to replaying a whole journey. Preserve Back behavior and direct
links from the existing app rather than introducing a competing router.

## Finish one translation before advertising it

Use one supplied entry to review both the old and new setting. Exercise Inspect,
all supplied views, Return, interrupted opening/closing, Pause, keyboard focus,
phone reading and unavailable WebGL or missing media. Check visible silhouette
and movement separately from source validation. A factory test does not establish
rendered quality; report unavailable browser evidence honestly.

## Optional working instrument module

The copied skill includes [figure-passage.js](../assets/instruments/figure-passage.js).
It is original code from the starter, with three implemented housings: sea iris,
orbital gantry with folding/retracting shutters, and woodland cabinet with
hinged glass doors and moving drawers. Its geometry and lifecycle tests run
against Three.js 0.186.1. It does not include the starter's world or HTML reader.

Use it only in a compatible browser-based Three.js project. Resolve its bare
`three` import through the existing bundler or import map. A local, same-origin
HTTP(S) image is required; do not point it at private media or credentials.

```js
import { createFigurePassage } from './figure-passage.js';

const instrument = createFigurePassage({
  anchor: new THREE.Vector3(0, 0, 0),
  bearing: 0,                     // radians around the vertical axis
  theme: 'orbital',               // sea, orbital or woodland
  onInvalidate: requestPaint,     // your demand-driven paint scheduler
  onImage: ({ ready, stage, error }) => updateImageFallback({ ready, stage, error }),
});
scene.add(instrument.group);
instrument.setStage(0, '/figures/project-overview.svg', true);
instrument.update(0, 1, true);     // fully open, immediately static
// When replaced or unmounted:
instrument.dispose();
```

The host owns the selected record, supplied view descriptions, reader and return
snapshot. `setStage(index, imageUrl, immediate)` accepts indices 0–2. Call
`update(dtSeconds, opening, immediate)` while a transition runs: `opening` is
0–1, and the return value says whether the stage mechanism still needs a paint.
When paused or reduced, resolve deliberately requested states immediately and
stop ambient frames. Keep a native image and text fallback from the start.

To translate the active work, dispose the old housing and create the new theme
with the **same entry, view and image URL**. Refit the camera to the transformed
open geometry, including forward-swinging doors, and reserve room for controls.
The module does not fit your camera, pick scene objects, restore focus or route
the page; the host must implement and review those connections. Preserve the
[MIT notice](../assets/NOTICE.md) when redistributing covered code.

Mountains and city are design proposals above, without scene modules in the
kit. This is a bounded working component, not automatic generation of an object
for every entry, an engine-independent runtime or a general plugin registry.
