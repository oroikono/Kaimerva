# Hosting

The [public starter demo](https://oroikono.github.io/personal-worlds/) is a static GitHub Pages site. The repository's default branch contains source and the portable skill. The separate `codex/demo` branch contains only reviewed build output and dependency notices.

To host your own copy, run `npm ci`, `npm test`, `npm run check`, and `npm run build`. Publish the **contents** of `dist/`, including `LICENSE` and `vendor/three-LICENSE.txt`. For GitHub Pages branch publishing, include an empty `.nojekyll` file with that output and select the deployment branch as the Pages source. See the [official Pages source instructions](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

The relative asset URLs work at a domain root or a project subdirectory. This starter has no domain purchase, paid hosting dependency, CMS account, or automatically configured publishing workflow. A template copy does not inherit the original repository's Pages settings.

Local `data/site.json` changes are read on each content request. Static hosting serves the exported `content.json` snapshot. Updating local source requires another build and publication; a deployment with independently replaceable public JSON or a runtime content provider is needed for production updates without rebuilding the site. Keep CMS credentials in that provider's server environment, never in exported files.
