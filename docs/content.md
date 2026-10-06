# Content that survives a redesign

`data/site.json` is the example provider. Stable `id` and `collection` values connect the readable index and world destinations; scene objects do not hold biographies or papers. `identity` and `items` are deliberately plain JSON.

Every item needs `id`, `collection` (`work`, `research`, `journal`, `journey`, `news`), `kind`, `title`, `summary`, `body`, `tags`, and `links`. `published: true` is required for visibility. Optional `date` is a real `YYYY-MM-DD`; optional `status` should accurately identify a paper's publication state. A successfully empty collection stays empty. Set top-level `demo: false` only after replacing the illustrative entries and identity.

## Local edits

`npm run dev` reads and validates `data/site.json` for each `/content.json` request. Edit it and press **Refresh content**. No rebuild is needed for content in that preview. Geometry/CSS/HTML changes need restarting the preview, which regenerates `dist/`.

The browser retains the last validated snapshot **in memory for the current page session** if a refresh fails; it displays that fact. This is not a persistent cache. There is no seed substitution on refresh failure, and intentionally empty data does not resurrect examples.

## Production updates

The static build contains a snapshot at `dist/content.json`. Deploying it does **not** create a CMS. To change content without rebuilding a static portfolio, either replace that JSON file on your host or expose a server/API content endpoint and adapt `fetchContent()` to read it. Do not put CMS credentials into browser JavaScript or public JSON.

For Notion, keep tokens server-side, map your collections into this schema, validate before responding, define refresh/cache behavior explicitly, and require an explicit publication flag. Check the current provider API/version in official docs when implementing it. No account, integration or live Notion adapter is configured by this starter.

Server-generated or build-generated HTML pages should be added before using the starter as a production research portfolio. The current demo uses client-rendered content; a no-JavaScript browser receives a content JSON link, not a complete server-rendered portfolio. Add canonical entry URLs, identity metadata, sitemap, and previews when adapting it to Astro/Next/another stack. Keep these routes independent of WebGL availability.

## Media

The demo has no imported media. If adding a portrait, figure, music, model or texture, record its creator, source, license/permission, processing changes and required notice in an asset ledger. Being pictured in a photo or credited on a paper does not itself establish every reuse right. Code's MIT license does not change a third-party media license.
