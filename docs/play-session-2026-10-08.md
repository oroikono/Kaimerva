# An optional play session

The current starter now has an exploration loop:

**Enter → steer → approach a beacon → chart it → read/inspect → return.**

**Enter the world** puts the scene and player controls in the viewport. The sea
uses the boat-follow camera; orbital and woodland retain their overview.
All three settings support held Right/D or Left/A movement along their authored
routes. Releasing the input brakes the traveler. Touch has held direction
buttons and a native nearby action. Space charts from the world surface; E also
works when a play control has focus. Native button Space/Enter behavior stays intact.

## What makes the action meaningful

Each beacon is attached to a reachable route approach point. The host samples
the traveler's actual 3D distance from those points. Within 1.4 world units,
**E / Space** or **Chart this place** charts that destination and opens its work.
Passing a place, selecting its name or reading remotely does not grant discovery.
The traveler stops for the action, so an ordinary reader cannot change its
collection underneath the visitor.

The nearby signal brightens. Charted signals stay gold. Adjacent charted places
gain a luminous connection; completing all five closes the route constellation.
There is no score, timer, account or content lock. The goal is a reason to
explore and understand what each place holds.

Progress is held for the page session, including reading, leaving/re-entering
play and setting changes. Theme changes rebuild their world geometry and keep
the charted collection IDs; they do not claim to preserve a boat pose in a
different world. Closing an inspection in the same setting restores its saved
exploration pose and focus. Reloading starts a new chart.

**Enter / Read the selected work** and the ordinary index remain available
without proximity or completion. Reading remote work does not chart or move the
player. **Escape / Leave world** restores the ordinary portfolio interface.
Native reading dialogs consume Escape themselves before the play session can
exit. Paused/reduced-motion sessions visit one neighboring destination per
press and keep deliberate charting available.

## Implementation and editing

| Responsibility | Source |
| --- | --- |
| Physical proximity and per-session discoveries | `src/exploration.js` |
| Theme glyphs, discovery pulse and constellation | `src/exploration-beacons.js` |
| Traveler, input, approach samples and world/reader handoff | `src/world.js` |
| Entry copy, objective, native controls, focus and HUD | `src/main.js`, `index.html` |
| Scene staging and responsive play layout | `src/styles.css` |
| Actual biography/work and supplied figures | `data/site.json`, `figures/` |

The session module depends on neither content titles nor Three.js. A compatible
host can supply physical distances for any stable set of IDs; the standalone
phase fallback supports authored cyclic routes. The marker module owns its
geometry/materials, takes cloned approach anchors and responds to that session
state. Its transparent navigation lights have no physical collision role,
raycast targets or shadows. They are hidden during work inspection.

These modules ship in both the static build and the skill's **39-file** starter
payload. The parent skill now explicitly guides the optional play loop and
asks agents to customize its objective, objects and response for the person.
New free movement, terrain collision, vehicle physics, inventory or game rules
still require authored implementation; no arbitrary game engine is advertised.

## Verification

The final checks are recorded after the integration build:

- Nine state tests exercise actual-distance versus phase disagreement,
  deliberate discovery, seam/reverse traversal, saved progress and atomic input
  validation. Remote reading and passing cannot manufacture discovery.
- Six native marker tests exercise size/budget, nearby/charted states, route
  closure, pulse timing, nonphysical markers and exactly-once disposal.
- The marker camera test uses the actual sea scene and boat camera at five
  approaches per harbor, on 1280×720 and 390×700 screens. The smallest tested
  projected glyph heights are 38.8 px and 37.7 px respectively. These are matrix
  projections, not rendered/occlusion or glow-quality evidence.
- The repository suite includes source/build publication checks, the original
  motion/camera/instrument checks and copied-skill builds/local serving for all
  three settings. The final run passed **103 tests, 0 failed, 0 skipped**.

`npm run skill:pack`, `npm run check`, `npm run build` and `git diff --check`
passed after the corrected integration. The bundle contains 39 payload files;
source/build checks include the two new modules. Earlier failed checks found a
field guard placed in the scene builder's scope and an outdated public-output
fixture allowlist. Both were corrected before the final run.

The final copied bundle also passed a fresh locked installation into a temporary
project with an empty npm cache, followed by the standalone checker and build.
The output contains five explicit demo entries, six supplied figures and fourteen
asset-provenance records. No temporary dependency link was used for that probe.

The local `kaimerva-playable-skill.zip` has **54 files**, including the complete
skill and its 39-file starter payload. Its SHA-256 is
`780b63f5a720cc922a765569458c61b864cf1a399909c2789e4a761125347893`.
ZIP integrity, byte-identical extraction, and creation/check of a woodland project
from the extracted archive passed. The archive is 5,093,737 bytes; it includes no
original-repository media, agent logs or sessions. The earlier skill ZIP remains
the earlier packaging snapshot.

Source review checked held-input cleanup, scoped game keyboard handling,
Pause, field-mode guards, direct reading without drift, focus restoration,
theme changes and listener disposal. The source/bundle checker detects stale
starter copies and verifies the asset records. The new modules use original
procedural geometry/state code under MIT; no external game assets were added.

Fresh browser inspection remains unavailable because the earlier browser
approval restriction still applies. Actual keyboard/pointer/focus execution,
phone/short-screen overlap, shaders and visual quality remain unreviewed.
No Unreal-level or photorealism claim is made. The local preview is updated;
the public demo and launch film remain earlier versions. This refinement is
not an external publication or a new agent-host execution trial.
