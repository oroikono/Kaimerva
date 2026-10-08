import { collections, fetchContent, publishedItems } from './content.js';
import { createWorld } from './world.js';
import { themePresets } from './themes.js';
import { DEFAULT_WORLD_CONFIG, validateWorldConfig } from './world-config.js';
import { createFigureReader } from './figure-reader.js';

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
let worldConfig = DEFAULT_WORLD_CONFIG;
let settingsLoaded = false;
let settingsRequest = 0;
let readerInvoker = null;
let figureReader = null;

function researchFigure() {
  return snapshot?.items.find(item => item.published && item.collection === 'research' && item.figure);
}

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
function collectionEntries() {
  const fragment = document.createDocumentFragment();
  if (!snapshot) { fragment.append(node('p', '', 'Loading content…')); return fragment; }
  const items = publishedItems(snapshot, selected);
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
    if (item.figure) {
      const inspect = node('button', 'entry-inspect', 'Enter the figure ↗');
      inspect.type = 'button';
      inspect.dataset.entry = item.id;
      inspect.addEventListener('click', event => openFigure(item, event.currentTarget));
      article.append(inspect);
    }
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
  return fragment;
}
function renderContent() {
  const collection = collections.find(item => item.id === selected);
  const label = `${String(collections.indexOf(collection) + 1).padStart(2, '0')} / ${collection.label}`;
  byId('reader-label').textContent = label;
  byId('dialog-reader-label').textContent = label;
  for (const link of document.querySelectorAll('.destinations a')) {
    const active = link.dataset.destination === selected;
    if (active) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
  }
  if (snapshot) {
    byId('identity-name').textContent = snapshot.identity.name;
    byId('identity-headline').textContent = snapshot.identity.headline;
    byId('identity-bio').textContent = snapshot.identity.bio;
  }
  byId('entries').replaceChildren(collectionEntries());
  byId('dialog-entries').replaceChildren(collectionEntries());
  byId('inspect-figure').disabled = !researchFigure();
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
  onVisit: (id, { openReader, trigger, invoker } = {}) => {
    activate(id, true);
    const label = collections.find(item => item.id === id)?.label;
    const reading = openReader || (worldConfig.interface.reader === 'dialog' && trigger === 'pointer');
    if (id === 'research' && (openReader || trigger === 'pointer') && researchFigure() && openFigure(researchFigure(), invoker)) return;
    status.textContent = reading ? `${label} opened for reading.` : `${label} selected. Right / Down go clockwise; Left / Up go back; Enter reads this stop.`;
    if (reading) focusReader(invoker);
  },
  onStatus: ({ ready, message }) => {
    sceneReady = ready;
    byId('explore').disabled = !ready;
    byId('motion').disabled = !ready || reducedMotion.matches;
    mount.tabIndex = ready ? 0 : -1;
    status.textContent = message;
    mount.classList.toggle('is-unavailable', !ready);
    syncInstruments();
    figureReader?.syncMotion();
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
  onInspectionChange: state => {
    figureReader?.onSceneState(state);
    if (state.phase === 'closed') status.textContent = 'Returned to the world. Your exploration view is restored; every entry is also available below.';
  },
  onInspectionImage: state => figureReader?.onSceneImage(state),
});

function openFigure(item, invoker = document.activeElement) {
  if (byId('reader-dialog').open) byId('reader-dialog').close();
  const opened = figureReader?.open(item, invoker) || false;
  if (opened) status.textContent = 'Figure passage opened. The entry is ready to read; the lens accompanies it.';
  return opened;
}
figureReader = createFigureReader({
  world,
  motionState: () => ({ paused, reduced: reducedMotion.matches, ready: sceneReady }),
  onMotion: () => { paused = !paused; syncMotion(); },
  onSelect: id => { if (selected !== id) activate(id); },
  onReadIndex: id => {
    if (selected !== id) activate(id);
    byId('reader-label').focus({ preventScroll: true });
    byId('content').scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'start' });
  },
});
byId('inspect-figure').addEventListener('click', event => openFigure(researchFigure(), event.currentTarget));

function syncMotion() {
  const motionPaused = paused || reducedMotion.matches;
  world.setMotion(!motionPaused);
  byId('motion').textContent = reducedMotion.matches ? 'Reduced motion' : paused ? 'Resume motion' : 'Pause motion';
  byId('motion').disabled = !sceneReady || reducedMotion.matches;
  byId('motion').setAttribute('aria-pressed', String(motionPaused));
  figureReader?.syncMotion();
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
function selectTheme(id) {
    const theme = themePresets.find(item => item.id === id);
    if (!theme || theme.id === currentTheme) return;
    currentTheme = theme.id;
    fieldEnabled = false;
    fieldSpacing = 0.45;
    sceneView = 'atlas';
    for (const choice of document.querySelectorAll('button[data-theme]')) choice.setAttribute('aria-pressed', String(choice.dataset.theme === theme.id));
    document.body.dataset.theme = theme.id;
    byId('world-kicker').textContent = `${String(themePresets.indexOf(theme) + 1).padStart(2, '0')} / ${theme.name}`;
    byId('world-description').textContent = theme.description;
    byId('world-title').textContent = theme.title;
    world.setTheme(theme.id);
    world.setField(false, fieldSpacing);
    world.setView('atlas');
    world.select(selected);
    syncInstruments();
}
for (const button of document.querySelectorAll('button[data-theme]')) {
  button.addEventListener('click', () => selectTheme(button.dataset.theme));
}
function focusReader(invoker = document.activeElement) {
  const dialog = byId('reader-dialog');
  if (worldConfig.interface.reader === 'dialog' && typeof dialog.showModal === 'function') {
    if (!dialog.open) {
      readerInvoker = invoker;
      dialog.showModal();
    }
    byId('dialog-reader-label').focus({ preventScroll: true });
    return;
  }
  byId('reader-label').focus({ preventScroll: true });
  byId('content').scrollIntoView({ behavior:reducedMotion.matches ? 'auto' : 'smooth', block:'start' });
}
byId('close-reader').addEventListener('click', () => byId('reader-dialog').close());
byId('reader-dialog').addEventListener('close', () => {
  const target = readerInvoker?.isConnected ? readerInvoker : byId('explore');
  readerInvoker = null;
  if (!figureReader?.active) target.focus({ preventScroll: true });
});
for (const link of document.querySelectorAll('.destinations a')) link.addEventListener('click', event => { event.preventDefault(); activate(link.dataset.destination); focusReader(); });
window.addEventListener('popstate', event => {
  const hashId = location.hash.slice(1);
  const id = collections.some(item => item.id === hashId) ? hashId : event.state?.destination;
  if (collections.some(item => item.id === id)) {
    selected = id; renderContent();
    if (figureReader?.active) figureReader.close(() => world.select(id));
    else world.select(id);
  }
});
window.addEventListener('hashchange', () => {
  const id = location.hash.slice(1);
  if (collections.some(item => item.id === id)) {
    if (figureReader?.active) figureReader.close(() => activate(id));
    else activate(id);
  }
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
    figureReader?.refresh(next.items);
    byId('content-status').textContent = `${next.demo ? 'Example content' : 'Your content'} · refreshed ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. ${next.items.filter(item => item.published).length} published entries.`;
  } catch (error) {
    if (current !== request) return;
    byId('content-status').textContent = `${error.message} ${snapshot ? 'Showing the last validated snapshot from this session.' : 'No content loaded; check content.json.'}`;
  } finally { if (current === request) byId('refresh').disabled = false; }
}
byId('refresh').addEventListener('click', refresh);
function applyWorldSettings(config) {
  const previous = worldConfig;
  const configThemeChanged = !settingsLoaded || config.environment.theme !== previous.environment.theme;
  const interactionChanged = config.interaction.fieldEnabled !== previous.interaction.fieldEnabled || config.interaction.fieldSpacing !== previous.interaction.fieldSpacing || config.interaction.startView !== previous.interaction.startView;
  const switchedForInteraction = !configThemeChanged && interactionChanged && currentTheme !== config.environment.theme;
  const initializeInteraction = configThemeChanged || switchedForInteraction;
  const applyFieldEnabled = initializeInteraction || config.interaction.fieldEnabled !== previous.interaction.fieldEnabled;
  const applyFieldSpacing = initializeInteraction || config.interaction.fieldSpacing !== previous.interaction.fieldSpacing;
  const applyView = initializeInteraction || config.interaction.startView !== previous.interaction.startView;
  worldConfig = config;
  settingsLoaded = true;
  document.body.dataset.panel = config.interface.panel;
  document.body.dataset.reader = config.interface.reader;
  document.body.dataset.buttonShape = config.interface.buttonShape;
  if (config.interface.reader === 'inline' && byId('reader-dialog').open) byId('reader-dialog').close();
  if (initializeInteraction && currentTheme !== config.environment.theme) selectTheme(config.environment.theme);
  world.setAppearance(config.environment);
  // A settings refresh applies changes, rather than resetting the visitor's
  // navigation and instruments to unchanged saved defaults. These setters can
  // reposition a paused camera, so do not call them on appearance/UI-only edits.
  if (currentTheme === 'sea') {
    if (applyFieldEnabled || applyFieldSpacing) {
      if (applyFieldEnabled) fieldEnabled = config.interaction.fieldEnabled;
      if (applyFieldSpacing) fieldSpacing = config.interaction.fieldSpacing;
      world.setField(fieldEnabled, fieldSpacing);
    }
    if (applyView) {
      sceneView = config.interaction.startView;
      world.setView(sceneView);
    }
  }
  syncMotion();
  syncInstruments();
  return switchedForInteraction;
}
async function refreshWorldSettings() {
  const current = ++settingsRequest;
  byId('refresh-world').disabled = true;
  byId('world-settings-status').textContent = 'Checking world settings…';
  try {
    const response = await fetch(new URL('../world.json', import.meta.url), { cache: 'no-store' });
    if (!response.ok) throw new Error('World settings could not be loaded.');
    const next = validateWorldConfig(await response.json());
    if (current !== settingsRequest) return;
    const switchedForInteraction = applyWorldSettings(next);
    const switchNote = switchedForInteraction ? ` Switched to ${themePresets.find(theme => theme.id === currentTheme).name} for the edited interaction controls.` : '';
    byId('world-settings-status').textContent = `World settings applied · ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Content and motion preference kept.${switchNote}`;
  } catch (error) {
    if (current !== settingsRequest) return;
    byId('world-settings-status').textContent = `${error.message} Keeping the current settings; check data/world.json.`;
  } finally { if (current === settingsRequest) byId('refresh-world').disabled = false; }
}
byId('refresh-world').addEventListener('click', refreshWorldSettings);
renderContent(); world.select(selected); refresh(); refreshWorldSettings();
window.addEventListener('pagehide', event => { if (!event.persisted) world.destroy(); });
