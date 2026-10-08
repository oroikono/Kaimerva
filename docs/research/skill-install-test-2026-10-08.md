# Kaimerva installation test

Date: **2026-10-08**. Scope: installation portability and actual Codex skill discovery, not website quality, automatic skill selection or a new model-generated adaptation.

## Results

| Check | Result |
| --- | --- |
| Full-folder copy to a fresh Codex project | Pass |
| Full-folder copy to a fresh Claude Code project | Pass |
| Standalone package after removing the staged source | Pass for both |
| Source/copy file inventory and SHA-256 comparison | All 10 files match in both copies |
| Internal relative Markdown links | All 10 resolve within each copied package |
| YAML large-icon path | Resolves from the installed skill root |
| Artwork credit and full MIT notice | Preserved in both |
| Skill-creator format validator | Exit 0: Skill is valid! for both |
| Actual Codex discovery | Pass, bundled CLI 0.160.0 |
| Actual Claude Code discovery | Not run: Claude Code is not installed |
| New model turn or end-to-end website generation | Not run in this installation test |
| Global/user skill installation | Not performed |

An independent agent executed the README's copy commands in two temporary projects, each containing a staged `skills/kaimerva` source. The staging directory was then removed. Installed copies were checked in isolation; they did not depend on files elsewhere in the starter repository. There were no symlinks, missing references or undeclared package dependencies.

The package is **2,545,740 bytes** across 10 files, primarily the approved PNG. This is the portable skill only; the procedural starter is a separate app.

## Real Codex discovery

The installed local Codex CLI generated its own protocol types. The test used its stdio app-server interface: `initialize`, `initialized`, then `skills/list` with the temporary project as the only requested working directory and `forceReload: true`. No thread or model turn was started.

The response returned exactly one skill named `kaimerva`:

```json
{
  "name": "kaimerva",
  "scope": "repo",
  "enabled": true,
  "path": ".agents/skills/kaimerva/SKILL.md",
  "interface": {
    "displayName": "Kaimerva",
    "shortDescription": "Build and customize an explorable portfolio world",
    "iconLarge": ".agents/skills/kaimerva/assets/kaimerva-icon.png",
    "defaultPrompt": "Use $kaimerva to build or customize my explorable portfolio from this brief, preserving my content and routes, and show the reviewed result."
  }
}
```

The paths above are normalized relative to the temporary project; the actual local response used absolute paths. The sandbox initially prevented the app-server from starting. The same bounded read-only probe passed with normal local runtime permission. No persistent user skills or configuration were installed or changed.

This establishes discovery, enabled status and metadata loading in the tested Codex version. It does not establish the result of invoking the skill in every supported agent or an application's rendered quality. The earlier [independent creation trial](skill-forward-test-2026-10-07.md) remains a separate behavior check with its own scope.

## Reproduce the copy

From a Kaimerva checkout, with a fresh target project:

```sh
mkdir -p ../my-portfolio/.agents/skills
cp -R skills/kaimerva ../my-portfolio/.agents/skills/
```

For Claude Code, replace the destination `.agents/skills` with `.claude/skills`. Open the agent in the target project and invoke `$kaimerva` in Codex or `/kaimerva` in Claude Code.

For an existing installation, review its contents before replacing it; the commands are the fresh-install path. The skill requires no npm dependency install. Using the procedural starter still requires its documented Node.js setup.

Codex's documented repository discovery location is [`.agents/skills`](https://learn.chatgpt.com/docs/build-skills#where-codex-loads-local-skills). Claude Code documents [`.claude/skills` project skills](https://code.claude.com/docs/en/skills#where-skills-live); its actual runtime remains untested here.

The Kaimerva rename is currently local. A remote installer targeting the renamed folder will require publication of these changes; the older public repository cannot be treated as the tested local package.
