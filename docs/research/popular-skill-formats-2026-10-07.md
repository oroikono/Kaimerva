# Popular agent skill formats: presentation and organization

Research date: **7 October 2026**. Public GitHub API snapshots were taken at **09:57–09:58 UTC (11:57–11:58 Europe/Zurich)**. This is a purposive comparison of relevant, visible projects, not an exhaustive survey of GitHub or a causal explanation of their popularity. README files, actual recursive file trees, selected skill manifests, contributor guides and license files were read. No third-party package was installed, invoked or copied into Personal Worlds.

**Observation** means a fact visible in those sources. **Proposal** means our interpretation of what could transfer. Stars and forks measure public attention; they do not establish active users, successful skill invocations, output quality, or which presentation choices caused attention. Collection metrics belong to the collection, not to an individual skill.

## Attention snapshot

| Project | Stars | Forks | Scope and status |
| --- | ---: | ---: | --- |
| [Superpowers](https://github.com/obra/superpowers) | 296,161 | 26,437 | General development skill framework; active |
| [Anthropic Skills](https://github.com/anthropics/skills) | 179,983 | 21,287 | Entire collection; **not frontend-design-specific** |
| [UI UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) | 133,704 | 14,168 | Design skill, catalogs and installer; active |
| [Impeccable](https://github.com/pbakaus/impeccable) | 78,001 | 4,636 | Design command system and tooling; active |
| [Get Shit Done, former home](https://github.com/gsd-build/get-shit-done) | 64,361 | 5,431 | **Archived**; README redirects to GSD Core |
| [Skills CLI](https://github.com/vercel-labs/skills) | 33,311 | 2,849 | Installer/discovery infrastructure, rather than a design skill |
| [Vercel Agent Skills](https://github.com/vercel-labs/agent-skills) | 32,020 | 2,807 | Entire collection; active |
| [GSD Core, current home](https://github.com/open-gsd/gsd-core) | 10,257 | 739 | Active continuation; default branch `next` |

Exact API URLs, retrieval times and inspected paths are in [the source ledger](popular-skill-sources-2026-10-07.json). Spec Kit was screened as an adjacent general workflow project, but omitted from the detailed comparison to keep this analysis about inspectable design and skill first-use patterns. Its attention does not establish demand for portfolio worlds.

## Repository profiles

### UI UX Pro Max

**Observed presentation:** multilingual navigation → release/catalog/license badges → short purpose statement → large preview → related-product promotion → design-system explanation → features/free-versus-premium distinction → installation → example prompts → contributor workflow → troubleshooting. The free repository and advertised premium offering are distinct. [README](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/main/README.md)

**Observed organization/mechanism:** `src/ui-ux-pro-max/` is the stated source of truth for CSV catalogs, Python search/generation and provider templates; `cli/` builds installation copies. A saved master design system can receive page overrides. Catalog provenance, source/license metadata and a deterministic relevance evaluator are present. These are inspected artifacts, not a benchmark we ran. [Contributor guide](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/main/CONTRIBUTING.md), [evaluator](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/main/scripts/evaluate-relevance.py)

**Proposal:** use one canonical world-pack source, a readable capability matrix and example prompts for precise tasks. Avoid a vast style catalog or premium dependency at launch. The documented toolchain adds Python and installer maintenance; the repository declares [MIT](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/main/LICENSE).

### Anthropic frontend-design inside Skills

**Observed presentation:** the parent README explains the skill concept, self-contained folders, demonstrations/limitations, supported Claude entry points and a minimal skill template. It does not present a dedicated frontend-design before/after benchmark. [Parent README](https://github.com/anthropics/skills/blob/main/README.md)

**Observed organization/mechanism:** the selected `skills/frontend-design/` folder contains `SKILL.md` and `LICENSE.txt`. Its instructions ground aesthetics in subject matter, develop a brief-specific plan, compare it against generic defaults and critique rendered output. This is a compact guidance skill rather than a renderer or installer. [Skill](https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md)

**Proposal:** keep Personal Worlds' entry skill small and make subject-to-world decisions explicit; retain implementation details in references. Verify the invoked skill with a real build instead of equating strong wording with reliable execution. The selected skill is [Apache-2.0](https://github.com/anthropics/skills/blob/main/skills/frontend-design/LICENSE.txt); the parent collection has mixed licensing, including source-available document skills. Claude.ai availability mentioned by the README involves paid plans; copying that platform requirement is unnecessary for our portable package.

### Impeccable

**Observed presentation:** one-sentence product summary and immediate quickstart → problem explanation → named command vocabulary → usage examples → anti-patterns → real before/after case study → installation options → live-mode/detector limitations → community and contribution links. Its README advertises one skill, 24 commands and 60 deterministic detectors; those counts are author claims, not our measured efficacy. [README](https://github.com/pbakaus/impeccable/blob/main/README.md)

**Observed organization/mechanism:** `skill/SKILL.src.md` routes to focused `skill/reference/` playbooks and nested agents; provider-specific outputs are generated from one source. Durable product facts in `PRODUCT.md` are separate from visual decisions in `DESIGN.md`. The larger repo includes CLI/engine, browser tooling, demos and tests. [Source skill](https://github.com/pbakaus/impeccable/blob/main/skill/SKILL.src.md), [developer guide](https://github.com/pbakaus/impeccable/blob/main/docs/DEVELOP.md)

**Proposal:** a small action vocabulary plus separated identity/content facts and world direction fits us well. A binary, native hooks, browser editing and provider transformations are substantial extra maintenance; do not inherit them by default. [Apache-2.0 license](https://github.com/pbakaus/impeccable/blob/main/LICENSE) and explicit [third-party notices](https://github.com/pbakaus/impeccable/blob/main/NOTICE.md) make derivation visible.

### Superpowers

**Observed presentation:** clear methodology promise → table of contents → conversational workflow explanation → harness-specific installation → short workflow → recovery guidance → categorized skill library → philosophy/contribution/update/license/telemetry information. [README](https://github.com/obra/superpowers/blob/main/README.md)

**Observed organization/mechanism:** composable `skills/<name>/SKILL.md` folders, supporting references/prompt templates, harness manifests/hooks, docs and infrastructure tests. Skill-writing guidance requires baseline and pressure-scenario testing; the README separates behavior evaluations from plugin tests. [Writing-skills guidance](https://github.com/obra/superpowers/blob/main/skills/writing-skills/SKILL.md)

**Proposal:** distinguish direction, build, verify and adaptation phases; attach acceptance evidence to each. Use the baseline-versus-skill comparison idea, without imposing an entire development methodology on a five-minute portfolio starter. Some features require subagent/runtime support, and the optional visual companion discloses telemetry. The project is [MIT](https://github.com/obra/superpowers/blob/main/LICENSE). Its contribution policy is intentionally selective and requires changes to work across supported harnesses.

### Vercel Agent Skills

**Observed presentation:** brief definition → capability catalog with concrete trigger phrases → one installation command → natural-language examples → discovery artifacts → standard folder structure/license. [README](https://github.com/vercel-labs/agent-skills/blob/main/README.md)

**Observed organization/mechanism:** individual skills plus optional scripts/references. React guidance has impact-ranked rules, metadata, generated `AGENTS.md` and generated evaluation cases; contributor instructions identify editable source versus compiled output. Web-design review fetches a current external guideline file, so that path is network-dependent. [React package guide](https://github.com/vercel-labs/agent-skills/blob/main/skills/react-best-practices/README.md), [web review skill](https://github.com/vercel-labs/agent-skills/blob/main/skills/web-design-guidelines/SKILL.md)

**Proposal:** provide clear triggers, compact rule modules, contributor templates and severity-ranked quality checks. Label generated files and whether a task works offline. The README and inspected React skill declare MIT, but the API reports no detected root license and no root license file was found in the inspected tree. Do not infer all asset permissions from that README declaration. Deployment/account-specific skills are optional capabilities, not requirements for our package.

### Skills CLI

**Observed presentation:** ecosystem purpose and agent compatibility → immediately runnable installation → temporary use without installation → source formats/options/examples → scope/update/removal → skill format/discovery → compatibility/troubleshooting/telemetry/license. [README](https://github.com/vercel-labs/skills/blob/main/README.md)

**Observed organization/mechanism:** separate CLI source, tests and a discoverability skill; standard `SKILL.md` discovery accepts several repository layouts. It offers canonical-copy symlinks or independent copies and explicit project/global scope. This repo's stars concern distribution infrastructure, not demand for world portfolios.

**Proposal:** adopt standard discovery and clearly document one preferred local install plus a manual fallback, update and uninstall. Reuse the existing installer ecosystem rather than building our own CLI first. The tool is [MIT](https://github.com/vercel-labs/skills/blob/main/LICENSE), uses Node for `npx`, and documents telemetry opt-outs. The agent/model itself can have separate costs. The commands were inspected, not executed during this research.

### GSD: archived home and current Core

**Observed status:** the former README now redirects readers to `open-gsd/gsd-core`; archived-home stars must not be attributed to Core. [Redirect](https://github.com/gsd-build/get-shit-done/blob/main/README.md)

**Observed Core presentation:** name/tagline and compatibility/test badges → concrete context-management problem → five-stage loop → one quickstart → first-project/onboarding tutorials → documentation grouped into tutorials, how-to, reference and explanation → reasoning/community/license. [Current README](https://github.com/open-gsd/gsd-core/blob/next/README.md)

**Observed organization/mechanism:** agents, commands, skills, workflow/reference/template content, installer/runtime adapters and persistent state artifacts. Verification precedes shipping. Contributor rules use issue-first proposals; testing standards demand exercising the claimed behavior rather than merely matching source text. [Contribution guide](https://github.com/open-gsd/gsd-core/blob/next/CONTRIBUTING.md), [testing standards](https://github.com/open-gsd/gsd-core/blob/next/TESTING-STANDARDS.md)

**Proposal:** borrow a small staged workflow and a first-project tutorial, plus durable decisions that survive editing sessions. A whole orchestration framework is disproportionate to this skill; installer, context and runtime requirements create upkeep. Both inspected repositories declare MIT. Core's structured phase records are a transferable mechanism, not evidence that our implementation will inherit its performance.

## Six practice clusters

| Cluster | Observed recurring pattern | Proposal for Personal Worlds | Evidence to collect |
| --- | --- | --- | --- |
| **Fast first success** | Skills CLI, Vercel and Impeccable put runnable entry paths close to the top; UI UX and GSD add example usage | Hero demo → one sentence → one preferred install → one real brief → expected result; put advanced setup later | A new user reaches a working local world using documented steps |
| **Recognizable mechanism** | Impeccable names actions; UI UX persists design rules; GSD persists state; Superpowers composes phases | Explain identity → content graph → meaningful objects → navigation → readable pages → content update; make each action observable | Recorded invocation and generated artifacts, with human edits/time compression stated |
| **Small entry, focused modules** | Anthropic uses self-contained folders; Impeccable loads playbooks; Vercel stores individual rules | One small routing skill plus world packs, operation references, schemas and examples; load only the relevant pack | Skill activates correctly and does not load every world/reference for one task |
| **Source of truth and predictable distribution** | UI UX and Impeccable generate harness copies; Vercel identifies compiled output; Skills CLI manages scope/canonical copies | One editable skill source and content schema; clearly separate starter runtime, skill, world packs and generated exports | No divergent provider copies; clean install/update/removal in the claimed hosts |
| **Proof plus limits** | Anthropic marks examples as demonstrations; Impeccable describes detector limits; Superpowers separates evals and infrastructure; GSD tests claimed behavior | Separate starter tour, verified adaptation, deterministic checks and subjective visual review; state static-host/CMS, navigation and graphics limits | Two meaningfully different people/themes, one content edit, keyboard/mobile/reduced-motion review |
| **Contributor footholds** | UI UX offers catalog contribution types; Vercel has rule templates; Impeccable has a source/build guide; GSD uses scoped proposals | A world-pack template with geometry/material/motion/navigation contract, previews, provenance and acceptance checklist | An outside contributor adds one pack without editing unrelated core code |

These clusters are synthesis, not a measured ranking. A shared pattern among starred repositories is not proof that adding it will earn stars.

## Distinctive ideas worth combining, without recreating their products

- **Impeccable:** a compact verb vocabulary and separation of durable person/content facts from visual decisions.
- **UI UX Pro Max:** one canonical source and explicit per-surface overrides; our equivalent could be core accessibility/navigation rules plus a world's art direction.
- **Vercel:** source modules with examples, declared impact and generated documentation/check fixtures.
- **Superpowers:** behavior evidence that compares a baseline with an actual invoked skill.
- **GSD Core:** durable stage decisions and a first-project tutorial organized around a completed outcome.
- **Skills CLI / Anthropic:** standard, discoverable, self-contained packaging rather than a platform subscription or mandatory proprietary editor.

**Proposed presentation order:** result preview; exact purpose; runnable first use; an authentic brief-to-result adaptation; world-pack gallery with meaningful differences; content editing; compatibility/limits; extension guide; provenance/license; contributions. Keep the starter's present features and proposed capabilities visibly separate.

The defensible case is a focused, testable system that turns a person's work into a navigable place while preserving ordinary readable, shareable pages. Modular sea, mountain, space, city and nature packs can make that case stronger if they change objects, spatial relationships and interactions. Five reskins of the same fixed destination menu would weaken it. This is a recommended direction, not a verified novelty or legal guarantee.
