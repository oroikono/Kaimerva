# Portable starter validation

Date: **2026-10-08**. Scope: copied-skill scaffolding, source packaging,
dependency installation and static output. This is separate from rendered
graphics review, agent model execution and deployment to an external host.

## What now ships

The full `skills/kaimerva/` folder contains the guidance, icon, references,
optional instrument and the relocatable `scripts/create-world.mjs` helper.
Its `assets/starter/` has **37 approved payload files** plus a SHA-256 manifest:
the current world runtime, HTML reader and controls, six supplied SVG views,
explicit demo content, settings, package/lockfile, local tools, notices,
README and Vercel configuration. The original checkout is not needed to
generate a project. Node.js 22 or newer is required.

`npm run skill:pack` deterministically updates that source bundle.
`npm run skill:check`, also included in the repository's `npm run check`,
compares its exact file list and bytes with the approved source inputs.
Bundling requires the generic identity and five labeled demo-entry markers,
and excludes the repository's
research notes, launch media, portraits, private CMS exports and agent sessions.
Those markers are not a privacy classifier: future edits to their prose,
links or media still need review before redistribution.
Manifest hashes detect stale/corrupt payload bytes; they are not a signed
publisher-authentication system.

The local distribution archive is `kaimerva-skill.zip`: **52 files**, 6,175,292
uncompressed bytes and 5,083,037 ZIP bytes. Its SHA-256 is
`cf09a90c8f7a88f66637651b66be885a08b0f29b3fcf81976c43852676e7eb3e`.
ZIP integrity, byte-identical extraction (including dotfiles), and creation/check
of an orbital project from that extracted copy passed. The archive contains
only the complete `kaimerva/` folder, not the original repository or its media.

## Executed checks

| Check | Result |
| --- | --- |
| Complete copied skill, unrelated working directory | Pass |
| Sea, orbital and woodland project creation | Pass; only compatible theme/start-view fields change |
| Generated checker and settings show/apply/undo | Pass for all three settings; content unchanged |
| Generated build and local module/figure closure | Pass for all three settings |
| Local HTTP static serving | Pass for all three; source/draft paths return 404 |
| Dependency/vendor version, hashes and license preservation | Pass |
| Existing destination, symlink, corrupt/missing file and unsafe manifest refusal | Pass; no partial project/stage or changed existing bytes |
| Fresh locked dependency installation | Pass; new project, empty npm cache, real dependency directory |
| Official skill-creator format validator | Pass: `Skill is valid!` |
| Repository tests | **88 passed, 0 failed, 0 skipped** |
| Source/bundle check, static build and whitespace check | Pass |

An independent agent wrote and executed
[`tests/skill-scaffold.test.mjs`](../tests/skill-scaffold.test.mjs).
Its detached copies contain no neighboring repository or dependency install.
For the three build tests, Three.js is explicitly supplied through a temporary
symlink to the host's locked dependency; this is not called a fresh install.
The initial sandbox run skipped three local-listener checks because the OS
returned `EPERM`. The same final tests passed with local loopback permission
in the full repository run, without skips or external publication.

A separate root probe copied the complete skill into another temporary folder,
created a sea project, then executed:

```sh
npm ci --ignore-scripts --no-audit --no-fund --cache <empty-temporary-cache>
npm run check
npm run build
```

The install downloaded the lockfile's sole dependency, **Three.js 0.186.1**,
into a real new `node_modules/three` directory. The checker validated six
published figures and twelve provenance records. The build exported five
explicit demo entries. All probe project/cache files were removed afterward.
The flags disabled dependency lifecycle scripts for this probe; the documented
normal install remains `npm ci`.

The official format validator needed PyYAML, which was absent from the available
Python runtimes. PyYAML 6.0.3 was installed in an ignored project validation
folder and supplied to that validator without changing the user's Python
environment. It is not a skill or generated-project dependency.

## Limits

The current bundle has not been invoked through a new agent model turn.
Earlier [Codex discovery evidence](research/skill-install-test-2026-10-08.md)
tested the smaller guidance package; it does not prove execution of this
expanded one. Claude Code runtime discovery remains untested.

Fresh browser rendering of the newest graphics, touch controls and shader
appearance remains unreviewed because browser inspection was unavailable.
Native geometry and HTTP tests do not establish visual quality or
photorealism. No global skill installation, provider account configuration,
GitHub/Hugging Face publication or promotional post was performed here.
The public demo and launch film still show an earlier revision.

The generated project is a deployable static build. Updating a hosted site
requires another build/publication, replacing validated public JSON, or an
additional runtime content adapter. There is no live Notion/CMS integration.
