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

The demo's three wave-study SVG plates are original illustrative artwork, not paper figures or research results. Three additional supplied project diagrams explain Kaimerva itself. No third-party media is imported. If adding a portrait, figure, music, model or texture, record its creator, source, license/permission, processing changes and required notice in an asset ledger. Being pictured in a photo or credited on a paper does not itself establish every reuse right. Code's MIT license does not change a third-party media license.

## Figures and the inspection passage

An item may omit `figure` entirely. To show a supplied figure, use one view by default: the main image is both the readable source and the first inspection view. Add up to three views only when you have meaningful supplied images and accurate descriptions for them.

Projects use the same optional media format. The chooser lists all published
entries with supplied images. A landmark opens the chosen entry in that
collection, or its first inspectable entry when none has been chosen; the normal
index keeps all records available. Setting switches inside inspection retain
the selected work and view while replacing the physical housing. Stable
collection IDs define placement. If an active record moves to another
collection during refresh, inspection closes into that collection's ordinary
index rather than retaining an obsolete scene anchor.

```json
"figure": {
  "src": "./figures/main-figure.svg",
  "alt": "Describe the figure's content and essential relationships.",
  "caption": "The supplied caption, source and appropriate reuse notice.",
  "stages": [
    {
      "id": "main",
      "label": "Main figure",
      "src": "./figures/main-figure.svg",
      "description": "Explain what this supplied image shows, without inventing results."
    }
  ]
}
```

Validation requires nonempty bounded text, one to three stage records, and unique lowercase stage IDs such as `main` or `method-detail`. Figure paths must be `./figures/` followed by a single lowercase filename starting with a letter or number and using letters, numbers, hyphens or underscores, with a `.svg`, `.png`, `.jpg`, `.jpeg` or `.webp` extension. Remote URLs, nested paths, traversal, query strings and fragments are rejected. A malformed figure rejects the incoming content snapshot; the browser keeps its last valid snapshot for that page session.

To replace the illustrative study, place an authorized image in `figures/`, update the item's figure metadata, and replace its demo title, text, tags and status with accurate information. Record the image's reuse basis in `data/assets.json`; keep required third-party notices. Use static SVGs without scripts, foreign objects or external references. The build accepts regular local files up to 8 MiB and copies only figures referenced by published entries. Draft-only and unreferenced files are excluded.

In the local preview, **Refresh content** applies metadata changes, including captions and view order, without a rebuild when their image files are already in `dist/`. Adding or replacing image files in `figures/` requires rebuilding; restarting `npm run dev` does this. Static publication still serves a built snapshot: publish updated JSON and image files together, or provide a validated server-side content adapter. The inspection passage displays supplied images; it does not generate new paper figures or arbitrary scenes from this metadata.
