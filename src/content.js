export const collections = Object.freeze([
  { id: 'work', label: 'Projects' },
  { id: 'research', label: 'Research' },
  { id: 'journal', label: 'Journal' },
  { id: 'journey', label: 'Journey' },
  { id: 'news', label: 'News' },
]);
const kinds = new Set(['project', 'paper', 'note', 'chapter', 'news']);
const ids = new Set(collections.map(item => item.id));

function text(value, label, maximum = 12000) {
  if (typeof value !== 'string' || !value.trim() || value.length > maximum) throw new Error(`${label} must be nonempty text, at most ${maximum} characters.`);
  return value;
}
export function safeLink(value) {
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) ? url.href : null;
  } catch { return null; }
}

/** This starter ships an explicit set of local figure files, never remote URLs. */
export function safeFigureSource(value) {
  return typeof value === 'string' && value === value.trim() && value.length <= 180 && /^\.\/figures\/[a-z0-9][a-z0-9_-]*\.(?:svg|png|jpe?g|webp)$/.test(value) ? value : null;
}
function figureRecord(value, label, keys) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(key => !keys.includes(key))) throw new Error(`${label} contains invalid figure metadata.`);
  return value;
}
function validateFigure(input, id) {
  const figure = figureRecord(input, `${id}.figure`, ['src', 'alt', 'caption', 'stages']);
  if (!safeFigureSource(figure.src)) throw new Error(`${id}.figure.src must be a safe local figure URL.`);
  if (!Array.isArray(figure.stages) || figure.stages.length < 1 || figure.stages.length > 3) throw new Error(`${id}.figure.stages requires one to three stages.`);
  const seen = new Set();
  const stages = figure.stages.map((inputStage, index) => {
    const stage = figureRecord(inputStage, `${id}.figure.stages[${index}]`, ['id', 'label', 'src', 'description']);
    if (typeof stage.id !== 'string' || stage.id.length > 48 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(stage.id) || seen.has(stage.id)) throw new Error(`${id}.figure.stages has an invalid or duplicate stage id.`);
    seen.add(stage.id);
    if (!safeFigureSource(stage.src)) throw new Error(`${id}.figure.stages[${index}].src must be a safe local figure URL.`);
    return { id: stage.id, label: text(stage.label, `${id}.figure.stages.label`, 80), src: stage.src, description: text(stage.description, `${id}.figure.stages.description`, 2000) };
  });
  return { src: figure.src, alt: text(figure.alt, `${id}.figure.alt`, 400), caption: text(figure.caption, `${id}.figure.caption`, 2000), stages };
}

/** Provider boundary: unknown or malformed content never replaces a valid snapshot. */
export function validateContent(input) {
  if (!input || input.schemaVersion !== 1 || !input.identity || !Array.isArray(input.items)) throw new Error('Expected schemaVersion 1, identity, and an items array.');
  if (input.items.length > 1000) throw new Error('Content snapshot exceeds 1000 entries.');
  if (typeof input.demo !== 'boolean') throw new Error('demo must explicitly be true or false.');
  const identity = {
    name: text(input.identity.name, 'identity.name', 160),
    headline: text(input.identity.headline, 'identity.headline', 300),
    bio: text(input.identity.bio, 'identity.bio', 4000),
  };
  const seen = new Set();
  const items = input.items.map((item, index) => {
    if (!item || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.id || '') || seen.has(item.id)) throw new Error(`items[${index}] has an invalid or duplicate id.`);
    seen.add(item.id);
    if (!ids.has(item.collection) || !kinds.has(item.kind)) throw new Error(`${item.id} has an unknown collection or kind.`);
    if (item.published !== undefined && typeof item.published !== 'boolean') throw new Error(`${item.id}.published must be a boolean.`);
    if (!Array.isArray(item.tags) || item.tags.length > 12 || !Array.isArray(item.links) || item.links.length > 12) throw new Error(`${item.id} requires bounded tags and links arrays.`);
    const links = item.links.map(link => {
      const href = safeLink(link?.url);
      if (!href) throw new Error(`${item.id} contains an unsafe or invalid link.`);
      return { label: text(link.label, `${item.id}.links.label`, 160), url: href };
    });
    return {
      id: item.id, collection: item.collection, kind: item.kind,
      title: text(item.title, `${item.id}.title`, 300),
      summary: text(item.summary, `${item.id}.summary`, 2000),
      body: text(item.body, `${item.id}.body`),
      tags: item.tags.map(tag => text(tag, `${item.id}.tags`, 80)), links,
      published: item.published === true,
      ...(item.status ? { status: text(item.status, `${item.id}.status`, 80) } : {}),
      ...(item.date ? { date: validateDate(item.date, item.id) } : {}),
      ...(item.figure !== undefined ? { figure: validateFigure(item.figure, item.id) } : {}),
    };
  });
  return { schemaVersion: 1, demo: input.demo, identity, items };
}
function validateDate(value, id) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value) throw new Error(`${id}.date must be a real YYYY-MM-DD date.`);
  return value;
}
export function publishedItems(snapshot, collection) {
  return snapshot.items.filter(item => item.published === true && item.collection === collection);
}
/** Apply this at the server/build boundary, before serializing any public payload. */
export function publicSnapshot(snapshot) {
  return { ...snapshot, items: snapshot.items.filter(item => item.published === true) };
}
export async function fetchContent(url = './content.json') {
  const response = await fetch(url, { cache: 'no-store', headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`Content request returned HTTP ${response.status}.`);
  return validateContent(await response.json());
}
