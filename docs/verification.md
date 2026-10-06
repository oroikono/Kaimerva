# Verification

This record separates executable checks from design intentions and host compatibility. Date: 2026-10-06.

## Completed

- A clean independent npm install fetched the pinned Three.js package with lifecycle scripts disabled. The starter uses one runtime dependency; it does not rely on the source portfolio's `node_modules`.
- Eleven Node tests pass for explicit publication, public draft exclusion, valid empty collections, atomic malformed/duplicate rejection, unsafe links, real dates and fresh normalized arrays, plus spatial arrow selection, map edges, visibility, deterministic ties and input immutability. An isolated build/server integration test checks actual public JSON, dependency notice copying, removal of stale output, live content changes, and malformed-source responses.
- All three procedural builders were exercised with actual Three.js geometry. Vertex positions/bounding spheres and destination points were finite; animation and disposal executed. This is geometry evidence, not a GPU performance measurement.
- Skill frontmatter, name/folder agreement, description, local reference existence, and absence of unfinished scaffold were checked. The official skill-creator `quick_validate.py` passed after PyYAML was installed in an isolated temporary environment; the starter has no Python runtime dependency.
- An independent agent used the skill on an architect/photographer's quiet desert observatory request. It retained Astro, omitted sailing/game controls, chose ordinary routes, and distinguished local JSON from production runtime updates. This was a brief-generation test, not a rendered Astro app, live CMS, or host-discovery test.

## Browser and release checks

- The sea, orbital, and woodland themes were rendered and visually inspected in the Codex in-app browser at its normal 1280 × 720 viewport. Repository screenshots capture the actual starter, not design references.
- At a 390 × 844 viewport, the coast composition was visually inspected; all themes' destination labels stayed inside the world frame and the document had no horizontal overflow. This is a responsive viewport check, not physical-device testing.
- Arrow navigation changed the selected collection while keeping focus in the world. Enter focused the reader heading; Escape returned focus to the Explore button. The motion control exposed the paused state and Resume action.
- Readable navigation and browser Back were exercised. Back from Research to the initial URL restored Projects after a history-state fix.
- A temporary edit to the source JSON appeared through Refresh content without a build, and the original fixture was restored and refreshed. The static production snapshot distinction remains documented.
- Source/provenance checks allow only the three authored JPEG screenshots as release binaries. Public output uses an explicit file allowlist, strips drafts, and copies the installed Three.js MIT notice.
- WebGL creation/context-loss fallback, reduced-motion preference enforcement, offscreen/hidden animation suspension, resource disposal, and BFCache preservation were inspected in source. Their browser failure/preference states were not induced during this check.
- The independent repository was initialized, committed, and published as `oroikono/personal-worlds`. GitHub metadata confirms public visibility, template status, and MIT recognition. A separate reviewed build was deployed on GitHub Pages; the live sea scene and example content loaded at the project subdirectory. The sea screenshot captures that public demo.

## Directional-map update

- Landmarks were spread into wider compositions, with Journal and Journey diagonally separated. A higher camera and larger sea assemblies preserve readable object size. Woodland ground and paths were adapted to its wider layout.
- Arrows now choose a visible landmark in the pressed screen direction instead of cycling through a fixed list. Edges do not wrap. Pointer visits retain map focus; Enter/Space on a focused landmark opens its reader; Escape leaves exploration. Background clicks can focus the map too.
- In the browser, all four directions were used to visit all five sea destinations. An edge kept the selection unchanged. Tab-focused Research while Projects was selected, then Left and Enter, correctly visited Journal and focused its reader. Native Space opened a focused Projects entry correctly. Escape returned focus to Explore, and selection still worked while paused. A background click focused the map and the next arrow selected a destination.
- Exact projected button rectangles were checked for all themes at 1166 × 614, 1120 × 580, 343 × 430 and 280 × 430. None overlap or escape the fitted frame; every stop is reachable from every start in at most two directional selections. The tightest orbital Projects/News phone gap was expanded to 13 pixels without shrinking the objects.
- Browser checks at 390 × 844 and 320 × 844 showed bounded, nonoverlapping controls and no horizontal document overflow. Hold-repeat throttling and manual Pause preservation across OS preference changes were inspected in source; a physical held-key or OS-preference-cycle test was not performed.
- The updated Pages build completed successfully. A reload of the public demo loaded the new map and controls; a right-edge press stayed in place, and Left selected Journey while retaining map focus. The sea screenshot was refreshed from that live deployment.

## Limits

No real Claude Code invocation, multi-browser/mobile-device matrix, live CMS account, server-rendered content integration, or third-party media rights clearance is claimed. The public demo is a static snapshot. Reduced-motion and context-loss behavior may be inspected separately from any browser-tested controls; do not infer one from the other. No guaranteed frame rate, unique design or GitHub popularity is promised.
