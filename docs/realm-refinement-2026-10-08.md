# The portal as a graphics target — 8 October 2026

This local revision translates the approved Kaimerva icon's silhouette,
materials and lighting into native interactive geometry. The icon stays
unchanged. The coast is the first focal scene; the other settings receive their
own atmosphere and surface treatment, rather than copies of the stone arch.

## Implemented

- The world now leads the page, before the introductory portfolio copy. The
  coast starts in Sailing view with a boat-following camera and one selected
  destination cue; Atlas retains all five projected labels. Holding arrows,
  A/D or the touch direction buttons drives continuous closed-route sailing
  with acceleration, smooth heading changes, release braking and the existing
  wake. Paused/reduced motion uses one island per press. Reading stays immediate.
- The camera follows the canonical course while the boat can reverse, keeping
  a stable horizon. Its low course derives from static native scenery bounds;
  frames use constant-time pose updates. Explicit Atlas, field and portal
  changes cut to their checked poses. Very narrow panels and scenery that
  blocks the camera course retain Atlas. Returning from inspection also
  restores the sailing lens, phase, heading, motion and focus.
- Original shoreline dressing adds uneven timber jetties, submerged posts,
  braces, sagging rope, mooring hardware, warm lanterns, eroded ledges,
  depressed shore pools and layered cypresses. It has 40 meshes and 11,534
  effective vertices; instance transforms count toward that budget.
- A real pointed gateway stands on Journey's outer shore. Independent weathered
  stone courses, curved voussoirs, seams, geometric fissures and an inset gold
  diamond give it depth. Its aperture is physically open. Wet stepped foundations
  and small shore rocks meet the island; two static shadow-free lights provide
  restrained spill. Clicking its actual masonry selects Journey.
- **Approach the portal** selects Journey and enters its lower fixed-bearing
  voyage view. Arrows still follow the circular route, Enter reads, and Atlas
  returns to the overview. Pause and reduced motion resolve deliberate view
  changes without starting an ambient animation. The camera fits the complete
  gateway and reserves space for overlaid controls on narrow screens.
- Three original procedural panoramas supply per-theme sky, environment, fog,
  exposure and lighting. Sea moonlight and the shader's water glint share one
  direction and color. The shadow depth range includes the farther sky-aligned
  light. Existing bounded planar reflections include the new geometry.
- Three low actual headlands establish distance beyond the coast's loop. Space
  uses its own nebula/starfield and worn ceramic maps. Woodland has a moonlit
  canopy panorama, timber grain, moss fibres and continuous rolling ground
  extending beyond the clearings. Its central route keeps flat support.
- Paper/project images use untinted unlit material with both tone mapping and
  fog disabled. Atmosphere must not fade supplied evidence. The portable
  instrument copy has the same fix. Inspection elevation derives from actual
  scene mesh bounds, with a conservative floor: new masonry or canopy must not
  block a supplied image, including the lower portrait camera's sightlines.

## Edit points and ownership

| File | Role |
| --- | --- |
| [realm-portal.js](../src/realm-portal.js) | Masonry, opening, foundations, inset and local light |
| [realm-atmosphere.js](../src/realm-atmosphere.js) | Original panoramas and lighting/fog presets |
| [realm-surfaces.js](../src/realm-surfaces.js) | Original stone, timber, ceramic and moss studies |
| [coastal-detail.js](../src/coastal-detail.js) | Instanced shoreline construction and six owned surface maps |
| [voyage.js](../src/voyage.js) | Held-input motion, release braking, restored state and camera framing |
| [voyage-clearance.js](../src/voyage-clearance.js) | Low camera course derived once from the actual sea scene bounds |
| [world.js](../src/world.js) | Placement, ground, routes, camera fit, reflection and PMREM ownership |
| [data/world.json](../data/world.json) | Existing supported settings and exposure/light multipliers |

No runtime dependency was added. Three.js 0.186.1 remains the renderer, with its
MIT notice retained in builds. The new geometry and procedural texture math
were authored here with AI assistance. No game model, downloaded texture pack,
HDRI or reference-site artwork is used. Their records are in
[data/assets.json](../data/assets.json); the separately generated icon keeps
its [own attribution](branding.md#artwork-attribution).

Each generated surface owns its maps and disposes them once. The renderer owns
a small per-theme panorama/PMREM cache and releases it at teardown. Geometry
remains separate from the supplied-image carrier. The build explicitly copies
new imports and includes them in its content-derived module version.

## Bounded evidence

**78 tests passed** in the complete `npm test` run, including the real temporary
HTTP server/build test. It verifies that all six new scene/motion imports are served
with the current module version. The production build, syntax, whitespace and
bounded source/provenance checks also passed.

The standalone gateway contains **40 meshes, 7,806 vertices and 3,772 triangles**,
seven materials and three 128 × 128 maps. Each atmosphere has one 512 × 256
RGBA8 panorama. Each surface study owns three 128 × 128 RGBA8 textures.
These are construction/payload counts, not measured GPU memory or frame rate.

Native Three.js tests cover deterministic textures, equirectangular seams and
moon/light alignment; material color interpretation and roughness; the real
arch aperture, gold inset, finite geometry and exactly-once disposal. Actual
scene tests project every gateway vertex in its approach and atlas at
1280 × 660, 800 × 430, 390 × 430 and 320 × 430. Atlas tests use conservative
supplied label sizes; production fitting uses measured DOM boxes. These are
analytic projections, not screenshots or measured text wrapping.

A 4,096-phase sample of the actual closed boat route, both headings and a
conservative union of the whole vessel at its bank/pitch limits found a minimum
gateway-footprint clearance of **0.807847 world units**. The maximum sampled
route step was 0.006462 units. This is bounded clearance evidence, not a
continuous physics certificate. The 120 × 120 woodland ground keeps its center
at Y = −0.02 and has real distant relief. Resource events confirm the observed
world textures, materials and geometry release exactly once.

The sailing camera checks **30,720 native visibility rays** and **12,288
whole-craft configurations** across 512 route phases, four viewports, both
headings and three actual bank/sail states. At the lowest boat bob, camera,
hull, bow, stern and mast samples stay clear. The complete craft stays above
the lower control area. A separate **4,096-frame** forward/reverse sweep checks
the runtime eye smoothing with immediate boat tracking. Journey's shortened
harbor leaves 0.078 sampled clearance beyond the conservative whole-craft
radius, including intermediate reversal headings. These checks cover this
authored route and geometry, rather than arbitrary edited worlds or free physics.

One full-scene source check casts **8,100 real Mesh first-hit rays** across all
three settings, five collections, three stages, four desktop/phone viewports and
three loaded landscape/wide/portrait texture fixtures. It samples actual source
corners and the interior lower edge, including the gateway and canopy that
formerly blocked it. It uses the production inspection anchor/camera helpers.
Fog/tone-mapping/tint flags and sRGB interpretation are asserted. Texture loads
use explicit test fixtures; this is not a browser network or rendered-color test.

## Review and release boundary

Fresh rendered app review remains unavailable after the earlier browser-policy
block. No alternate capture or public deployment is used to bypass it. Native
geometry, source checks and a real build/HTTP test do not prove browser
appearance, shader output, frame rate, touch behavior or perceived realism.

The local preview is on port 4314. Review the paused overview, **Approach the
portal**, one open supplied image and the phone layout before accepting the
graphics. Space and woodland still use their earlier landmark forms; richer
station architecture and a more natural canopy remain future art-direction work.
The overview keeps its higher navigation camera; positive-elevation sky
features become visible in the coast's lower approach.

The public GitHub/Hugging Face demo and launch film still show the earlier
runtime. No current gameplay or quality claim is made from that footage. This
revision is not a photorealism, global uniqueness or legal-clearance guarantee.
