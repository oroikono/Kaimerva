# Review and reuse evidence

Read the parts relevant to the current implementation. A basic destination
selector does not need navigation physics tests, and a layout change does not
trigger a full legal audit. The checks below distinguish useful evidence from
unsupported assurances.

## Visitor behavior

Exercise the real rendered overview and a selected destination on desktop and a
narrow phone. Check that identity and work are readable, controls fit, and the
page has no horizontal overflow. On a phone, let content participate in ordinary
scrolling rather than trapping it in a tiny scene overlay.

Check the interactions that exist:

- Scene picking and HTML controls open the same content immediately.
- Opening moves focus to readable content; Back/Escape returns it to the source
  control. Ordinary links and the index work independently of travel.
- Movement keys belong to an explicit focused mode; leaving it restores page
  behavior and clears held input. Short taps and held input have distinct checks.
- Pause holds water, lights, objects, traveler and camera. Reduced motion leaves
  selection usable with static states or deliberate steps.
- WebGL failure keeps the content path usable. Test context recovery when it is
  supported; regenerated lighting/render-target content must be repainted.
- An idle, hidden or offscreen scene avoids unnecessary paints. Stop scheduling
  frames as well when using demand-driven rendering. Check teardown/remount for
  duplicate canvases, observers, input listeners and leaked GPU resources.

Do not claim measured frame rate or battery performance from a pixel-ratio cap.
Describe actual device measurements if made. Check static depth separately from
animation: silhouette, overlap, contact, material differentiation and lighting.

## Rich movement

When collision/navigation is implemented, use pure geometry helpers and the
actual generated terrain and model bounds. Check full footprints, translation
and rotation sweeps, finite inputs, endpoints, retargeting and safe failure when
no checked route exists. Responsive layouts may need different safe waypoints.

Sampling many poses is useful evidence, not a proof of continuous clearance
unless a conservative swept bound is used. Distinguish the route curve from
the poses produced by its easing/heading interpolation. Browser focus, events,
timing and pause remain separate from deterministic geometry checks.

For a globe, check same-place milestones and coordinate edge cases actually
supported. Do not draw symbolic career routes as verified historical travel.

## Evidence record

Keep a short record of what was rendered and exercised, test commands/results,
viewport sizes, and material limitations. Label source-inspected behavior,
mock API checks and actual browser/live-provider checks separately. A screenshot
shows composition, not motion correctness. Two comparable paused captures can
check a frozen composition, while a before/after steering action checks input.

## Asset ledger

Inventory what ships, including unused files served from a public directory.
For each reused asset, record creator, source URL, version, applicable license
or permission evidence, required credit/notices and modifications. Preserve the
full notice text accompanying redistributed code, fonts or assets. Do not infer
one package's bundled components are all covered by its top-level license.

Keep mandatory attribution readable and discoverable near an asset or through
a linked credits page, as its conditions allow. Optional inspiration mentions
are a design choice. Credit alone does not grant permission. Public availability,
coauthorship or asking AI to redraw/recode a work does not establish reuse rights.
An asset's own rights and the rights in embedded photographs/icons can differ.

Independently authored geometry/materials can avoid downloaded models and
textures. Record that basis honestly without promising originality or immunity
from claims. Source links are an alternative when figure/portrait redistribution
permission is absent. Do not treat free hosting as proof of noncommercial use.

## Sharing a template

Build a clean distributable rather than copying an entire personal app. Exclude
private CMS IDs, credentials, personal biography/CV/news, unapproved portraits,
paper PDFs/figures, original footage, review screenshots and backup archives.
Supply plainly labeled demonstration records and newly authored visuals.

Use a license that the repository owner intends for their own code/instructions.
Do not represent that license as covering third-party dependencies or future
user content. Record dependency notices against the new repository's actual
versions and distribution target; a previous app audit is not transferable
clearance. Native components may have redistribution/source obligations separate
from browser-delivered JavaScript.

Separate local preparation from the requested public release. Report what was
created and checked, and perform only the publication actions within the user's
authorized scope. A review report documents evidence and remaining questions;
it is not a legal guarantee.
