import { collections, fetchContent, publishedItems } from './content.js?v=8ae8eefc8fb7';
import { createWorld } from './world.js?v=8ae8eefc8fb7';
import { themePresets } from './themes.js?v=8ae8eefc8fb7';

const byId = id => document.getElementById(id);
const mount = byId('world');
const status = byId('scene-status');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let selected = collections.some(item => item.id === location.hash.slice(1)) ? location.hash.slice(1) : 'work';
history.replaceState({ ...history.state, destination: selected }, '');
let snapshot = null;
let paused = false;
let request = 0;
let sceneReady = false;
let currentTheme = 'sea';
let fieldEnabled = false;
let fieldSpacing = 0.45;
let sceneView = 'atlas';

function syncInstruments() {
  const isSea = currentTheme === 'sea';
  byId('sea-instruments').hidden = !isSea;
  byId('field-toggle').disabled = !sceneReady || !isSea;
  byId('field-toggle').textContent = fieldEnabled ? 'Return to sea' : 'Reveal the field';
  byId('field-toggle').setAttribute('aria-pressed', String(fieldEnabled));
  byId('view-toggle').disabled = !sceneReady || !isSea;
  byId('view-toggle').textContent = sceneView === 'voyage' ? 'Atlas view' : 'Voyage view';
  byId('view-toggle').setAttribute('aria-pressed', String(sceneView === 'voyage'));
  byId('field-settings').hidden = !isSea || !fieldEnabled;
  byId('wave-spacing').disabled = !sceneReady || !isSea || !fieldEnabled;
  byId('wave-spacing').value = String(fieldSpacing);
  byId('wave-spacing-value').value = fieldSpacing.toFixed(2);
}

function node(tag, className, value) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (value !== undefined) element.textContent = value;
  return element;
}
function renderContent() {
  const collection = collections.find(item => item.id === selected);
  byId('reader-label').textContent = `${String(collections.indexOf(collection) + 1).padStart(2, '0')} / ${collection.label}`;
  for (const link of document.querySelectorAll('.destinations a')) {
    const active = link.dataset.destination === selected;
    if (active) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
  }
  if (!snapshot) return;
  byId('identity-name').textContent = snapshot.identity.name;
  byId('identity-headline').textContent = snapshot.identity.headline;
  byId('identity-bio').textContent = snapshot.identity.bio;
  const items = publishedItems(snapshot, selected);
  const fragment = document.createDocumentFragment();
  if (!items.length) fragment.append(node('p', 'empty', 'Nothing published here yet. There is room for what comes next.'));
  for (const item of items) {
    const article = node('article', 'entry');
    article.append(node('p', 'entry-meta', `${snapshot.demo ? 'Demo entry · ' : ''}${item.kind}${item.status ? ` / ${item.status}` : ''}${item.date ? ` / ${item.date}` : ''}`));
    article.append(node('h3', '', item.title));
    article.append(node('p', 'entry-summary', item.summary));
    const details = node('details', 'entry-details');
    details.append(node('summary', '', 'Read the entry'));
    details.append(node('p', '', item.body));
    article.append(details);
    const tags = node('div', 'entry-tags');
    for (const tag of item.tags) tags.append(node('span', '', tag));
    article.append(tags);
    for (const link of item.links) {
      const anchor = node('a', 'entry-link', `${link.label} ↗`);
      anchor.href = link.url;
      anchor.target = '_blank'; anchor.rel = 'noopener noreferrer';
      article.append(anchor);
    }
    fragment.append(article);
  }
  byId('entries').replaceChildren(fragment);
}
function activate(id, fromWorld = false) {
  if (!collections.some(item => item.id === id)) return;
  selected = id;
  if (location.hash !== `#${id}`) history.pushState({ destination: id }, '', `#${id}`);
  else history.replaceState({ ...history.state, destination: id }, '');
  renderContent();
  if (!fromWorld) world.select(id);
}
const world = createWorld({
  mount, themeId: 'sea', destinations: collections,
  onVisit: (id, { openReader } = {}) => { activate(id, true); const label = collections.find(item => item.id === id)?.label; status.textContent = openReader ? `${label} opened in the readable index.` : `${label} selected. Right / Down go clockwise; Left / Up go back; Enter reads this stop.`; if (openReader) focusReader(); },
  onStatus: ({ ready, message }) => {
    sceneReady = ready;
    byId('explore').disabled = !ready;
    byId('motion').disabled = !ready || reducedMotion.matches;
    mount.tabIndex = ready ? 0 : -1;
    status.textContent = message;
    mount.classList.toggle('is-unavailable', !ready);
    syncInstruments();
  },
  onFieldChange: ({ enabled, spacing }) => {
    const changed = fieldEnabled !== enabled;
    fieldEnabled = enabled;
    fieldSpacing = spacing;
    syncInstruments();
    if (changed) status.textContent = enabled ? 'The interference field is revealed. Drag across the sea or adjust Wave spacing to explore the pattern.' : 'The ocean surface is restored.';
  },
  onViewChange: ({ view }) => {
    const changed = sceneView !== view;
    sceneView = view;
    syncInstruments();
    if (changed) status.textContent = view === 'voyage' ? 'Voyage view. Arrows follow the route closer to the water.' : 'Atlas view. All five stops form one circular route.';
  },
  onExit: () => byId('explore').focus(),
});

function syncMotion() {
  const motionPaused = paused || reducedMotion.matches;
  world.setMotion(!motionPaused);
  byId('motion').textContent = reducedMotion.matches ? 'Reduced motion' : paused ? 'Resume motion' : 'Pause motion';
  byId('motion').disabled = !sceneReady || reducedMotion.matches;
  byId('motion').setAttribute('aria-pressed', String(motionPaused));
}
syncMotion();
syncInstruments();
byId('motion').addEventListener('click', () => { paused = !paused; syncMotion(); });
reducedMotion.addEventListener('change', syncMotion);
byId('explore').addEventListener('click', () => { mount.focus({ preventScroll: true }); status.textContent = `Right / Down follow the loop clockwise. Left / Up go back. Enter reads the selected stop. Escape returns to this button.${currentTheme === 'sea' ? ' F reveals the field; V changes the view.' : ''}`; });
byId('field-toggle').addEventListener('click', () => {
  fieldEnabled = !fieldEnabled;
  world.setField(fieldEnabled, fieldSpacing);
  syncInstruments();
  status.textContent = fieldEnabled ? 'The interference field is revealed. Adjust Wave spacing to explore how two overlapping waves form a pattern.' : 'The ocean surface is restored. You can continue exploring the islands.';
});
byId('wave-spacing').addEventListener('input', event => {
  fieldSpacing = Number(event.target.value);
  byId('wave-spacing-value').value = fieldSpacing.toFixed(2);
  world.setField(fieldEnabled, fieldSpacing);
});
byId('view-toggle').addEventListener('click', () => {
  sceneView = sceneView === 'atlas' ? 'voyage' : 'atlas';
  world.setView(sceneView);
  syncInstruments();
  status.textContent = sceneView === 'voyage' ? 'Voyage view. Follow the route closer to the water; arrows still move between neighboring stops.' : 'Atlas view. All five stops form one circular route.';
});
for (const button of document.querySelectorAll('button[data-theme]')) {
  button.addEventListener('click', () => {
    const theme = themePresets.find(item => item.id === button.dataset.theme);
    if (!theme) return;
    currentTheme = theme.id;
    fieldEnabled = false;
    fieldSpacing = 0.45;
    sceneView = 'atlas';
    for (const choice of document.querySelectorAll('button[data-theme]')) choice.setAttribute('aria-pressed', String(choice === button));
    document.body.dataset.theme = theme.id;
    byId('world-kicker').textContent = `${String(themePresets.indexOf(theme) + 1).padStart(2, '0')} / ${theme.name}`;
    byId('world-description').textContent = theme.description;
    byId('world-title').textContent = theme.title;
    world.setTheme(theme.id);
    world.setField(false, fieldSpacing);
    world.setView('atlas');
    world.select(selected);
    syncInstruments();
  });
}
function focusReader() {
  byId('reader-label').focus({ preventScroll: true });
  byId('content').scrollIntoView({ behavior:reducedMotion.matches ? 'auto' : 'smooth', block:'start' });
}
for (const link of document.querySelectorAll('.destinations a')) link.addEventListener('click', event => { event.preventDefault(); activate(link.dataset.destination); focusReader(); });
window.addEventListener('popstate', event => {
  const hashId = location.hash.slice(1);
  const id = collections.some(item => item.id === hashId) ? hashId : event.state?.destination;
  if (collections.some(item => item.id === id)) { selected = id; renderContent(); world.select(id); }
});
window.addEventListener('hashchange', () => {
  const id = location.hash.slice(1);
  if (collections.some(item => item.id === id)) activate(id);
  else history.replaceState({ ...history.state, destination: selected }, '');
});
async function refresh() {
  const current = ++request;
  byId('refresh').disabled = true;
  byId('content-status').textContent = 'Checking the content source…';
  try {
    const next = await fetchContent();
    if (current !== request) return;
    snapshot = next;
    renderContent();
    byId('content-status').textContent = `${next.demo ? 'Example content' : 'Your content'} · refreshed ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. ${next.items.filter(item => item.published).length} published entries.`;
  } catch (error) {
    if (current !== request) return;
    byId('content-status').textContent = `${error.message} ${snapshot ? 'Showing the last validated snapshot from this session.' : 'No content loaded; check content.json.'}`;
  } finally { if (current === request) byId('refresh').disabled = false; }
}
byId('refresh').addEventListener('click', refresh);
renderContent(); world.select(selected); refresh();
window.addEventListener('pagehide', event => { if (!event.persisted) world.destroy(); });
