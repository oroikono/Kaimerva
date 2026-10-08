# Prompt-editable worlds — 7 October 2026

The requested product lets people describe changes to a world's environment,
3D entities, popups, buttons, interactions and optional game concepts. That is
broader than selecting a themed portfolio preset. The reusable contribution
must be evaluated against existing editors as well as design skills.

## Close primary-source precedents

| Tool | What its author documents | What this review establishes |
| --- | --- | --- |
| [Spline AI Agent](https://docs.spline.design/spline-ai/ai-agent) | Prompt editing of scene objects, materials, lights, animation, interfaces and interaction/code; selection supplies context and standard editor history supports undo | Broad prompt-based 3D/UI editing is already advertised. The agent requires a paid plan and AI credits. Documentation was read; no account or editor execution was tested |
| [Needle MCP](https://engine.needle.tools/docs/ai/needle-mcp-server.html) | External agents can inspect and edit local 3D scenes through a connector, including objects and lighting | Host-agent scene editing is an existing documented workflow. No connector was installed or exercised |
| [Pascal Editor](https://github.com/pascalorg/editor) | Open-source local-first building editor, CLI/MCP access and public agent skills | Local code ownership and agent editing are not alone a new category. Its impressive hosted “Next” preview is explicitly distinguished from the open-source release. Neither was run here |

These are primary documentation checks, not comparative usability tests or an
exhaustive search. No scene code, models, screenshots or media from these tools
were imported. Their capabilities disprove a broad “first prompt-editable 3D
world” claim; they do not determine the originality of a specific authored work.

## A product direction worth testing

Personal Worlds can focus on **personal content that stays connected to an
authored environment while an agent changes the presentation and behavior**.
Facts, works and stable URLs remain distinct from scene objects, reader
presentation, controls and optional game rules. The creator describes an edit;
the agent grounds its target, applies supported configuration or generates the
missing component, checks the rendered result and supplies a scoped undo.

This is a potential useful combination, not demonstrated exclusive novelty.
The portable skill should work in the person's existing stack rather than
requiring this starter or a paid editor. It uses the creator's existing coding
agent; it is not a free bundled model or a deployed visitor chat service.

Useful prompt examples include:

- “Keep my harbor and work. Make the light quieter and the metal less glossy.”
- “Open papers in a glass reader. Keep the DOI link and keyboard access.”
- “Turn this one research station into an instrument that compares my supplied
  method stages. Keep the other objects where they are.”
- “Add an optional expedition through three actual projects; readers can still
  open every project immediately.”

The first two can use configuration only if those values exist. The latter two
need new authored geometry or logic; a preset switch cannot satisfy them.

## Cinematic proposal: the Chronoscope harbor

For the creator, a proposed **rehearsal mode** could preview an alternative
version in the same composition: old structures remain as restrained outlines
while the new world resolves around them. A comparison control exposes what
changed; acceptance persists it and undo returns to the previous checkpoint.
This requires two compatible scene representations and a bounded rendering
budget; the pilot has neither. Version comparison and ghost geometry have
precedents in editing tools, so their presence alone is not a novelty claim.

The person's world becomes a spatial instrument for exploring time and scale.
A dated journal/CV supplies a temporal dial. Turning it changes the visible
work and journey labels without rewriting the facts. Selecting a research
instrument can move the camera from the coast into the scale of its actual
figure; the figure's readable caption and paper link are available immediately.
Project workshops can reconstruct supplied stages rather than inventing them.

An optional expedition asks visitors to investigate a few real questions, with
quiet visual feedback when each has been inspected. No forced tutorial, score
or game completion is needed to read. Transitions stay deliberate, coherent and
interruptible; reduced motion uses static states and ordinary controls.

Its quality would come from the exact objects, materials, framing, sounds and
choreography. Time travel, scale changes and exploration have many precedents in
games and film. This proposed composition is **not built and not claimed as a
global first**. Use those works as conceptual references; author the visual
assets and implementation or verify reuse rights.

## Implemented first slice

The starter now has a validated `data/world.json`, a typed config-only
`scripts/world-edit.mjs` executor and runtime refresh. Supported fields cover
existing themes, exposure/key-light strength, reader presentation, panel/button
style and sea-only starting field/view settings. Config history is local and
excluded from the public build. Content remains in `data/site.json`.

Natural-language interpretation belongs to Codex/Claude or another host agent.
The CLI receives a JSON patch, not a sentence. New geometry, custom popups,
arbitrary interactions, free steering, actual game rules and live visitor AI
are outside this first slice. It adds no runtime dependency or paid service.

See [verification](../verification.md) for the three consecutive environment,
reader and interaction edits checked in the real starter, followed by undo.
The same content source was preserved byte for byte. A second world with a
different authored interaction would provide stronger evidence than more
feature promises or another preset-colored screenshot.
