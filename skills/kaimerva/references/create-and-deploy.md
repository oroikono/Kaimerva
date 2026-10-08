# Create a deployable world

Use this path for a new project when the user accepts a plain Three.js static
starter. Preserve a requested framework or existing app by adapting it instead.
Installing a skill, generating source, building a site and publishing it are
different operations. Do not treat one as proof of the others.

## Bootstrap from this copied skill

Resolve the **actual skill folder** from this document's location. With Node.js
22 or newer, run its helper from any working directory:

```sh
node <skill-folder>/scripts/create-world.mjs <new-project-directory> --theme sea
```

Replace the placeholders with resolved paths using structured arguments or safe
shell quoting. The destination must be new or empty and its parent must exist.
Choose `sea`, `orbital` or `woodland`; default is sea. The helper verifies every
bundled source file against its SHA-256 manifest, refuses symlink/traversal paths
and nonempty destinations, and sets the theme and compatible starting view.
It never installs, invokes Git, contacts a service or deploys.

The copied `assets/starter/` includes the complete runtime, supplied figures,
source content, settings, build/check/preview tools, package/lockfile and notices.
Do not fetch the original repository or assume its demos and films are required.
Keep the folder complete; `SKILL.md` alone does not carry these capabilities.

In the generated directory:

```sh
npm ci
npm run check
npm run dev
```

Local preview defaults to http://127.0.0.1:4310. Set `PORT` when that address is
already occupied. It builds source at startup and reads edited content/settings
JSON on refresh; restart it after source or figure-file changes.

## Complete the user's brief

Personalize `data/site.json`, `index.html` and visible branding. Use only supplied
or verified facts; keep placeholders explicitly labeled rather than inventing
papers, venues, employers or achievements. Stable entry IDs connect selection
and reading. New records join a collection; this starter does not automatically
create a physical model for each record.

Use `data/world.json` for supported themes, lighting, reader/panel/button styles
and starting view. Use `scripts/world-edit.mjs` for reviewed typed patches and
undo. Natural language is interpreted by the host agent, not that executor.
The optional **Enter the world** session supports held-route travel in all
three settings, with a low sea camera and overview in orbital/woodland. Charting
requires physical proximity to a reachable beacon plus E / Space or its native
button. Passing a destination or reading remotely grants no discovery. The
per-session chart survives reading and setting changes; it has no storage/account
dependency. Pause/reduced motion use deliberate destination steps instead.
Read directly and leave play without losing content access.
Inspection shares a selected record and supplied view, with different physical
housings in the three settings. A mountain observatory, city or new travel rule
needs authored scene/controller code and appropriate review.

Use `src/world.js` and its scene modules for geometry, surfaces, atmosphere,
camera and motion; use `src/styles.css` for reading and control layout. Follow
the parent skill's composition, interaction and review guidance when changing
those systems. Update `data/assets.json` for new media and preserve applicable
licenses. The demo includes no private CMS records or third-party paper figures.

## Build, review and publish

Run `npm run check`, then `npm run build`. The result is `dist/`; `npm run preview`
serves that build. The checker validates content, world settings, figure files
and provenance fields; it does not replace rendered review or legal review.
Report checks and browser evidence separately. If browser access is unavailable,
retain the artifact and state that limitation.

Deploy **the contents of `dist/`**, including the license and vendor notices.
Raw `data/` can contain unpublished records; never expose the source directory
as the web root. The included `vercel.json` configures `npm ci`, `npm run build`
and output directory `dist`. Verify the generated project root and Framework
Other in Vercel. GitHub Pages or a Hugging Face Static Space can also serve the
reviewed output; account configuration is separate. Use current official provider
documentation when actually configuring a deployment.

Production is a static snapshot. Local edits require another build/publication,
independently replacing validated public JSON, or a runtime content adapter.
There is no hosted CMS, live Notion integration, automatic deployment or embedded
AI chat. Add server-side credentials only when implementing an authorized CMS
provider. Add entry pages, metadata and a sitemap in the chosen framework when
the user needs a search-facing portfolio.

Return the project location, reviewable preview/build, edit map and actual test
results. Publish only within the user's authorization; do not commit, create an
account or send promotional posts because this guide describes deployment.
