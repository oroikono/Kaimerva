# Verification

This record separates executable checks from design intentions and host compatibility. Initial record: 2026-10-06; dated additions describe later checks.

## Completed

- A clean independent npm install fetched the pinned Three.js package with lifecycle scripts disabled. The starter uses one runtime dependency; it does not rely on the source portfolio's `node_modules`.
- Eleven Node tests pass for explicit publication, public draft exclusion, valid empty collections, atomic malformed/duplicate rejection, unsafe links, real dates and fresh normalized arrays, plus adjacent cyclic traversal, wrapping in both directions, interrupted route phases and shortest-arc pointer targets. An isolated build/server integration test checks actual public JSON, dependency notice copying, removal of stale output, live content changes, malformed-source responses, and versioned entrypoint/import URLs that change after a source edit and load through the HTTP provider.
- All three procedural builders were exercised with actual Three.js geometry. Vertex positions/bounding spheres and destination points were finite; animation and disposal executed. This is geometry evidence, not a GPU performance measurement.
- Skill frontmatter, name/folder agreement, description, local reference existence, and absence of unfinished scaffold were checked. The official skill-creator `quick_validate.py` passed after PyYAML was installed in an isolated temporary environment; the starter has no Python runtime dependency.
- An independent agent used the skill on an architect/photographer's quiet desert observatory request. It retained Astro, omitted sailing/game controls, chose ordinary routes, and distinguished local JSON from production runtime updates. This was a brief-generation test, not a rendered Astro app, live CMS, or host-discovery test.

## Browser and release checks

- The sea, orbital, and woodland themes were rendered and visually inspected in the Codex in-app browser at its normal 1280 × 720 viewport. Repository screenshots capture the actual starter, not design references.
- At a 390 × 844 viewport, the coast composition was visually inspected; all themes' destination labels stayed inside the world frame and the document had no horizontal overflow. This is a responsive viewport check, not physical-device testing.
- Arrow navigation changed the selected collection while keeping focus in the world. Enter focused the reader heading; Escape returned focus to the Explore button. The motion control exposed the paused state and Resume action.
- Readable navigation and browser Back were exercised. Back from Research to the initial URL restored Projects after a history-state fix.
- A temporary edit to the source JSON appeared through Refresh content without a build, and the original fixture was restored and refreshed. The static production snapshot distinction remains documented.
- Source/provenance checks use a named signature allowlist for the authored JPEG screenshots and demo media. Public output uses an explicit file allowlist, strips drafts, and copies the installed Three.js MIT notice.
- WebGL creation/context-loss fallback, reduced-motion preference enforcement, offscreen/hidden animation suspension, resource disposal, and BFCache preservation were inspected in source. Their browser failure/preference states were not induced during this check.
- The independent repository was initialized, committed, and published as `oroikono/personal-worlds`. GitHub metadata confirms public visibility, template status, and MIT recognition. A separate reviewed build was deployed on GitHub Pages; the live sea scene and example content loaded at the project subdirectory. The sea screenshot captures that public demo.

## Circular-route update

- All themes use the same authored clockwise cycle: Projects → Research → Journal → Journey → News → Projects. Landmarks and their route form a ring, with curved connections between neighbors. The traveler samples that closed route instead of interpolating along a straight chord.
- Right/Down follow the cycle clockwise; Left/Up retrace it. Pointer visits retain map focus and take the shortest arc. Enter/Space on a focused landmark opens its reader; Escape leaves exploration. Background clicks can focus the map too.
- Browser checks covered five clockwise and five counterclockwise moves, both wrap directions, Down/Up, paused selection, a focused landmark whose ID differed from the current selection, Enter/Space reader access and Escape returning focus to Explore. All three themes were visually inspected and their screenshots refreshed. At 390 × 844 all themes had separated labels and no horizontal document overflow; the orbital ring was also checked at 320 × 844.
- Real-Three geometry checks verified route endpoints, positive/negative wrap, seam tangents, no self-intersections or center-crossing edges, and finite geometry/disposal. Twelve projected desktop/phone layouts were convex and clockwise with bounded, nonoverlapping labels and a fully framed traveler path; the narrowest tested label gap was 25 pixels. These checks describe geometry, not GPU or physical-device performance.
- The first live reload exposed a mixed release: fresh HTML with cached older modules. The build now gives the CSS, JavaScript entrypoint and its local imports a shared content-derived URL version. The integration test exercises cache-version changes and serves the generated URL successfully.
- GitHub Pages confirmed the revised deployment built successfully. A normal reload loaded the versioned entrypoint and new cyclic scene; live Right presses visited Journey → News → Projects, and Left wrapped back to News while retaining map focus. The sea screenshot was refreshed from that public deployment.
- The route phase remains continuous when an arrow interrupts a trip or crosses the last/first seam. Paused and reduced-motion selection is immediate. Hold-repeat throttling and manual Pause preservation across OS preference changes remain in source; a physical held-key or OS-preference-cycle test has not been performed.

## Aegean observatory update

- The sea builder now uses authored irregular coastlines, submerged shoals, a bronze/glass instrument, a sailor and responsive sails, and a fixed-capacity fading wake. Its two-source analytic wave field is an illustrative visual study; it is not a paper figure, fluid simulation, or validated research result. No new dependency or third-party media was added.
- An independent actual-Three.js CPU review exercised 825 frames, finite geometry and poses, field spacing and source markers, route endpoints and wrapping, wake bounds/expiry, paused updates, teleport/time-rewind resets, and disposal of all 122 geometries and 19 materials. This establishes bounded geometry and update behavior, not GPU performance or scientific accuracy.
- Local browser checks rendered the new field and voyage camera. Clicking the lens synchronized the button and controls; horizontal water dragging changed source spacing; native range Home/End keys reached both endpoints. These controls remained usable while paused. Theme changes reset the field and camera and hid the sea-only panel in other worlds.
- Five clockwise moves in voyage view kept the selected stop reachable, including the wrap. An offscreen selected stop receives a directional edge label. Enter opened the reader. F/V toggled the field/camera from world focus and synchronized the visible controls.
- Responsive viewport checks at 320 × 844 and 390 × 844 found no horizontal document overflow. At 390 × 844 all five atlas labels were visible and bounded after the camera settled; the field controls and readable entry fitted the phone layout. These are viewport checks, not physical-device tests.
- Browser review found and corrected a bubbling theme handler that reset controls on unrelated clicks, an invisible instrument mesh receiving ray hits, and a context-loss resize path that could restore stale labels. Context loss itself was reviewed in source, not induced in the browser.
- All eleven tests and the bounded source/provenance check passed for the final source. GitHub Pages reported the exact observatory deployment as built. A live reload loaded its new versioned entrypoint; F/V synchronized the field and camera controls, Right selected News from Journey while retaining world focus, and the browser reported no warnings or errors. The sea screenshot was saved from this public deployment.

## Natural coastal graphics update

- The sea world now has locally generated daylight/environment lighting, a mirrored-scene water reflection pass, ripples, shallow-water color, restrained caustics and shoreline foam. Seeded coast outlines match the water's shallow-bank calculation. Authored stone, wood and linen color/height textures add weathering; deformed rocks, layered cypress trees and curved sails replace simpler forms. These are a stylized coastal scene, not photorealism or a physical fluid simulation. No downloaded media or new dependency was added.
- An independent actual-Three.js CPU check covered finite position/normal/UV data and valid indices, five unchanged route stops, 360 update frames, stationary paused poses, deterministic texture bytes and disposal of 157 geometries, 20 materials and six generated surface textures, including route resources.
- A separate reflection review checked mirrored-camera position and mean-plane projection agreement, restoration of render targets/clipping/shadow state/visibility after success and a thrown render, reflection resizing and sampler cleanup. Reflection targets are bounded at 512 × 512 on larger viewports and 256 × 256 below 700 pixels. The sky/environment resources are reused across theme changes and disposed at destruction. These are CPU/resource and source checks, not measured GPU speed.
- Desktop browser checks at 1280 × 720 rendered the final water shader, materials, lighting and shadows with no new warnings/errors. Paused arrow selection and F/V field/camera toggles retained world focus. Transparent instruments no longer cast opaque shadows; first rendering and paused selection request fresh shadows. A 390 × 844 viewport showed all five separated atlas labels and no horizontal document overflow. Sea → orbital → woodland → sea changes preserved manual Pause and restored the sea-only controls. These are browser viewport checks, not physical-device testing.
- All eleven tests and the source/provenance check passed after the final graphics edits.
- GitHub Pages reported deployment `99c28e9ba4907eab104b8c178adaa4168c59e065` as built. A live reload loaded version `8ae8eefc8fb7`; paused arrow wrapping, F/V controls and return to the atlas remained usable with no new warnings/errors. The sea screenshot was refreshed from that public deployment.

## Demo video and fresh comparison

- A 45-second silent demo uses actual browser captures of all three settings, focused arrows, the voyage camera, Enter opening a readable entry, an expanded entry, field dragging and a successful local content refresh. The example JSON title was restored byte for byte after recording. The opening skill prompt is explicitly an example; no live agent execution is claimed. [Capture details](demo-video.md).
- H.264 decoding, dimensions, 24 fps export, duration and absence of audio were checked. Captured frames are repeated at export rate; this is not a native frame-rate or GPU benchmark. The full-world shot compositions, title/caption cards, content change and encoded stills were visually inspected. The MP4, derived poster and short GIF are explicitly allowed by the source check and recorded in the asset ledger.
- A fresh primary-source comparison adds Memory Palace and other portfolio/design skills to the existing related work. Seven current upstream skill/document files were compared with the four-file skill package using exact normalized word runs. No substantial verbatim skill passage was detected; the maximum run was six generic words. This is a bounded text comparison, not a global originality or scene-code audit. [Full review](uniqueness-review-2026-10-06.md).

## Futuristic video edit and agent-skills attention

- A separate 26-second film and 15-second X cut use genuine starter captures, including new moving voyage and field footage. Avenir typography, masked reveals, an optical skill-method diagram and original synthesized sound replace the earlier presentation. The method/brief are editorial illustrations, not a recorded host invocation or additional shipped app features. The original technical walkthrough remains available. [Media details](demo-video.md).
- Both exports passed complete decoding and codec/dimension/frame-count/duration checks: H.264/`yuv420p`, 1280 × 720, 24 fps, stereo 48 kHz AAC, 624 and 360 video frames respectively. MP4 atom inspection confirms metadata precedes media data. Decoded contact sheets were reviewed for readability, scene crops, actual before/after content and the repository link. Audio normalization and teaser boundary fades are documented separately from capture timing.
- The derived GIF was checked at 480 × 270, 64 frames and 8.01 seconds. New media filenames have explicit signature checks in the bounded source check and their own authored entry in the asset ledger. Raw captures, local editing paths and work files remain outside the repository.
- A primary-source [attention snapshot](research/agentic-traction-2026-10-06.md) distinguishes broader design-skill interest from the new repository's unproven adoption. Stars and install telemetry are attention signals, not active-use or quality evidence. No X post, paid service or external upload was performed for this edit.

## Modular skill update — 7 October 2026

- The portable entrypoint now routes new/hybrid worlds to composition guidance and futuristic requests to a separate art-direction reference. The references describe seven design layers and five possible world families; they do not install renderer plugins or add two new starter themes.
- The official skill validator, UI metadata checks, all seven contained reference links and the bounded source check passed. An independent review found a scope problem for hover-only edits; explicit bounded-revision rules resolved it without expanding ordinary edits into full architecture or asset work.
- An independent agent created a separate fictional city portfolio from the copied skill and one rich brief. Ten local checks passed; parent browser checks covered desktop/phone, selection, supplied stages, tags, focus/history, Pause and deliberate graphics/static modes. A live record addition created an object and ordinary HTML reader on reload while preserving the existing labels' positions; source JSON was restored exactly. Review corrections and untested behavior are recorded in the [forward-test report](research/skill-forward-test-2026-10-07.md).
- This trial's server-rendered pages and content-derived objects belong to the separate local output, not the shipped starter. No hosted CMS, automatic cross-host discovery, cinematic realism or comparative quality is established. No push, social post or public release was performed for this update.

## Prompt-editing pilot — 7 October 2026

- A strict, versioned world configuration validates supported theme, exposure,
  key-light, reader/panel/button and sea interaction fields. The config-only CLI
  prints exact diffs, applies/undoes local edits and rejects unknown/range/type
  errors before writes. Its history and lock remain in ignored `.local`; config
  and history are separate writes, not a multi-file transaction.
- All 18 Node tests passed, including seven actual config/CLI tests and the
  isolated real build/HTTP test. The latter needed temporary localhost-listener
  permission after the sandbox returned `EPERM`. It checks live local settings,
  static production snapshots, invalid-source rejection and private-history
  exclusion. Official skill-format validation and the bounded source check also
  passed. No new runtime dependency was added.
- Parent browser checks applied three successive patches to the real starter:
  exposure/key-light strength `1 → 0.65`; inline/solid/square reading changed to
  dialog/glass/pill; then atlas/field-off/spacing `0.45` changed to
  voyage/field-on/spacing `0.75`. Local refresh required no config rebuild.
  Rendered lighting and final smoked-glass treatment were inspected. The boat,
  authored geometry and content were preserved; this is not photorealism or a
  time-of-day simulation.
- Appearance/UI refresh kept selected content, the session content timestamp,
  manual Pause and visitor voyage/field choices. A later exposure-only undo kept
  the visitor's orbital theme. An explicit changed sea interaction under that
  visitor theme correctly restored its configured compatible sea, with a status
  explanation. These were actual browser controls, not mocked transitions.
- Dialog reading was exercised from a landmark, Enter and an HTML collection
  link. Arrows changed the selection without opening a modal. Close and Escape
  restored focus to the invoking landmark, map or collection link. At 390 × 844,
  expanded reader content and Close fitted a bounded dialog; document width was
  390 pixels. The final 1280 × 720 and phone captures were visually inspected;
  the browser reported no warnings/errors. These are viewport checks, not a
  device matrix or GPU benchmark.
- Independent source review caught and corrected wrong pointer focus restoration
  and an unconditional settings refresh that reset a paused camera. Final
  appearance/UI refresh does not reapply unchanged field/view state. Reduced
  motion continues through the existing OS preference path; an actual OS
  preference change was not induced in this check.
- All three pilot edits were undone through the CLI. `data/world.json` was
  restored byte for byte; `data/site.json` stayed byte for byte unchanged. Its
  SHA-256 remained `cf849770d3000bdaef92bd3348da0495f3058833590dbf04bad1b5f961ea2737`.
  Captures and fixtures stayed outside the public repository. The final build
  and preview use the original default settings.
- The portable skill now has a conditional prompt-editing reference. Natural
  language is interpreted by the host coding agent; the CLI consumes JSON
  patches. Arbitrary entity generation, custom game rules, embedded visitor AI,
  a general plugin API and the proposed Chronoscope world are not shipped. The
  [comparison](research/prompt-world-authoring-2026-10-07.md) documents existing
  prompt editors. No commit, push or public deployment was performed.

## Figure passage — 7 October 2026

- Two implementation agents built the original mechanical aperture and three
  illustrative SVG plates; the parent integrated the native reader, navigation
  and return. An independent source and rendered review corrected focus timing,
  the phone camera breakpoint, retained reading on context loss, texture status,
  interrupted closing, refresh focus and initial reader position. The final
  figure carrier was enlarged so the supplied work leads the instrument.
- The aperture has six hinged leaves, suspended image rails and three distinct
  optical arrangements. Entry and return are bounded transitions; settled
  inspection uses demand-driven drawing. Exploration motion and travel are
  suspended during inspection, then their saved state is restored. No new
  dependency, third-party media or paid service was added.
- All 22 Node tests passed, including validated one-to-three-view metadata,
  deep normalization, unsafe paths and draft exclusion. The real build/HTTP
  test checks figure MIME types, published-only copying, missing/symlink/non-file
  asset rejection before output is cleared, content/settings refresh and private
  history exclusion. Source/provenance checks, syntax checks and the final
  static build passed.
- Actual desktop browser checks at 1280 × 720 covered Research landmark entry,
  the immediate native reader, all three supplied images, Right and End view
  selection, Pause, Return and Escape. A paused 3D viewport region was exactly
  pixel-identical across two captures; a native reader scrollbar fade accounted
  for differences in the full screenshots. Returning from an already selected,
  paused voyage retained the visible labels' projected positions, field/view
  controls and manual Pause. Landmark entry returned focus to Research; the
  global entry returned focus to its button.
- Browser Back closed an open passage and restored Projects and its hash;
  Browse all research returned to the ordinary reader heading. Fresh openings
  reset reader scroll and focus to the title. Source review also guards against
  an old collection dialog stealing focus from a newly opened figure reader.
- At 390 × 844, the instrument and three controls fitted above the reader with
  no horizontal document overflow. View changes retained the reader's top
  position. The flat main image loaded, its full-size link pointed to the same
  source, and Return remained a 44-pixel target within the reader while scrolled.
  Final desktop and phone compositions were visually inspected. These are
  browser viewport checks, not physical-device or GPU benchmarks.
- A temporary missing second-view image produced a visible failure status while
  retaining the native explanation, caption and loaded main figure. Switching
  to the third view recovered. The source content was restored byte for byte
  and the clean preview reloaded. Resource checks using actual Three.js disposed
  all 112 tracked apparatus geometries and eight materials exactly once, with
  idempotent cleanup. Context loss, OS reduced motion and stale asynchronous
  image completion were checked in source; those browser failure/preference
  states were not induced.
- The three 1200 × 720 plates share an explicitly described static scalar
  construction and accurate arbitrary-coordinate labels. They contain no
  external image/font/script references. They are illustrative artwork, not
  publication figures or experimental evidence. Authorized personal figures
  can use the same validated image/view interface.
- This addition is local. No commit, push, deployment or social post was
  performed; the linked public demo and existing films show earlier builds.
  New assets need rebuilding, while metadata referencing already built images
  can refresh locally. Static hosting still needs updated public files or a
  separately implemented runtime content provider.

## Kaimerva branding — 8 October 2026

- The README, package metadata, demo title/header/favicon and portable skill now use Kaimerva. The README and brand record include K-A-I-M-E-R-V-A, the pronunciation kye-MER-vah and the coined-name explanation. Historical films and dated research records retain their recorded name.
- The selected cinematic icon is copied unchanged into the repository and skill. Source, portable and built PNGs match SHA-256 `0232e81a490c235befb665e434d1be4ba9a29b9ec66bb88fb955c8581e077842`. Attribution identifies Orestis Oikonomou's art direction/selection and OpenAI's built-in image-generation tool; the final prompt is recorded. The portable copy carries the full MIT notice.
- Skill frontmatter validation passed with the skill-creator validator. The YAML icon path and `$kaimerva` invocation resolve, and README/brand-document local links resolve. An independent read-only integration review found no meaningful omission.
- All 22 tests pass, including byte-identical PNG delivery in the real build/HTTP integration test. The first HTTP attempt could not bind a loopback port inside the sandbox; the same integration test passed with the required local-port permission. No mocked HTTP result is substituted for that run.
- The 77-file bounded provenance/source check, whitespace check and production build passed. Browser policy blocked selecting the local preview, so this branding update has no new rendered browser verification.
- This branding update is local. No GitHub repository rename, push, deployment or social post was performed. The existing repository/demo URLs remain valid and serve their previously published versions.

## Fresh skill installation — 8 October 2026

The full `skills/kaimerva` package was copied into isolated `.agents/skills/kaimerva` and `.claude/skills/kaimerva` projects. Source staging was removed before checks. Both copies retained all 10 source files byte-for-byte, resolved their 10 relative Markdown links and icon path, preserved the full MIT notice, and passed the skill-creator format validator.

Codex CLI 0.160.0 then performed a real `skills/list` discovery request for the temporary project: it returned exactly one enabled `kaimerva` skill with repository scope, the copied `SKILL.md` path, display name Kaimerva, short description, icon path and `$kaimerva` default prompt. The sandboxed process initially could not start; the same bounded read-only query passed with normal local runtime permission. No thread or model turn was started and no persistent user skill was installed. Claude Code is absent, so its actual loading remains untested. [Detailed install evidence](research/skill-install-test-2026-10-08.md).

## Limits

No real Claude Code invocation, multi-browser/mobile-device matrix, live CMS account, server-rendered content integration, or third-party media rights clearance is claimed. The public demo is a static snapshot. Reduced-motion and context-loss behavior may be inspected separately from any browser-tested controls; do not infer one from the other. No guaranteed frame rate, unique design or GitHub popularity is promised.
