# Personal Worlds: traction evidence and a free launch experiment

Reviewed **2026-10-06**. This document combines current primary sources with inspection of our local `README.md` and [uniqueness review](../uniqueness-review-2026-10-06.md). Recommendations are hypotheses to test. No posts, messages, repository settings, marketplace submissions or hosting changes were made by this research pass.

## Decision

**Prove that the skill creates a different person's world before trying to distribute it widely.** A working 3D portfolio is an established category, and a 3D portfolio plus an AI customization skill has direct precedents. Our first useful audience is people who want a personal portfolio beyond a standard template and are willing to edit a small open-source project. They need a striking result, a short path to making it theirs, and proof that the method changes more than colors.

Start with **GitHub + a verified skill installation path**, then **one focused Three.js community showcase**. Consider a broader Show HN only once the adaptation proof is substantial and the human author is eligible and active in that community. A Hugging Face mirror is optional later; our existing GitHub Pages demo already removes the signup barrier.

## What nearby projects actually package

These observations concern public packaging, not why a project gained stars. No causal attribution, traffic logs or controlled launch comparison is available.

| Primary evidence | Observed packaging | Useful inference for Personal Worlds |
| --- | --- | --- |
| [Bruno Simon's site](https://bruno-simon.com/) and [MIT source repository](https://github.com/brunosimon/folio-2025) | A playable personal world, explicit controls, source code, development logs and a behind-the-scenes explanation. Its README documents the game loop and asset pipeline. | Show an interaction worth trying, then explain how it was built. A real build story gives people a second reason to share beyond the first screenshot. We do not have equivalent game depth and should not present destination hopping as vehicle physics. |
| [Bruno's author launch post](https://www.linkedin.com/posts/simonbruno77_6-years-of-thinking-i-can-make-a-better-portfolio-activity-7404155703763881985-UhHS), [responsive devlog post](https://www.linkedin.com/posts/simonbruno77_responsive-portfolio-devlog-9-activity-7371879132827398144-Pnpn), [earlier alpha/devlog announcement](https://bsky.app/profile/bruno-simon.bsky.social/post/3lnczrvmfhc2i) | The author published a working link and a personal development story, with development updates before the final launch. Visible comments ask about implementation, performance and the creative process. | A short series explaining a specific design decision can support an eventual release. Bruno has an existing audience; copying the posting pattern will not reproduce his reach. |
| [React Three Next](https://github.com/pmndrs/react-three-next) | A narrow starter proposition, a live demo, an immediate scaffold command, TypeScript option, architecture example and relevant repository topics. | Separate “try the scene” from “start your own project.” Give each route a clear first action. Its performance figures are author claims, not our benchmark or a target we have verified. |
| [UI UX Pro Max README](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/main/README.md) | Installation paths for multiple hosts, concrete examples of outputs, structured capabilities, translated READMEs, update/uninstall instructions and links to related work. The current README also has a premium product. | Make the free standalone value legible and verify our actual install path. We should not copy its scale claims, add untested host badges, or introduce a paid dependency to resemble its packaging. |
| [3Dviz Pro Max README](https://github.com/viettranx/3dviz-pro-max/blob/main/README.md), [installation details](https://github.com/viettranx/3dviz-pro-max/blob/main/docs/installation.md) | Runnable examples, captured output, a separate showcase, prompt examples and explicit compatibility/evidence limits. Installation distinguishes a built archive from actual host testing. | The best advertisement for a creative skill is observed output plus reproduction instructions. Record the prompt, revision, host, failures and final artifact for our adaptations. An example prompt alone does not prove generation. |
| [ORBIT](https://github.com/HenrikBrehm/orbit) and [Memory Palace](https://bingran.ai/skills/memory-palace) | Direct precedents for an AI-customizable spatial portfolio and for packaging a particular 3D portfolio as a deployment skill. | “First portfolio skill” is an indefensible pitch. “A free method that derives different portfolio worlds from different personal stories” is useful, but needs actual adaptation examples to earn credibility. Their individual licensing boundaries are covered in our uniqueness review; neither implementation was reused here. |

Public GitHub pages showed rounded star counts for some established projects during this pass, but they are deliberately omitted from the comparison. A star total without launch exposure, age, audience and adoption data does not tell us what caused traction.

## The missing proof that would strengthen our offer

The current starter has three authored settings and a common destination loop. It has readable entries and local JSON refresh. It does **not** yet prove that another person can obtain a substantially different portfolio from the skill, nor does it include a hosted CMS, production entry-page SEO or an independently measured graphics benchmark.

Recommended next proof: **two complete adaptations for different identities**, not two extra palette presets. For example, one research/fieldwork portfolio could let visitors inspect a content-derived instrument, while a photographer or architect could use a different interaction such as composing a contact sheet or comparing a site's stages. These are creative proposals, not claims of global novelty.

Each proof should contain:

- A public-safe identity/content brief and the actual skill prompt.
- The generated/revised source, precise tested host and revision, and a short record of human changes.
- One meaningful interaction derived from the work, demonstrated in real browser capture.
- A working readable page, mobile composition and no-WebGL route.
- A real content edit, with the local/static/live boundary stated plainly.
- Time to first usable result, failed steps and asset/license records.

Our existing video demonstrates the starter. A separate “same method, different person” clip would demonstrate the portable skill. Keep those claims separate.

## Three distribution decisions

### 1. GitHub and skills discovery: do this first

The [skills CLI](https://github.com/vercel-labs/skills) supports a GitHub repository source, selection with `--skill`, listing without installation with `--list`, and named host targets. A candidate command for our canonical folder is:

```sh
npx skills add oroikono/personal-worlds --skill build-personal-world
```

**Discovery was subsequently tested successfully with pinned CLI 1.7.1; see the bounded check below.** Installation, host invocation, update and removal were not tested in that check. Verify those operations for each advertised host before presenting full compatibility. Retain folder-copy instructions as the documented fallback.

[skills.sh documentation](https://www.skills.sh/docs) says leaderboard discovery uses aggregated CLI installation telemetry; [its CLI reference](https://www.skills.sh/docs/cli) documents an opt-out. This is a relevant discovery route, not guaranteed placement, a quality certificate or proof of active use. Do not manufacture installs to raise a rank. Respect telemetry choices.

GitHub's [template documentation](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-template-repository) explains that enabling the template setting gives users the default-branch files in a fresh repository. Our README already links to `/generate`; verify that the actual repository setting and default branch match before launch. The demo branch must remain clearly separate from the editable source.

GitHub [topics](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/classifying-your-repository-with-topics) provide classification and related-repository discovery. Suggested accurate small set: `portfolio`, `portfolio-template`, `threejs`, `webgl`, `agent-skills`, `creative-coding`, `personal-website`. Add host-specific topics only alongside accurate tested-status documentation. Topics are discoverability metadata, not a ranking promise.

Package the repository for the first five minutes: live demo, 10–15-second real preview, tested install/start steps, “edit here” table, a first content edit, clear MIT grant and visible limits. The existing 45-second clip can remain the deeper tour. Prefer a small tagged release with a changelog and complete portable skill archive over introducing a custom global installer prematurely.

### 2. Three.js Showcase: technical feedback before a broad launch

The official forum has a [Showcase category](https://discourse.threejs.org/c/showcase/6). Real examples include a [programmatic game portfolio](https://discourse.threejs.org/t/i-turned-my-portfolio-into-a-tiny-three-js-game-bikes-cars-police-and-a-jetpack/93130) whose author describes controls, physics and implementation, and a [scene gallery](https://discourse.threejs.org/t/my-personal-threejs-scenes-gallery-portfolio-made-with-react/7564) with technical discussion. These show fit, not predicted popularity.

Its [current guidelines](https://discourse.threejs.org/guidelines) require moderator approval for Showcase posts, warn about strict new-user moderation, forbid duplicate cross-posting and require respecting others' digital work. A future human-authored showcase should disclose AI assistance, explain the procedural scene and readable-content design, link the live artifact/source, and ask one specific question: for example, whether the chosen interaction communicates the person's work and whether the reading path is clear on a phone. Do not turn it into a request for stars or post the same advertisement in multiple threads.

### 3. Broad launch: conditional, human-written, after proof

[Show HN rules](https://news.ycombinator.com/showhn.html) call for substantial personal work people can actually try, preferably without signup; quickly generated one-offs and ordinary landing pages do not qualify. A historical [Henry Heffernan author showcase](https://news.ycombinator.com/item?id=31313187) links a working 3D portfolio and both source repos while describing its development. That is a useful primary example of presentation, not a result to expect.

The current [temporary restriction notice](https://news.ycombinator.com/showlim) asks newer users to learn and contribute to the community before occasional Show HNs. The [general HN guidelines](https://news.ycombinator.com/newsguidelines.html) explicitly prohibit generated text, automated posting, generated/AI-edited comments, vote solicitation and primarily promotional use. **The human must write any HN submission and replies themselves; this document is evidence, not copy to paste.** Recheck eligibility and rules when ready. Do not delete/repost to chase attention.

Reddit is a secondary alternative, not an extra mandatory launch channel. The [official r/webdev rules JSON](https://www.reddit.com/r/webdev/about/rules.json) limits portfolio/showcase feedback to correctly flaired Showoff Saturday, bans commercial promotion, warns against excessive self-promotion and includes LLM-generated posts/comments among disallowed low-effort content. A human-written technical post may fit; automated promotional copy does not. Recheck rules on the intended day. This pass does not establish blanket permission to self-promote in r/threejs.

## Channels to defer

**Hugging Face:** [Static HTML Spaces](https://huggingface.co/docs/hub/en/spaces-sdks-static) are currently free for everyone and serve static assets without a compute runtime. Their [configuration reference](https://huggingface.co/docs/hub/spaces-config-reference) supports `sdk: static`, a build command, built HTML path, thumbnail, short description and tags. A Personal Worlds static demo mirror is technically feasible. It remains a static snapshot and provides no private runtime CMS. Our browser does the WebGL work; a GPU Space is unnecessary. Deployment has not been tested on Spaces in this pass.

A mirror would expose the work on an AI-oriented profile, but we have no evidence it would improve adoption over Pages. Prioritize the adaptation proof and clear install flow first; reconsider a Space when a content-specific scientific/creative instrument gives the AI/research audience a concrete reason to try it. Avoid maintaining two demos with different capabilities or revisions.

**Curated lists:** [travisvn/awesome-claude-skills contribution rules](https://github.com/travisvn/awesome-claude-skills/blob/main/CONTRIBUTING.md) require tested standalone value, documentation/dependencies/license, at least ten stars for consideration, and explicitly reject PRs generated/submitted with AI assistance. It is not an immediate launch hack. If eligible later, the human can decide whether to submit under those rules. Do not game the threshold, automate a PR or imply an official Anthropic endorsement. No verified official marketplace listing exists for Personal Worlds today.

## A free 21-day experiment

The dates below are a suggested work schedule, not an automation or a scheduled posting commitment. External sharing needs a separate human decision and any required authorization.

| Period | Work | Evidence needed before moving on |
| --- | --- | --- |
| **6–12 October** | Shorten the first-use path; verify template/default branch and CLI installation in a disposable project; verify advertised agent hosts or label untested ones; finish a second identity's world; ask up to five willing testers to try setup and find one entry. | At least three independent successful setup/content-edit attempts, recorded with failures; one complete distinct adaptation; usable phone and fallback views. Numbers are small pilot goals, not statistical evidence. |
| **13–19 October** | Fix the recurring blockers; create one real comparison clip of both identities; tag a small release with exact tested scope; have the human share one technical Three.js Showcase if they choose; answer feedback with actual fixes. | A reproducible release, clear scope and a concise record of external issues/observations. If setup still fails, continue fixes instead of launching wider. |
| **20–26 October** | Add a contributor-friendly theme contract/example if testers need it; evaluate whether people adapted the world rather than only admired it; consider one human-written Show HN if eligible, otherwise continue targeted testers. Reconsider a Static Space only if the audience/use case warrants it. | At least two independently adapted outputs or clear explanations of why adoption stopped. Use that evidence to choose the next feature. |

The pilot's aim is **two real users making something theirs**, not a predetermined star total. Five testers are enough to expose setup friction, not to prove the skill improves design quality. Do not solicit upvotes/comments to influence a platform ranking.

## Measurements that inform a decision

1. **Successful adaptation:** number of independent people who can produce a working portfolio, modify content, and explain which interaction expresses their story. Track volunteered artifact links and outcomes, not identities without consent.
2. **First-use friction:** actual time to first working scene and first successful content edit, host/version, failed step, and required human help. Keep manual records; no paid analytics or tracking code is needed for the pilot.
3. **Useful feedback:** reproducible bugs, meaningful design critique, contributions and feature requests. A “nice” comment or star is weaker evidence than someone completing an adaptation.
4. **Discovery:** snapshot GitHub unique visitors, full clones, referring sources and stars weekly. [GitHub traffic documentation](https://docs.github.com/en/repositories/viewing-activity-and-data-for-your-repository/viewing-traffic-to-a-repository) exposes the previous fourteen days to people with push access and is available for public repos on Free. Do not sum overlapping fourteen-day windows. Full clone counts are not unique people, installs or completed portfolios; bots and repeat activity limit interpretation.
5. **Skill discovery:** optional aggregated skills.sh installation count, clearly labeled as its measure. It does not demonstrate invocation or successful output and omits telemetry opt-outs. Our current skill has no verified listing/metric from this pass.

If visitors arrive but nobody starts, improve the proposition and first action. If starts occur but setup fails, improve installation. If people complete setup but their worlds all look alike, improve the identity-to-interaction method and theme contract. If people successfully adapt it, use their permitted examples as the next release's evidence. These diagnoses are hypotheses to validate, not causal conclusions from counts alone.

## Scope and limitations

Research used current author repositories/sites/posts, platform documentation and official community rules. It did not access private analytics, verify every README claim, assess all visual quality, or establish a global priority/novelty claim. Awwwards' requested case-study page timed out, so no claim here depends on its unseen content. Current HN/Reddit/community rules and free hosting policies can change and should be checked before any actual submission. Broader originality and rights findings remain bounded by the linked uniqueness/provenance reviews.

## Bounded public skill discovery check

Performed **2026-10-06** after the research above. The official npm package [`skills`](https://www.npmjs.com/package/skills/v/1.7.1) was pinned to **1.7.1**. Registry metadata pointed to [`vercel-labs/skills`](https://github.com/vercel-labs/skills) and the package tarball at `registry.npmjs.org`; the package manifest agreed. Runtime was Node **25.6.1**, npm **11.9.0**.

The test used a newly created temporary working directory and isolated npm cache. It set **`DISABLE_TELEMETRY=1` and `DO_NOT_TRACK=1`**. The executed command, with the disposable cache path represented by a task variable, was:

```sh
DISABLE_TELEMETRY=1 DO_NOT_TRACK=1 \
  npm --cache "$personal_worlds_check_dir/npm-cache" exec --yes \
  --package=skills@1.7.1 -- \
  skills add oroikono/personal-worlds --list
```

**Result: exit 0, one discovered skill, `build-personal-world`, with the expected description.** The CLI cloned the public repository, listed the skill and cleaned up that clone. Its generic “Agent detected — installing non-interactively” banner also appeared, but inspection of the pinned package's `--list` code path confirmed that it exits before skill selection/installation. No project skill folder or lock file appeared in the disposable project; no global installation or host setting was requested. The same pinned code disables telemetry and audit requests when either of the two opt-out variables is set. This is source-backed opt-out verification, not a network packet capture.

A separate public GitHub API read confirmed [`skills/build-personal-world/`](https://github.com/oroikono/personal-worlds/tree/d6ac0bf5c4f96c2f238c8d876b00835bf5b0c7ae/skills/build-personal-world) contains `SKILL.md`, optional `agents/` metadata and all three references: `theme-method.md`, `content-and-cms.md`, `review-and-rights.md`. The public default-branch head read immediately after the test was **`d6ac0bf5c4f96c2f238c8d876b00835bf5b0c7ae`**. The CLI listing itself does not report a commit hash or validate every reference.

This establishes **public-source skill discovery and the presence of the canonical reference files**. It does not establish reference copying during installation, invocation by Claude Code/Codex, skill quality, update/removal behavior, a skills.sh listing or an install-count increase. The existing starter demonstration remains separate evidence of the application.

The user also plans to share on X. A human-approved video/demo link there is a sensible first lightweight experiment using the audience they already have. This is a distribution recommendation, not evidence that X guarantees reach or stars. No X post was published by this research pass.
