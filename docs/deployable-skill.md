# A portfolio from the copied skill

The portable Kaimerva skill includes a source starter in
`assets/starter/` and a local scaffolder in `scripts/create-world.mjs`.
The generated project builds a static site without the original Kaimerva
repository, its research notes, launch videos or agent sessions.

The starter contains three authored settings: **sea**, **orbital** and
**woodland**. The skill helps a coding agent customize them or author new
components. Installing it does not create a hosted site, connect a CMS or
automatically generate arbitrary worlds.

## Create a project

Use Node.js 22 or newer, as required by the starter's `package.json`.
From the directory containing the extracted `kaimerva/` skill folder:

```sh
node kaimerva/scripts/create-world.mjs my-world --theme sea
cd my-world
npm ci
npm run check
npm run build
npm run preview
```

Use `--theme orbital` or `--theme woodland` for the other settings.
The destination must be new or empty, with an existing parent directory.
The scaffolder checks its bundled file manifest before copying; it refuses
nonempty destinations and symlink paths. It sets the selected world and makes
no network calls, dependency installs, Git commits or deployments.

`npm ci` uses the included lockfile and rejects a dependency mismatch rather
than rewriting it. It downloads the pinned dependency when it is not available
locally. See the [official npm ci documentation](https://docs.npmjs.com/cli/v11/commands/npm-ci/).

`npm run preview` serves the built `dist/` locally. Stop it before starting
`npm run dev`, which rebuilds source once and reads content/settings JSON on
each request. The standalone starter has a source/content check; the upstream
repository's larger test suite is separate.

You can also copy the entire `assets/starter/` directory, including its dotfiles,
into a new project directory. Keep the relative layout intact and run the same
install/check/build commands there. That manual copy keeps the bundled default
settings; the scaffolder applies a chosen theme for you.

## Make it yours

| Edit | Source |
| --- | --- |
| Biography, projects, research, journal, news and links | `data/site.json` |
| Theme, light strength, reader style, button shape and starting view | `data/world.json` |
| Browser title, description, brand and introductory copy | `index.html` |
| Scene objects, positions, camera and motion | `src/world.js` and its local scene modules |
| Reading and control layout | `src/styles.css` |
| Supplied project or paper views | `figures/` and the corresponding content record |
| Asset sources, license and permission records | `data/assets.json` |

Replace or explicitly retain the labeled demo records before advertising the
site as your portfolio. Keep actual claims and links grounded in your work.
Publication flags filter exported content; they do not hide source records in
a public Git repository.

For settings changes, inspect `node scripts/world-edit.mjs show`, then apply a
small JSON patch with `node scripts/world-edit.mjs apply patch.json`.
`node scripts/world-edit.mjs undo` reverses the latest compatible settings edit;
it refuses to overwrite independent changes. History stays in ignored `.local/`.
This executor applies typed settings and does not parse natural-language prompts.

Sea supports the voyage view and illustrative interference field. Orbital and
woodland require `startView: "atlas"` and `fieldEnabled: false`. New settings,
vehicles or interaction mechanisms require authored code and review.

## Build and publish

Run `npm run check` and `npm run build` after editing. Publish the **contents of
`dist/`** when using a static upload; keep its `LICENSE`, brand attribution and
`vendor/three-LICENSE.txt`. The build filters unpublished records and copies
only referenced figure files. Its output uses relative URLs and can run at a
domain root or project subdirectory.

### Vercel

The generated project includes this local deployment configuration:

```json
{
  "installCommand": "npm ci",
  "buildCommand": "npm run build",
  "outputDirectory": "dist"
}
```

Import your generated project as the project root and choose **Other** as its
framework preset. Confirm the install, build and output settings above before
deploying. Vercel serves the output directory's contents; the explicit `dist`
setting keeps raw editing sources outside the hosted site. These field names
are documented in [Vercel Project Configuration](https://vercel.com/docs/project-configuration),
and the dashboard options in [Configuring a Build](https://vercel.com/docs/builds/configure-a-build).

### GitHub Pages

Build locally, add an empty `.nojekyll` to the output, and publish that output
at the root of a dedicated deployment branch. Select that branch and its root
in **Settings → Pages**. Alternatively, configure an Actions workflow to build
and publish `dist/`. Your new repository needs its own Pages settings;
the starter does not inherit the Kaimerva repository's deployment setup.
See [GitHub's publishing-source instructions](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

### Hugging Face

For a prebuilt static Space, upload the reviewed contents of `dist/` with a
Space `README.md` whose opening YAML includes:

```yaml
---
title: My portfolio
sdk: static
app_file: index.html
---
```

Static Spaces are served without a paid compute instance. Their optional
source-build path can instead use `app_build_command` and
`app_file: dist/index.html`; verify that workflow separately if choosing it.
See [Hugging Face's static Space documentation](https://huggingface.co/docs/hub/spaces-sdks-static).

## Updating a hosted site

Local development reads edited `data/site.json` and `data/world.json` on the
next request. A static deployment serves exported `content.json` and
`world.json` snapshots: another build and publication are needed for local
source edits to reach visitors.

A deployed runtime content provider, or independently replaceable public JSON,
can decouple content refresh from the scenery build. That is an additional
integration; this starter has no live Notion or other CMS connection. Keep
provider credentials on its server. The local preview server is a development
tool, not a production CMS.

Build success and native geometry checks establish a buildable artifact. Review
the rendered desktop/phone layout, reading, keyboard input, Pause and fallback
when browser tools are available. Report those separately from compilation and
source checks; this guide does not certify an individual deployment or its
visual quality.
