# Edit a world through prompts

Use this reference when the user wants to change an existing world's scene,
objects, readers, buttons, controls or game behavior through natural language.
The coding agent interprets the request. A validated executor can apply a small
typed change; it does not understand prompts by itself. An embedded browser
assistant or MCP editor is a separate integration, not an assumed capability.

## Ground the edit

Inspect the current app and identify the smallest affected layer:

| Layer | Target examples | Keep separate |
| --- | --- | --- |
| Environment | light, atmosphere, water, terrain, camera | content and routes |
| Entity | an object's builder, placement, material, content binding | stable identity and unrelated placements |
| Reader | popup, page, figure, annotation, media | the underlying publication and links |
| Controls | button shape, typography, layout, focus treatment | the action they invoke |
| Interaction | states, transitions, picking, keyboard alternatives | appearance and reading selection |
| Optional game | discoveries, authored objectives, progress | immediate readable access |

Resolve “this object” from an actual selection, screenshot or named item; do not
guess silently when there are multiple plausible targets. Infer reversible
choices when the scope is clear. Ask only for material missing information.
Preserve the user's stack, CMS, budget, facts, content IDs and ordinary URLs.
A button restyle should not replace navigation or rebuild the environment.

## Choose configuration or code

Read the real schema and available components before mapping a request. Use
configuration when the requested value is represented and validated. Persist it
in the project's editing source, not only a temporary browser state. Reject
invalid values before any write; show the precise changed fields.

If the request is absent from the schema—an unfolding room, a telescope that
inspects a figure, a new vehicle—author the component and its bounded interface.
Register it with the app's existing selection/actions, add only the configuration
it actually supports, and test its real behavior. Do not pretend that a color
preset implements a new world or that generic code generation is instantaneous.
Adapt to the project; copied skills need no particular starter files or API.

Keep the action separate from its visual control. A scene object, keyboard
activation and HTML button should call the same semantic operation. Define
states and transitions before animation, including closing, interrupted travel,
focus restoration and browser history where applicable. Keep selection and
reading available while motion is paused or reduced.

## Carry one edit through review

1. Identify the target and preserve a checkpoint of the affected settings or
   source. Use an existing diff/versioning workflow; do not reset unrelated work.
2. Apply the minimal validated patch or code change. Preserve content bindings
   and manual motion preferences. Report what the edit can actually change.
3. Refresh the real runtime through its supported path. Distinguish local live
   configuration from a deployed static snapshot. New source code may need a
   rebuild; external content and settings endpoints can refresh independently.
4. Inspect the rendered change. For lighting, compare a consistent composition;
   for a popup, exercise open/close and focus; for movement, check interruption
   and pause. Use a phone viewport when layout or controls changed.
5. Check that the same content and links remain reachable. Offer a scoped undo
   that refuses to overwrite independent later changes. Config undo does not
   reverse arbitrary new code; use the source checkpoint for that.

Keep proof small and local: the affected diff, checks and before/after captures.
Do not retain whole agent sessions or credentials as edit history. Never claim
transactional recovery, arbitrary edits, hosting integration or host discovery
unless the implementation and checks support it.

## Let the theme supply the game

Use the person's supplied work to choose a small meaningful activity: inspect
three instrument stations, follow a documented journey, compare supplied stages,
or gather annotations from actual entries. Define the goal, visitor action,
feedback and optional completion. Avoid arbitrary scores, invented achievements,
mandatory reading gates or claims that a scripted field is a research result.

For cinematic direction, combine a useful speculative mechanism with consistent
materials and motion. A temporal dial can display dated work; a scale corridor
can move from a landscape to an actual figure; a workshop can reconstruct
supplied project stages. These are proposals until built. Read
[futuristic-direction.md](futuristic-direction.md) when the premise needs design.

Realism needs geometry, scale, materials, coherent lighting and inspected asset
quality within a device budget. A prompt alone cannot guarantee photorealism.
Keep original procedural assets or record reuse permission and licensing for
new models/textures; do not lift movie/game assets when studying their ideas.

## Accompanying starter pilot

When the Kaimerva repository is actually present, its README describes
`data/world.json` and a config-only apply/undo CLI. The shipped pilot changes
three existing themes, exposure/key-light strength, inline/dialog reading,
solid/glass panels, square/pill controls and sea-only starting instruments/view.
It does not provide arbitrary scene entities, a game-rule editor, prompt parsing
inside the browser or a general plugin API. New requests still require authored
code and review in the host agent.
