# Provenance and originality review

Date: 2026-10-06. An independent review agent inspected source commit `7412d8b` and deployment commit `b4f63e4`, including tracked history, the release file inventory, dependencies, notices, scene code and skill text. The coordinating agent checked the copied module/notice hashes again. Neither agent contacted rights holders.

**Finding:** no concrete unlicensed asset or missing required notice was identified in this inspected Personal Worlds release. This is a bounded evidence review, not complete legal clearance or a guarantee against claims. The separate personal portfolio, live CMS content and assets added by future users are outside this release's inventory.

## What was actually copied

Three.js **0.186.1** is the sole runtime dependency. The build copies `three.module.js`, `three.core.js` and its full MIT notice from the installed package. Both project and Three.js notices are distributed and linked from the demo footer. Installed files and the deployment checkout were byte-identical:

| Deployed file | SHA-256 |
| --- | --- |
| `vendor/three.module.js` | `9052042d676cb0fdc1ddfefe193053f34b7ac0513a616fdac4535d49987812ea` |
| `vendor/three.core.js` | `9edde002b066a9a05676a6127f67735b62baf399bdea529f2f7e31657da769e6` |
| `vendor/three-LICENSE.txt` | `8b378ebe60e2fe500158cb0ac71cb5e8b7d92953c2abcc63a0eb90499653b5bc` |

The [upstream Three.js license](https://github.com/mrdoob/three.js/blob/r186/LICENSE) permits redistribution under MIT. Preserve the copyright and permission notice with copied code; the [MIT terms](https://opensource.org/license/mit) do not require a large permanent visible credit panel.

Only three demo screenshots are tracked media, including the inspected history. No portrait, paper figure, reference-site screenshot, downloaded model, font, texture or audio file was identified in this source release. Runtime inspection found no external model, texture, font or audio loader. Scene geometry, materials, shaders and controls are recorded as written for this project with AI assistance. Procedural construction alone is not proof that a design or code passage cannot resemble another work.

## What informed the work

The user's personal-world brief supplied the sea/Greek exploration theme, sailing between destinations, career voyage, keyboard access, research/projects/news split and easy content maintenance. Existing projects supplied context and general design principles:

- Playable portfolio discovery and traveling between content destinations have clear precedents, including Bruno Simon's portfolios.
- Reusable 3D infrastructure, agent design guidance, thematic scene skills and configurable portfolio starters exist in React Three Next, frontend-design, UI UX Pro Max, 3Dviz Pro Max, SonicXBoy and ORBIT.
- JETT, ABZÛ and FAR: Changing Tides were conceptual references for exploration, scientific instruments, the sea and vessel/environment storytelling. Their code, artwork, soundtracks and game assets are not bundled.
- The skill directory/frontmatter follows the published Agent Skills format. Adopting that format is distinct from copying another skill's expressive instructions.

Sources and reuse boundaries remain in [the related-work record](prior-art.md). These references do not imply endorsement or grant permission to reuse their assets. The audit does not reconstruct every historical prompt or establish which reference first supplied each generic principle.

## Skill-text comparison

The independent agent compared the skill and its three references: **2,926 normalized words**, against **47 installed taste/impeccable Markdown documents containing 80,612 words**. The longest exact overlap was five generic words, “use when the user wants”; taste alone reached four. Comparisons with the current public frontend-design and 3Dviz Pro Max skill texts reached three and four generic words respectively. No substantial verbatim passage was detected in these comparisons.

This is a bounded exact-phrase check. It does not test paraphrase, distinctive selection/arrangement, source-code similarity, every upstream revision, or the originality of AI output. Installed third-party skills from the personal-site checkout are absent from this template and deployment. The initial source arrived as one complete commit, so a detailed authoring history cannot be inferred from Git alone.

## Supported positioning

Suggested description:

> An AI-assisted Aegean portfolio observatory with project-authored procedural scenes, an interactive sea-as-instrument layer, readable content views and a portable workflow for other personal themes.

The contribution is this particular implementation and workflow: one structured content model drives the readable index and world; a bounded cyclic route supports pointer and keyboard exploration; the sea has an adjustable illustrative interference field, lens picking and atlas/voyage camera modes; the portable skill connects identity, objects, materials, motion, content maintenance and provenance.

These features support a distinctive project description. They do not establish the first playable portfolio, first 3D portfolio skill, new wave mathematics, patentability or an unprecedented combination. The field is an illustrative analytic visual study, not a research result. A hosted CMS and independently routed entry pages are extensions, not shipped features.

Possible next contributions to investigate are content-specific interactive instruments derived from the author's own research, and documented rules that generate meaningful world changes from content updates. These are proposals, not implemented or verified globally novel features.

## Reuse and remaining limits

[Swiss IPI guidance](https://www.ige.ch/en/protecting-your-ip/copyright/the-basics) distinguishes ideas and algorithms from protected expression such as source code, artwork and photographs. Newness or combining ideas does not establish permission for copied material. Record the exact source, license/permission, modifications and required notices for each future reused asset. Credit alone does not grant reuse rights.

Keep required dependency notices. Optional inspiration acknowledgments can remain in repository documentation. Do not import reference-site art, screenshots, skill text or code into a release merely because it is public or an AI can restate it.

No exhaustive source-similarity, trademark/name, patent, jurisdiction-wide, native-binary or live-CMS clearance was performed. No claim about exclusive copyright ownership of every AI-assisted passage is made. Missing provenance is reported as missing evidence, not automatically as infringement. Recheck the inventory when dependencies, content or media change.
