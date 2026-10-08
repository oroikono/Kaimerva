# Your Kaimerva world

This is a standalone, editable portfolio starter. It includes a procedural sea,
orbital field and woodland trail, a readable HTML index, optional exploration,
three figure-inspection instruments and local content/settings refresh. The sea
includes held-key and touch sailing on an authored closed route. The supplied
identity, entries and figures are explicitly examples; replace them with your work.

## Run it

Use Node.js 22 or newer. From this directory:

```sh
npm ci
npm run check
npm run dev
```

Open http://127.0.0.1:4310. Choose **Enter the world** for an optional full-viewport
play session. Hold Right/D or Left/A to travel, then **E / Space** near a beacon
to chart it and open its work. Touch direction buttons support held input;
the nearby action is also a native button. Charted lights remain gold and connect
into a completed route. Escape or **Leave world** returns to the portfolio.
The chart lasts for this page visit, including reading and theme changes.

The sea has a low boat-follow camera; space and woodland keep their overview.
During **Pause** or reduced motion, direction controls visit one place per press
and charting stays available. **Enter** or **Read the selected work** reads
immediately, anywhere, without granting discovery. The ordinary index and
inspectable landmarks remain available without playing; the HTML index also
works without WebGL. Exploration follows authored routes, not free vehicle physics.

## Make it yours

| Change | File |
| --- | --- |
| Identity, work, research, journal, journey and news | `data/site.json` |
| Theme, lighting, reader, panels and buttons | `data/world.json` |
| Figure images, captions and supplied inspection views | `figures/` and each entry's `figure` |
| Objects, placement and camera integration | `src/world.js` |
| Proximity, charted places and visual signals | `src/exploration.js`, `src/exploration-beacons.js` |
| Sky and lighting | `src/realm-atmosphere.js` |
| Gateway and locally generated materials | `src/realm-portal.js`, `src/realm-surfaces.js` |
| Figure mechanisms and reading interface | `src/figure-passage.js`, `src/figure-reader.js` |
| Typography and layout | `src/styles.css` |
| Sources, permissions and license records | `data/assets.json` |

Keep entry IDs stable. Only records with `published: true` enter the public build.
Save content and use **Refresh content** in the local preview. Save supported
settings and use **Refresh world settings**. Restart the preview after adding
figure files or changing source code. Remove `demo: true` only after replacing
the example identity and entries with accurate, publishable information.

The coding agent can apply a validated settings patch and undo its last edit:

```sh
npm run world:edit -- show
npm run world:edit -- apply my-patch.json
npm run world:edit -- undo
```

Sea, orbital and woodland are shipped settings. A new mountain, city, hybrid
world or game rule requires authored code; the settings file does not generate
new geometry. Use the installed Kaimerva skill to guide those changes. There is
no embedded AI chat, paid asset service or hosted CMS dependency.

## Build and deploy

```sh
npm run check
npm run build
npm run preview
```

Upload the **contents of `dist/`**, including `LICENSE`, `vendor/` and its notices,
to a static host. Never publish this source directory wholesale: its `data/`
may contain drafts. The included `vercel.json` selects `npm ci`, `npm run build`
and output directory `dist`. Import this project in Vercel using Framework
**Other** and verify those settings. Account setup and deployment are separate
actions; generating the project does not publish it.

GitHub Pages can serve the prebuilt output from a dedicated branch. A Hugging
Face Static Space can serve those files with `sdk: static` and
`app_file: index.html` in its README metadata. Preserve the relative asset paths.
See the [Kaimerva source repository](https://github.com/oroikono/Kaimerva) and its
`docs/deployable-skill.md` guide for provider instructions.

Production is a **static snapshot**. Local saves do not update a hosted site.
Rebuild and publish again, replace the validated public JSON, or implement a
runtime content adapter for your CMS. No Notion adapter or automatic deployment
is configured. Add rendered entry pages, identity metadata, canonical URLs and
a sitemap in your chosen stack when turning this demo into a search-facing site.

## License and evidence

Kaimerva source and supplied demo artwork are under MIT; keep `LICENSE` when
redistributing. Three.js is separately MIT-licensed and its notice is copied into
every build. The portal icon's AI generation record is in
`assets/brand/ATTRIBUTION.md`. Update the asset ledger for media you add. No personal
portrait, private CMS export or third-party paper figure ships in this starter.

The check command validates content, settings, local figure files and declared
provenance; it is not a legal clearance or a browser test. The repository tests
exercise the copied-skill scaffolder and generated build separately. The newest
graphics and touch behavior still need rendered review; no Unreal-level or
photorealism claim is made.
