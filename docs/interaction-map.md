# From a world to the work

The Aegean idea was more than a coast. Sail to an observatory, inspect a real
project or figure through an instrument, then return to the place you left.
The setting should change the instrument and the way it moves. The work, its
explanation and its source should remain the same.

## What was present at the start of this refinement

Source audit on **2026-10-08**, before the theme-specific inspection refinement:

| Part | What a visitor could actually do | Boundary |
| --- | --- | --- |
| Aegean boat and islands | Follow the circular destination route with focused arrows; open readable collections; choose an overview or closer voyage view. | Five collection stops, not a separate scene object for every project. Route navigation, not free sailing. |
| Small observatory telescope | Recognize the Research landmark. | Authored scenery. The telescope itself was not a pickable figure control. |
| Bronze lens above the water | Click the lens, press F or use the HTML control to reveal an adjustable two-source field. | An illustrative shader study, separate from the supplied figure and from any paper result. |
| Figure passage | Enter a supplied figure, switch between one to three supplied images and explanations, open the flat image, then restore exploration and focus. | A limestone/brass iris for every theme; its scene anchor was always Research. |
| Projects with figures | Open their inspection passage from each HTML entry button. | The Projects landmark did not select a particular project or open its instrument. |
| Orbital and woodland | Use their authored stations/clearings, capsule/firefly and common collection navigation. | Different scenery, but the inspection mechanism had not been translated. |
| Mountains and city | Read portable design guidance. | No shipped starter scenes or inspection builders. |

The [launch film](launch-video.md) used earlier footage and did not show the
figure passage. It therefore missed the clearest connection between exploring
the place and understanding the work.

## What is implemented locally now

The **2026-10-08 local source refinement** carries one action across three
settings: **Inspect this entry → choose a supplied view → Return**.

| Setting | Actual instrument | Opening and view changes |
| --- | --- | --- |
| Sea | Limestone and brass optical housing with six hinged iris leaves | The iris opens and the supplied plate resolves in front of it; optical layers and the stage instrument change with the view. |
| Space | Rectangular scanner gantry with two shutter banks and a rail carriage | The banks fold and retract into side bays; the carriage advances between three view positions. |
| Nature | Timber specimen cabinet with glass doors and three drawers | The doors swing open; selecting a view extends its corresponding drawer beneath the plate. |

The picker lists **all published records with a figure**, including projects
and research. Each figure-bearing HTML entry has its own inspection button.
Collection activation uses the chosen record in that collection when available,
with its first figure-bearing record as the default; the ordinary index still
lists every entry. A Projects inspection is anchored to Projects, and a Research
inspection to Research.

The local source also binds all fifteen authored landmark sets to actual mesh
picking. The sea observatory includes its telescope. A tap uses the same
destination action as the HTML landmark; a drag or cancelled pointer does not
open it. Only registered landmark geometry is triangle-tested. The central
sea field lens retains its separate field action. These bindings have source
and raycast evidence; fresh browser gesture and visual-occlusion review is pending.

Native buttons inside the reader change the setting while keeping the selected
record, supplied view, caption, source links and visited-view progress. The
Kaimerva project now supplies three original explanatory diagrams so project
inspection is demonstrated independently of the illustrative wave study. These
are authored diagrams, not browser screenshots or research results.

These shells have different construction and movement. The shared plate displays
the supplied image without inventing a sensor reading, live simulation, 3D model
or paper result. This is an authored inspection mechanism, not automatic
generation of an instrument or scene object for every new entry.

## Reading and returning

The content carries its **stable ID, collection, title, body, caption, source
links, active view ID and image**. An entry without authorized media remains in
the ordinary reader. The theme changes the mechanism around the work.

Without changing settings, Return restores the saved camera, traveler pose,
route phase and invoking focus. After changing settings inside inspection,
Return opens the **new setting's atlas** at the selected collection. It does not
restore the previous setting's voyage camera or field. The selected supplied
view stays with the reader during the change. Manual Pause and reduced motion
remain authoritative; visited views are progress within this page session,
not a saved game or an achievement score.

A missing image or unavailable WebGL leaves the explanation, caption and native
image path accessible. Closing and focus restoration are shared across settings.
Media textures and the discarded instrument's geometry and materials are
released on replacement or disposal.

## Reuse the mechanism

The starter's [figure-passage.js](../src/figure-passage.js) and the optional
[portable module](../skills/kaimerva/assets/instruments/figure-passage.js) expose
the same bounded interface:

```js
// One authored instrument. Its host supplies the reader, camera and state.
{
  group,
  setStage(index, localImageUrl, immediate),
  update(dt, opening, immediate),
  dispose()
}
```

`opening` runs from 0 to 1. `index` addresses one of the record's one to three
supplied views. The optional module requires a compatible Three.js app and local
image URLs. It does not include a reader, camera, routes or CMS. Its integration
guidance and limits are in the skill's
[interaction translation reference](../skills/kaimerva/references/interaction-translation.md).

The boundaries are small: [main.js](../src/main.js) resolves the record;
[figure-reader.js](../src/figure-reader.js) carries reading and view state;
[world.js](../src/world.js) places the instrument and saves or replaces the world
pose; [content.js](../src/content.js) validates published records and media.
Another app can preserve these boundaries without adopting this starter's
layout, five collections or Three.js renderer.

## Translate the next useful action

Mountains and city remain **proposed settings and mechanisms**. A mountain
survey frame could separate authored project layers on a sectional rail. A city
workshop could unfold actual prototype stages on a bench. They need new geometry,
movement and implementation; the existing iris does not become either by being
renamed or recolored.

Other content needs other verbs. These extensions are **proposals**, not shipped
features:

| Content and action | A concrete thematic translation | Required source and behavior |
| --- | --- | --- |
| Compare a project before and after | A sea light table, city workbench or orbital alignment frame holds the two versions. | Two authorized images with accurate labels; the same comparison is usable through ordinary controls. Do not imply measured improvement from a visual change. |
| Read a journal field note | A survey cabin opens a dated log; a forest field station opens a specimen note. | The actual essay, film or photograph and its context. Reading stays immediate, with no mandatory discovery task. |
| Follow a documented journey | Harbor stops, mountain trail markers or station transfer arcs connect supplied milestones. | Dates and declared order; geographic positions only when supplied. A symbolic route must not claim to be a real travel track. |
| Find recent news | A lighthouse signal, city dispatch board or station receiver selects a dated update. | An actual date, short update and destination link. Signal brightness must not invent popularity or research importance. |

The meaningful action travels between worlds; its physical expression changes.
Build one complete opening, state change and return before adding another verb.
Automatic per-entry placement, a general world plugin API and free steering are
still separate work.

This page describes local source behavior and design boundaries. It makes no
claim about current public deployment, rendered quality or a new recording.
