# Kaimerva: what is distinctive, and what already exists

Reviewed **8 October 2026, Europe/Zurich** against the local skill, starter source,
asset manifest and current primary sources. This is a comparison of documented
capabilities and a bounded text check. Competing products were not installed or
run, and their marketing promises are not treated as benchmark results.

**Kaimerva has a distinctive implementation within an existing category.**
There is substantial conceptual overlap. “Nothing like it exists,” “the first
3D portfolio skill” and “the first prompt-editable world” are unsupported claims.
Overlap in a purpose or technique is different from evidence of copied code,
prose or artwork.

## Closest overlaps

The linked skill files were fetched and read in full. Links are pinned to the
upstream commits retrieved during this review.

| Existing work | Established overlap | Kaimerva's narrower emphasis and reuse boundary |
| --- | --- | --- |
| [ORBIT customization skill](https://github.com/HenrikBrehm/orbit/blob/7d88a007ef7bb969275d0c10d9e64ffe0989a929/skill/SKILL.md) | A 3D portfolio template plus an agent skill; typed configuration, content edits, scene tuning, recipes and validation. This directly precedes the broad product combination. | Kaimerva's skill adapts to an existing stack and uses a supplied-content reading workflow. ORBIT's [commercial license](https://github.com/HenrikBrehm/orbit/blob/7d88a007ef7bb969275d0c10d9e64ffe0989a929/LICENSE) prohibits redistributing the template and extracting its skill/recipes for outside use. No ORBIT material was imported in this review. |
| [Memory Palace](https://github.com/bingran-you/bingran-you/blob/94fc84df2844fe6374a496bfecce83e8a503f8c1/repo-skills/memory-palace/SKILL.md) | A portable skill for integrating a specific 3D portfolio into an existing website, with content replacement, asset notices and deployment checks. | Kaimerva authors other world premises rather than mounting this particular CRT/desktop. Memory Palace declares MIT in its skill, while its [repository root license](https://github.com/bingran-you/bingran-you/blob/94fc84df2844fe6374a496bfecce83e8a503f8c1/LICENSE) is GPL-3.0. It explicitly identifies a separate permission requirement for its inner upstream app. These are distinct scopes; this review grants no reuse permission. |
| [3Dviz Pro Max](https://github.com/viettranx/3dviz-pro-max/blob/d077e0e68915c25be8e71d74684d3144fd1c2aca/skills/3dviz-pro-max/SKILL.md) | Subject-driven 3D direction, object/material/motion reasoning, useful interactions, rendered inspection, performance and provenance. Its documented catalog, kits and scripts are broader authoring resources. | Kaimerva specializes in personal portfolio content, optional exploration and ordinary reading. Its copied skill contains guidance, not a competing general 3D toolkit. Upstream authored material has an [MIT license](https://github.com/viettranx/3dviz-pro-max/blob/d077e0e68915c25be8e71d74684d3144fd1c2aca/LICENSE). |
| [frontend-design](https://github.com/anthropics/skills/blob/683bc88e56f3e09ba94f7055977f3d3aa499f202/skills/frontend-design/SKILL.md) | Deliberate subject-specific aesthetics, rejection of generic defaults, coherent motion, responsive access and visual critique. These are already explicit design-skill goals. | Kaimerva adds spatial portfolio concerns and a separate working starter. Avoid claiming that intentional design or screenshot review is its invention. The skill supplies [Apache-2.0 terms](https://github.com/anthropics/skills/blob/683bc88e56f3e09ba94f7055977f3d3aa499f202/skills/frontend-design/LICENSE.txt). |
| [3D Website Architect](https://github.com/deveshpunjabi/3d-website-skill/blob/98f4cd4bfdf4cbb87c0f40d59d681158c490e9a5/skills/3d-website-architect/SKILL.md) | A design-to-build workflow with cinematic 3D, animation references, responsive fallbacks and validation; portfolios are an explicit use case. | Kaimerva focuses on a person's supplied works and their reading/maintenance relationship. Broad claims about futuristic websites from one brief overlap. Upstream has an [MIT license](https://github.com/deveshpunjabi/3d-website-skill/blob/98f4cd4bfdf4cbb87c0f40d59d681158c490e9a5/LICENSE). |
| [interactive-portfolio](https://github.com/sickn33/antigravity-awesome-skills/blob/ec0254763ac8d61a810899fe8d961c1ac01215e8/skills/interactive-portfolio/SKILL.md), its [complete guide](https://github.com/sickn33/antigravity-awesome-skills/blob/ec0254763ac8d61a810899fe8d961c1ac01215e8/skills/interactive-portfolio/references/detailed-guide.md) and [3d-web-experience](https://github.com/sickn33/antigravity-awesome-skills/blob/ec0254763ac8d61a810899fe8d961c1ac01215e8/skills/3d-web-experience/SKILL.md) | Personal branding, project storytelling, game-like navigation, 3D scenes, mobile usability and unobstructed content access. They also document an immersive-portfolio workflow. | Kaimerva supplies a more specific spatial/content method and an authored demonstration. The collection's [root license](https://github.com/sickn33/antigravity-awesome-skills/blob/ec0254763ac8d61a810899fe8d961c1ac01215e8/LICENSE) is MIT; these files attribute their source to Vibeship under Apache-2.0. Verify the applicable source terms before any reuse. |

Prompt-based scene editing also has clear precedents. [Spline's AI Agent](https://docs.spline.design/spline-ai/ai-agent)
documents objects, materials, lighting, animation, interfaces, game logic and
normal undo history. Its [Agent Skill documentation](https://docs.spline.design/generate/spline-agent-skill)
adds routing and maintenance guidance, though its linked public skill file
returned 404 during this review. [Needle MCP](https://engine.needle.tools/docs/ai/needle-mcp-server.html)
documents agent access to live scenes and persistent source edits.
[r3f-mcp](https://github.com/r3f-mcp/r3f-mcp) documents live scene mutations,
component injection, scaffolding and eight environment profiles. These primary
documents establish overlap, not that every advertised operation was tested here.

## What this project can demonstrate

The local starter has three authored settings sharing readable content and
destination navigation. Its supplied figure opens through a six-leaf optical
iris, with one to three authored image views, immediate text, keyboard controls,
Pause, a reversible return and a flat reading fallback. These are concrete
project choices, not new optical or graphics algorithms.

Content records and supported presentation settings are separate. Local refresh
and a typed settings apply/undo command are implemented. Natural-language
interpretation belongs to the host coding agent. Arbitrary game rules, a general
world-plugin API, automatic per-entry scene reconciliation and a hosted CMS are
not shipped features.

The [independent city creation trial](skill-forward-test-2026-10-07.md) and
[actual Codex discovery test](skill-install-test-2026-10-08.md) provide separate,
bounded evidence. They do not show superiority to another skill, universal host
compatibility or cinematic realism. The public demo and older films must be
updated before they are presented as evidence of the current local features.

## Fresh text and provenance check

Compared the final entrypoint and all six guidance references: **7 files, 6,066
normalized words**. The comparison corpus was the seven upstream entrypoint
files linked in the table, plus the Interactive Portfolio guide: **8 files,
12,464 words**. Each document was lowercased and tokenized into ASCII
alphanumeric words; Python `SequenceMatcher(autojunk=False).find_longest_match()`
was applied to every local/upstream document pair. License text and icon notices
were excluded from this prose check.

| Upstream document | Longest contiguous normalized match |
| --- | ---: |
| Memory Palace | 4 words |
| ORBIT | 2 words |
| 3Dviz Pro Max | 4 words |
| frontend-design | 3 words |
| 3D Website Architect | 4 words |
| interactive-portfolio | 3 words |
| Interactive Portfolio guide | 2 words |
| 3d-web-experience | 3 words |

The four-word matches are generic language or Markdown path tokens. **No
substantial verbatim passage was detected in this corpus.** This does not test
paraphrase, distinctive selection/arrangement, full upstream reference libraries,
code similarity, asset resemblance or every possible source. The inspected
entrypoint's SHA-256 was
`9a8c28740dad0d960779cf38f00ea7dc94340e73ac277d8bff3d4ab8433e44d1`;
later edits require a fresh comparison if this result is applied to them.

This pass imported no competitor code, instructions, models or media into
Kaimerva. The [asset manifest](../../data/assets.json) records Three.js as the
copied runtime, procedural demo assets and the separately credited AI-generated
icon. The [earlier audit](../provenance-audit.md) has its own snapshot and limits;
this recheck does not expand it into a complete historical source-code audit.
No exhaustive name/trademark, patent or legal clearance was performed.

## Public wording

> Kaimerva is a free agent skill and Three.js starter for explorable portfolios.
> Build around your own work, keep it readable, and change the world through
> your coding agent.

Explain the actual interaction and show the actual output. A precise demo makes
a stronger case than an unsupported uniqueness claim. For stronger performance
claims, compare the same supplied briefs across skills, record revisions and
measure reading, editing and interaction outcomes. That evidence is not yet
available.
