# Hosting

The [current Kaimerva demo](https://huggingface.co/spaces/oroikono/kaimerva) is a free static Hugging Face Space. The [earlier starter demo](https://oroikono.github.io/Kaimerva/) remains on GitHub Pages. The repository's default branch contains source and the portable skill; the separate `codex/demo` branch contains an earlier reviewed build and dependency notices.

To host your own copy, run `npm ci`, `npm test`, `npm run check`, and `npm run build`. Publish the **contents** of `dist/`, including `LICENSE` and `vendor/three-LICENSE.txt`. For GitHub Pages branch publishing, include an empty `.nojekyll` file with that output and select the deployment branch as the Pages source. See the [official Pages source instructions](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

The relative asset URLs work at a domain root or a project subdirectory. This starter has no domain purchase, paid hosting dependency, CMS account, or automatically configured publishing workflow. A template copy does not inherit the original repository's Pages settings.

Local `data/site.json` changes are read on each content request. Static hosting serves the exported `content.json` snapshot. Updating local source requires another build and publication; a deployment with independently replaceable public JSON or a runtime content provider is needed for production updates without rebuilding the site. Keep CMS credentials in that provider's server environment, never in exported files.

## Prepare a Hugging Face Space

After reviewing the source and launch media, run `node scripts/prepare-space.mjs`. It builds a fresh upload folder under ignored `.local/` and prints its path. The folder contains only the static app, public content, supplied figures, licenses, complete portable skill, Space card and reviewed launch media. It excludes the checkout, private edit history, dependencies, session records and research notes.

The builder expects the included Kaimerva launch video and poster. Add the complete skill ZIP to the printed folder, using Python's standard library if available:

```sh
kaimerva_stage="$(node scripts/prepare-space.mjs)"
python3 -m zipfile -c "$kaimerva_stage/kaimerva-skill.zip" skills/kaimerva
```

Check the ZIP and all card links before upload. The Space card comes from [`huggingface-space.md`](huggingface-space.md); change its identity, repository and download links when publishing your own project. Publish the prepared folder with `hf upload` to your own Space, configured with `sdk: static` and `app_file: index.html`. Do not upload the working checkout. [Official static Space documentation](https://huggingface.co/docs/hub/spaces-sdks-static).
