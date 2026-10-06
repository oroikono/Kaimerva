# Verification

This record separates executable checks from design intentions and host compatibility. Date: 2026-10-06.

## Completed

- A clean independent npm install fetched the pinned Three.js package with lifecycle scripts disabled. The starter uses one runtime dependency; it does not rely on the source portfolio's `node_modules`.
- Seven Node tests pass for explicit publication, public draft exclusion, valid empty collections, atomic malformed/duplicate rejection, unsafe links, real dates and fresh normalized arrays. An isolated build/server integration test checks actual public JSON, dependency notice copying, removal of stale output, live content changes, and malformed-source responses.
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

## Limits

No real Claude Code invocation, multi-browser/mobile-device matrix, live CMS account, server-rendered content integration, public hosting, or third-party media rights clearance is claimed. Reduced-motion and context-loss behavior may be inspected separately from any browser-tested controls; do not infer one from the other. No guaranteed frame rate, unique design or GitHub popularity is promised.
