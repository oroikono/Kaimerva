# Content and CMS boundary

Read this reference when adding content providers, an editor, a journey timeline
or publishing behavior. Keep the rendering model independent of the storage
choice. Respect an existing CMS that meets the user's needs.

## Small provider contract

A starter can begin with local JSON. The scene needs IDs and destination meaning;
the reading view needs factual text and usable links. Keep scene coordinates,
camera targets and meshes out of CMS prose. A useful provider result contains:

- Normalized records with stable unique IDs, explicit publication state, title,
  summary, destination and supporting links.
- Source per collection, such as `local`, `cms`, `fallback` or `cache`.
- Safe diagnostics that do not echo raw documents, credentials or private data.

Use optional image metadata for source, creator, applicable license or permission,
alt text and processing changes. Code repository licensing does not establish
the license of a related paper image or photograph.

Do not require every provider to adopt one universal database schema. Normalize
at its boundary, validate bounded plain text, reject duplicate IDs/slugs and
unsafe URLs, and expose the same domain objects to the interface. Do not render
CMS HTML as trusted markup by default.

## Publication and failure semantics

Publication must be explicit. A missing publication field is private; a missing
draft status must not accidentally publish a row. Apply publication filtering to
public lists, detail routes, search, feeds and sitemaps consistently.

Distinguish these outcomes:

| Provider outcome | Appropriate behavior |
| --- | --- |
| Valid query with no published rows | Keep the collection empty |
| Not configured | Use declared demo/fallback data if the user chose that behavior |
| Request failure | Surface safe provenance and follow the declared failure policy |
| Persisted last-known-good content | Label it as cached with its actual freshness evidence |

Do not replace a valid empty result with seed records. Bundled seed data is a
fallback, not proof of current public content and not a last-known-good cache.
Demo claims must not become another person's biography in a template.

## Local editing and live CMS editing

A local file edit ordinarily needs the site's build/deployment workflow before
it reaches a hosted site. A browser editor that writes repository JSON is not a
production CMS. If implemented, make its local save result explicit, avoid stale
overwrites with revisions, write atomically and restrict the endpoint to its
intended environment.

A runtime CMS can update content independently after its integration is deployed.
Keep its token and provider calls on the server. Describe request-driven cache
revalidation accurately: a five-minute window does not guarantee every visitor
sees an edit exactly five minutes after saving. Explain the refresh mechanism
and which content source is active without exposing secrets.

Connector access in a coding tool is not evidence that the website's own runtime
credentials work. Test the actual integration when configured; otherwise label
mock/provider tests and untested live behavior separately.

For files whose hosted URLs expire, refresh through the provider or use an
authorized stable source. A saved URL alone does not establish persistent image
delivery or rights to redistribute the file.

## Journey content

Use ordered authored milestones with factual titles, periods, organizations or
contexts, summaries and optional locations. Validate the complete sequence so a
partial parse does not silently change chronology. Return fresh arrays rather
than allowing consumer mutations to alter fallback records.

Several milestones can share one place without inventing another trip. Separate
the active text chapter from the current traveler pose and its arrival event.
For geographic travel, validate finite coordinates and handle coincident stops,
the date line, poles and antipodes if supported. Explain approximate locations
and symbolic routes. For a conceptual theme, use authored waypoints without
pretending they are historical geography.

## What to report

State which file or CMS collection edits content, whether the change was saved,
the provider actually exercised, and the public refresh/deployment mechanism.
Keep content auditing focused: provenance, duplicate IDs, missing links,
publication state and unsupported claims. A complete row is not proof its claims
or rights have been independently verified.
