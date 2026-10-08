# Composing a personal world

Read this when a brief calls for a new world, a hybrid, modular directions or a
single rich prompt. Compose a place around its content; do not assemble every
available visual effect. These are portable guidance modules. The accompanying
starter has authored themes, not a general world-plugin API. New families and
combinations require implementation in the chosen project.

## Choose independent layers

Keep the content model and readable interface shared. Change the layers that
define the experience, rather than duplicating an entire site for each setting.

| Layer | Decision it changes |
| --- | --- |
| Setting / biome | Spatial arrangement, scale, environment and object silhouettes |
| Content roles | What represents work, evidence, writing, biography and recent activity |
| Material / light | A small surface vocabulary, atmosphere, contrast and contact |
| Movement / camera | Presence, overview and selection framing; optional travel behavior |
| Semantic interaction | One response that helps inspect, locate or understand actual content |
| Provider / reading | Existing storage, normalized records and ordinary pages; independent of scenery |
| Quality tier | Effects and assets affordable on the user's target devices and budget |

Roles come from the user's actual work, not a mandatory five-category menu.
Every object needs an intelligible label and immediate reading path. A visitor
can use direct selection without completing travel. Reuse the current stack;
do not require a particular engine, model service or paid dependency.

## Author one primary world

Choose a primary setting for geometry and layout. A secondary influence may
change one or two layers, such as instrumentation or materials. Resolve scale,
light and motion conflicts in the brief. Five simultaneous biomes are a collage,
not a coherent hybrid. A family is a starting constraint, not a fixed preset.

| Family | Possible spatial grammar | Content-bearing mechanism |
| --- | --- | --- |
| Sea | Harbors, breakwaters, channels, offshore structures | An inspection lens focuses a selected work object; optional vessel follows declared routes |
| Mountains | Contours, terraces, field stations, valleys | A cutaway exposes a project's authored stages or evidence; trails connect supplied milestones |
| Space | Habitat modules, anchored instruments, transfer arcs | Docking reveals a selected entry; links represent declared relationships |
| City | Districts, courtyards, workshops, archives | A workshop unfolds its project components; an archive locates entries by supplied tags |
| Nature | Clearings, canopy layers, specimens, shelters | A specimen opens an entry; a trail highlights an actual collection or tag |

Futurism can come from an unusual but understandable instrument, responsive
architecture or a convincing change of scale. Give one interaction a useful
job before adding effects. A lens must reveal supplied detail; a section must
show authored structure. Do not invent citations, relationships or scientific
measurements to make a scene look intelligent. Use luminous accents to identify
state, with light, shape and text alternatives; neon everywhere flattens depth.

## Keep direction editable without changing facts

Save a small direction record alongside the project. It describes design, not
biography, publication status or content storage. Adapt its format to the app;
this example is not a runtime schema or installed configuration API.

```json
{
  "intent": "curious, precise, welcoming",
  "primaryWorld": "sea",
  "secondaryInfluence": "space instrumentation",
  "roles": {
    "work": "harbor workshops",
    "evidence": "offshore inspection station",
    "writing": "survey cabin"
  },
  "materials": ["pale stone", "brushed metal", "warm glass"],
  "light": "late afternoon with restrained instrument glow",
  "camera": "composed overview; close inspection on selection",
  "travel": "optional authored vessel routes",
  "interaction": "lens reveals a selected entry's supplied media",
  "quality": "balanced",
  "avoid": ["forced intro", "constant rotation", "invented telemetry"]
}
```

Content IDs connect the scene and ordinary reading paths. Stable per-entry
objects, incremental reconciliation and placement overrides are useful targets
when implementing a richer runtime. They are not current starter features merely
because this record mentions roles. Implement and test them before advertising
that adding an entry creates an object or preserves all existing placements.

## Let one rich prompt initiate the work

An adequately supplied prompt can initiate inspection, direction, implementation
and verification in one agent run. It is not a guarantee of a finished site from
an ambiguous sentence. Use provided facts; declare reasonable design assumptions.
Ask only when missing content, rights or constraints materially affect the work.
Show the rendered outcome and disclose what remains unverified.

**Sea with orbital instruments.** “Use my existing portfolio content and stack.
Create a calm Mediterranean harbor with an offshore optical station: workshops
represent projects, inspection instruments represent evidence, a survey cabin
holds writing. Use pale stone and warm glass, a close camera on selection, and
an optional boat. The lens should reveal my supplied project images and source
links immediately. Keep ordinary pages and mobile reading. No paid services.
Choose a balanced quality tier and implement one complete interaction first.”

**City with ecological materials.** “Turn my supplied design work and field notes
into a compact future city grown around a central clearing. Workshops unfold to
show project stages; an archive highlights entries with the selected real tag.
Use ceramic facades, planted terraces and translucent roof panels. Navigation
should be direct, with quiet camera reframing and no traveler required. Preserve
my CMS and routes. Prioritize crisp silhouettes, readable phone layouts and one
useful interaction over elaborate shaders.”

## Match finish to the runtime

- **Lean:** strong geometry, contact, materials and static or discrete motion.
- **Balanced:** limited shadows, selective environmental motion and one instrument.
- **Cinematic:** richer lighting, shaders and authorized assets when device tests
  support them; keep a lean fallback and optional motion.

These are implementation budgets, not proof of performance or photorealism.
Review the overview, selection and phone reading state before extending effects.
Load [theme-method.md](theme-method.md) for detailed visual translation and
[content-and-cms.md](content-and-cms.md) when changing storage or publication.
