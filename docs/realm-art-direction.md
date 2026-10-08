# A place with the presence of the portal

The approved portal has a clear visual idea: a weathered pointed doorway,
moonlight across the sea, warm stone edges and a cold luminous opening. Its
scale and contrast make the viewer feel close to a place worth entering.

This critique compares the approved [portal artwork](../assets/brand/kaimerva-icon.png)
with the retained [sea](assets/sea.jpg), [orbital](assets/orbital.jpg) and
[woodland](assets/woodland.jpg) overview captures. Those captures show earlier
recorded versions, not the current app. Source inspection informs the layout
constraints below. This document does not establish current rendered quality,
frame rate, physical realism or a deployed result.

## What creates the difference

| Portal artwork | Earlier world captures | Target for the actual scene |
| --- | --- | --- |
| One large pointed silhouette leads the composition. | Five small landmarks have similar size and visual weight. | Give the coast one clear monument; keep the other destinations legible as supporting places. |
| The camera looks along the water toward a threshold. | High overview cameras make the worlds read as miniature menus. | Keep the useful atlas and add a deliberate lower approach to the monument. |
| Chipped stone, seams, a metal inset and wet foundations give the object mass. | Coast forms are pale and soft; orbital platforms and forest forms repeat simple shapes. | Use structural detail: edges, joints, load-bearing feet, material changes and wear related to water or construction. |
| Bright inner edges and a narrow moon reflection sit within a dark scene. | Sea is broadly bright; orbital objects are broadly white; forest objects have similar green values. | Separate key light, quiet fill and a restrained active accent. Let material faces retain shadow. |
| Foreground rocks, the arch, distant water and mist establish several depths. | Space is mostly empty navy; forest has a visible circular base; sea lacks a strong horizon in the overview. | Add a small number of actual foreground, middle and distant forms appropriate to each setting. |

The circular route and readable labels already explain how to explore. They
should survive the change. Visual detail should make an entry feel situated,
without covering its label, adding a mandatory introduction or delaying reading.

## Finish the coast first

1. **Build the threshold as real geometry.** Use a pointed stone gate with
   asymmetric chips, substantial feet, inset brass and a narrow luminous edge.
   Support it on the existing Journey island or pier. The opening must remain
   open geometry: looking through it reveals the same surrounding world.
2. **Make the lighting agree.** A dark indigo sky, cool directional rim and
   restrained warm stone edge should agree with the water reflection and fog.
   Changing the background alone leaves daylight-looking objects in a dark scene.
3. **Give the monument a deliberate approach.** A fixed-bearing view near the
   water establishes scale. The atlas remains an immediate, readable alternative.
   Keep selection and reading usable throughout the transition and while paused.
4. **Add depth around the route.** A few low rocks, distant silhouettes and
   sparse low mist give the sea a setting. Keep the water corridor and sightlines
   open; detail should not fill every empty area.

At the start of this revision, the sea shader had a fixed `sunDirection`, warm glint color and blue
atmospheric tint. The sky/environment and theme lights are configured separately
in [world.js](../src/world.js). The refinement should connect these values to
one atmosphere direction so the highlight, sky and illuminated side of the gate
agree. The existing reflected-camera pass can reflect new scene geometry.
Keep its bounded render-target resolution rather than adding a second reflection
system without evidence that it is needed.

The supplied work must retain its source colors. The image carrier's untinted,
non-tone-mapped material is independent of the cinematic scene lighting.

## Carry the visual language into other settings

These are art-direction targets, not claims that every change is implemented.

| Shared parameter | Coast | Orbital | Woodland |
| --- | --- | --- | --- |
| Dominant silhouette | Pointed stone threshold | Anchored station receiver or angular gantry | Tall timber cabinet or canopy shelter |
| Surface detail | Stone seams, chipped edges, wet lower surfaces, brushed brass | Panel joints, ceramic shell, darker metal supports, restrained task lights | Timber grain, joinery, soil contact, slender branches and layered leaves |
| Key/fill contrast | Cold moon rim and quiet warm threshold edge | Cold distant key, darker structural faces and limited amber/cyan equipment light | Cool canopy fill and a small warm light at the work area |
| Foreground/middle/distance | Low shore rocks / islands / distant headland | Nearby structural fragments / stations / a curved celestial limb | Roots and grasses / clearings / a fading canopy line |
| Atmospheric density | Sparse low mist above the water | Thin luminous haze that preserves the station silhouette | Low mist between trunks, with distant foliage losing contrast |
| Motion scale | Water, a restrained wake and occasional threshold shimmer | Slow distant movement and discrete equipment responses | Mild canopy motion and a small firefly; no constant movement of every tree |

Reuse contrast, scale, material logic and layered depth. Author each setting's
forms. Recoloring the same pointed gate for all three settings would weaken their
identity. A distant sphere or structural arc supplies real depth in space;
scattered flat sprites should not masquerade as nearby architecture. The portal
PNG remains branding and direction; it does not replace the navigable 3D scene.

## Placement and camera constraints

The coast's five stop centers lie on a radius-six ring. Their current XZ
positions are approximately: Projects `(-3.728, -4.701)`, Research
`(3.319, -4.999)`, Journal `(5.779, 1.612)`, Journey `(0.253, 5.995)` and News
`(-5.623, 2.093)`. The boat's route control points use 64% of those positions;
the actual route is a closed Catmull–Rom curve.

A practical first gate is roughly **3.6–3.8 units wide, 4.5–5 units tall and at
most 0.7 units deep**, mounted at Journey and facing the existing fixed camera
bearing. These are layout starting values. Its feet need real ground or pier
contact. Keep its footprint out of the boat corridor and the central field lens.
Raise Journey's label above the crown and fit the gate's transformed body bounds
as well as all five labels. A label-only fit does not prove the arch is in frame.

For the optional closer approach, a horizontal camera offset of **7–9 units**
and vertical offset of **1.3–1.8 units**, aiming near **1–1.5 units** above the
water, is a useful source-level starting point. That is a much lower elevation
than the existing voyage offset. Keep the bearing stable and the camera above
the water. Do not apply this pose to every landmark without checking occlusion.
The figure-inspection camera remains separately framed for its readable plate.

Before accepting placement, sample the actual curve and check the vessel's
full transformed footprint, including turns, against the gate, foundations and
new shore objects. Nominal route radius is insufficient clearance evidence.
Atmosphere should not become a pick target; keep selection limited to registered
landmarks and the existing field instrument.

## Review and provenance

Compare the overview, one lower approach, a selected landmark and an open figure
on desktop and a narrow viewport. Check label/body clearance, source-image
legibility, opening/return, Pause, reduced motion, native reading and missing
WebGL. Inspect the paused composition before adding more effects. New procedural
geometry should have a measured mesh/vertex budget and disposed resources;
performance remains unmeasured until tested on a stated device.

Author the gate, materials and atmosphere in project source and record them in
the asset ledger with their authorship and changes. Existing Three.js notices
remain required. The approved generated artwork keeps its
[separate attribution](../assets/brand/ATTRIBUTION.md). No game model, downloaded
texture pack or reference-site artwork is required for this direction. Original
procedural work still does not establish global visual uniqueness or legal
clearance. The implemented translation and its bounded checks are recorded in
[the local revision notes](realm-refinement-2026-10-08.md).
