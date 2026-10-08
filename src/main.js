import { collections, fetchContent, publishedItems } from './content.js?v=39a02493892c';
import { createWorld } from './world.js?v=39a02493892c';
import { themePresets } from './themes.js?v=39a02493892c';
import { DEFAULT_WORLD_CONFIG, validateWorldConfig } from './world-config.js?v=39a02493892c';
import { createFigureReader } from './figure-reader.js?v=39a02493892c';

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
const helmPointers = new Map();
let voyageState = { destination: selected, sailing: false, axis: 0 };
let playing = false;
let playState = { nearId: null, discovered: [], count: 0, total: collections.length, complete: false, revision: 0, available: false };
let lastChartRevision = 0;
const playIsolation = new Map();

const playCopy = {
  sea: { title: 'Take the longer way around.', description: 'Five islands, five signals. Sail to their beacons, chart what you find, and step inside the work.', objective: 'Chart the archipelago', between: 'Open water', verb: 'Sail' },
  orbital: { title: 'Follow a distant signal.', description: 'Pilot the route between five stations. Chart their signals, inspect the instruments, and discover the work.', objective: 'Chart the signal field', between: 'Between signals', verb: 'Pilot' },
  woodland: { title: 'Leave the familiar path.', description: 'Guide a small light through five clearings. Chart what grows there and open the stories behind it.', objective: 'Chart the woodland trail', between: 'Between clearings', verb: 'Follow the trail' },
};
for (const collection of collections) {
  const marker = document.createElement('li');
  marker.dataset.chart = collection.id;
  marker.textContent = collection.label;
  byId('play-chart').append(marker);
}

function paintPlayState() {
  const copy = playCopy[currentTheme];
  const near = collections.find(item => item.id === playState.nearId);
  const charted = near && playState.discovered.includes(near.id);
  byId('play-entry-title').textContent = copy.title;
  byId('play-entry-description').textContent = copy.description;
  byId('play-objective').textContent = playState.complete ? 'Your chart is complete' : copy.objective;
  byId('play-progress').textContent = `${playState.count} / ${playState.total} beacons charted`;
  byId('play-near-label').textContent = near ? charted ? 'A place you have charted' : 'A signal within reach' : 'Follow the beacons';
  byId('play-near-title').textContent = near?.label || copy.between;
  byId('play-interact').disabled = !playing || !playState.available || !near;
  byId('play-interact-label').textContent = near ? charted ? 'Open this place' : 'Chart this place' : 'Approach a beacon';
  byId('play-next').textContent = playState.complete ? 'The lights connect. Keep exploring, or read the work.' : 'Chart each beacon by arriving and pressing E / Space.';
  byId('play-controls-hint').textContent = paused || reducedMotion.matches
    ? '← / → or buttons visit one place per press. E / Space charts.'
    : `Hold A / D or ← / → to travel. E / Space charts · Esc leaves.`;
  byId('play-map').hidden = currentTheme !== 'sea';
  byId('play-map').textContent = sceneView === 'voyage' ? 'Map view' : 'Follow the boat';
  byId('play-map').setAttribute('aria-pressed', String(sceneView === 'atlas'));
  byId('play-pause').disabled = reducedMotion.matches;
  byId('play-pause').textContent = reducedMotion.matches ? 'Reduced motion' : paused ? 'Resume' : 'Pause';
  byId('play-pause').setAttribute('aria-pressed', String(paused || reducedMotion.matches));
  for (const marker of document.querySelectorAll('[data-chart]')) {
    const done = playState.discovered.includes(marker.dataset.chart);
    marker.classList.toggle('is-charted', done);
    marker.classList.toggle('is-near', marker.dataset.chart === playState.nearId);
    marker.setAttribute('aria-label', `${collections.find(item => item.id === marker.dataset.chart).label}: ${done ? 'charted' : 'uncharted'}`);
  }
}

function setPlayIsolation(enabled) {
  if (enabled) {
    for (const element of document.querySelectorAll('.masthead, .skip, .intro, #content, footer, .world-section > :not(.world-slot)')) {
      playIsolation.set(element, element.inert);
      element.inert = true;
    }
  } else {
    for (const [element, inert] of playIsolation) element.inert = inert;
    playIsolation.clear();
  }
  const frame = document.querySelector('.world-frame');
  if (enabled) {
    frame.setAttribute('role', 'dialog');
    frame.setAttribute('aria-modal', 'true');
    frame.setAttribute('aria-label', 'Playable portfolio world');
  } else {
    frame.removeAttribute('role'); frame.removeAttribute('aria-modal'); frame.removeAttribute('aria-label');
  }
}

function enterPlay() {
  if (!sceneReady || figureReader?.active || playing) return;
  clearHelmPointers();
  playing = true;
  document.body.dataset.playing = 'true';
  byId('play-entry').hidden = true;
  byId('play-overlay').hidden = false;
  setPlayIsolation(true);
  world.setPlaying(true);
  mount.focus({ preventScroll: true });
  paintPlayState();
  status.textContent = 'World entered. Follow a beacon, then E or Space charts it and opens its work. Escape leaves play.';
}

function leavePlay({ focus = true } = {}) {
  if (!playing) return;
  clearHelmPointers();
  playing = false;
  world.setPlaying(false);
  document.body.dataset.playing = 'false';
  byId('play-entry').hidden = false;
  byId('play-overlay').hidden = true;
  setPlayIsolation(false);
  if (focus) byId('play-enter').focus({ preventScroll: true });
}

function clearHelmPointers() {
  const held = [...helmPointers.entries()];
  helmPointers.clear();
  for (const [id, { button }] of held) if (button.hasPointerCapture(id)) button.releasePointerCapture(id);
  if (held.length) world.setSailingAxis(0);
  for (const button of document.querySelectorAll('[data-sail]')) button.classList.remove('is-held');
}

function paintVoyageState() {
  const destination = collections.find(item => item.id === voyageState.destination) || collections[0];
  const index = collections.indexOf(destination) + 1;
  byId('voyage-destination-number').textContent = `${String(index).padStart(2, '0')} / Selected destination`;
  byId('voyage-destination').textContent = destination.label;
  byId('voyage-state').textContent = paused || reducedMotion.matches ? 'Motion paused' : voyageState.sailing ? 'Under sail' : 'At anchor';
  byId('voyage-hint').textContent = paused || reducedMotion.matches
    ? 'Arrows or direction buttons visit the next island. Enter reads.'
    : 'Hold ← / A or → / D to sail. Enter reads · Esc releases controls.';
  for (const button of document.querySelectorAll('[data-sail]')) {
    const axis = Number(button.dataset.sail);
    button.classList.toggle('is-held', voyageState.axis === axis);
    button.setAttribute('aria-label', `${paused || reducedMotion.matches ? 'Visit the next island' : 'Hold to sail'} ${axis < 0 ? 'counterclockwise' : 'clockwise'}`);
  }
}

function collectionFigure(collection = selected) {
  const choice = selectedFigure();
  if (choice?.collection === collection) return choice;
  return snapshot?.items.find(item => item.published && item.collection === collection && item.figure);
}

function selectedFigure() {
  const id = byId('inspect-entry').value;
  return snapshot?.items.find(item => item.published && item.figure && item.id === id);
}

function renderInspectionChoices() {
  const picker = byId('inspect-entry');
  const previous = picker.value;
  const records = snapshot?.items.filter(item => item.published && item.figure) || [];
  picker.replaceChildren(...records.map(item => {
    const option = node('option', '', `${collections.find(collection => collection.id === item.collection)?.label || item.kind} · ${item.title}`);
    option.value = item.id;
    return option;
  }));
  const preferred = records.find(item => item.id === previous && item.collection === selected)
    || records.find(item => item.collection === selected) || records.find(item => item.id === previous) || records[0];
  if (preferred) picker.value = preferred.id;
  picker.disabled = !records.length;
  byId('inspect-figure').disabled = !records.length;
}

function syncInstruments() {
  const isSea = currentTheme === 'sea';
  document.body.dataset.sceneView = sceneView;
  byId('sea-instruments').hidden = !isSea;
  byId('field-toggle').disabled = !sceneReady || !isSea;
  byId('field-toggle').textContent = fieldEnabled ? 'Return to sea' : 'Reveal the field';
  byId('field-toggle').setAttribute('aria-pressed', String(fieldEnabled));
  byId('view-toggle').disabled = !sceneReady || !isSea;
  byId('portal-approach').disabled = !sceneReady || !isSea;
  byId('view-toggle').textContent = sceneView === 'voyage' ? 'Atlas view' : 'Sailing view';
  byId('view-toggle').setAttribute('aria-pressed', String(sceneView === 'voyage'));
  byId('field-settings').hidden = !isSea || !fieldEnabled;
  byId('wave-spacing').disabled = !sceneReady || !isSea || !fieldEnabled;
  byId('wave-spacing').value = String(fieldSpacing);
  byId('wave-spacing-value').value = fieldSpacing.toFixed(2);
  byId('voyage-hud').hidden = !isSea || !sceneReady || sceneView !== 'voyage' || fieldEnabled;
  paintVoyageState();
  paintPlayState();
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
      const inspect = node('button', 'entry-inspect', item.kind === 'project' ? 'Inspect the project ↗' : 'Inspect the figure ↗');
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
  renderInspectionChoices();
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
    const inspectable = collectionFigure(id);
    if ((openReader || trigger === 'pointer') && inspectable && openFigure(inspectable, invoker)) return;
    status.textContent = reading ? `${label} opened for reading.` : trigger === 'steering'
      ? `${label} selected. Keep holding to sail; release to coast. Enter reads.`
      : `${label} selected. Atlas arrows visit the next island; Sailing view uses held arrows. Enter reads.`;
    if (reading) focusReader(invoker);
  },
  onStatus: ({ ready, message }) => {
    if (!ready) clearHelmPointers();
    sceneReady = ready;
    byId('play-enter').disabled = !ready;
    if (!ready && playing) leavePlay();
    byId('explore').disabled = !ready;
    byId('motion').disabled = !ready || reducedMotion.matches;
    mount.tabIndex = ready ? 0 : -1;
    status.textContent = message;
    mount.classList.toggle('is-unavailable', !ready);
    syncInstruments();
    figureReader?.syncMotion();
  },
  onFieldChange: ({ enabled, spacing }) => {
    clearHelmPointers();
    const changed = fieldEnabled !== enabled;
    fieldEnabled = enabled;
    fieldSpacing = spacing;
    syncInstruments();
    if (changed) status.textContent = enabled ? 'The interference field is revealed. Drag across the sea or adjust Wave spacing to explore the pattern.' : 'The ocean surface is restored.';
  },
  onViewChange: ({ view }) => {
    clearHelmPointers();
    const changed = sceneView !== view;
    sceneView = view;
    syncInstruments();
    if (changed) status.textContent = view === 'voyage' ? 'Sailing view. Hold the arrows or A / D to sail; Enter reads the selected work.' : 'Atlas view. All five stops form one circular route.';
  },
  onVoyageState: state => { voyageState = state; if (!state.acceptingInput) clearHelmPointers(); paintVoyageState(); },
  onExplorationState: state => {
    const previousNear = playState.nearId;
    playState = state;
    if (state.revision > lastChartRevision) {
      const id = state.discovered.at(-1);
      const label = collections.find(item => item.id === id)?.label || 'Destination';
      byId('play-feedback').textContent = state.complete ? `${label} charted. All ${state.total} beacons are connected.` : `${label} charted. ${state.count} of ${state.total} discovered.`;
      lastChartRevision = state.revision;
    } else if (previousNear !== state.nearId) {
      const label = collections.find(item => item.id === state.nearId)?.label;
      byId('play-feedback').textContent = label ? `${label} is within reach. E or Space opens this place.` : 'Keep travelling. Look for the next light.';
    }
    paintPlayState();
  },
  onExit: () => { clearHelmPointers(); if (playing) leavePlay(); else byId('play-enter').focus(); },
  onInspectionChange: state => {
    clearHelmPointers();
    figureReader?.onSceneState(state);
    if (state.phase === 'closed') status.textContent = 'Returned to the world. Your exploration view is restored; every entry is also available below.';
  },
  onInspectionImage: state => figureReader?.onSceneImage(state),
});

function openFigure(item, invoker = document.activeElement) {
  if (byId('reader-dialog').open) byId('reader-dialog').close();
  const opened = figureReader?.open(item, invoker) || false;
  if (opened) status.textContent = 'Work inspection opened. The entry is ready to read; its instrument accompanies it.';
  return opened;
}
figureReader = createFigureReader({
  world,
  motionState: () => ({ paused, reduced: reducedMotion.matches, ready: sceneReady }),
  onMotion: () => { paused = !paused; syncMotion(); },
  onSelect: id => { if (selected !== id) activate(id); },
  onReadIndex: id => {
    leavePlay({ focus: false });
    if (selected !== id) activate(id);
    byId('reader-label').focus({ preventScroll: true });
    byId('content').scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'start' });
  },
  sceneState: () => ({ theme: currentTheme }),
  onTheme: id => selectTheme(id),
});
byId('inspect-figure').addEventListener('click', event => openFigure(selectedFigure(), event.currentTarget));

function syncMotion() {
  const motionPaused = paused || reducedMotion.matches;
  if (motionPaused) clearHelmPointers();
  world.setMotion(!motionPaused);
  byId('motion').textContent = reducedMotion.matches ? 'Reduced motion' : paused ? 'Resume motion' : 'Pause motion';
  byId('motion').disabled = !sceneReady || reducedMotion.matches;
  byId('motion').setAttribute('aria-pressed', String(motionPaused));
  figureReader?.syncMotion();
  paintVoyageState();
  paintPlayState();
}
syncMotion();
syncInstruments();
byId('motion').addEventListener('click', () => { paused = !paused; syncMotion(); });
byId('play-pause').addEventListener('click', () => { paused = !paused; syncMotion(); });
byId('play-enter').addEventListener('click', enterPlay);
byId('play-leave').addEventListener('click', () => leavePlay());
byId('play-browse').addEventListener('click', () => {
  byId('reader-label').focus({ preventScroll: true });
  byId('content').scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'start' });
});
byId('play-interact').addEventListener('click', event => world.interact(event.currentTarget));
byId('play-read').addEventListener('click', () => world.read());
byId('play-map').addEventListener('click', () => {
  world.setView(sceneView === 'voyage' ? 'atlas' : 'voyage');
  mount.focus({ preventScroll: true });
});
document.addEventListener('keydown', event => {
  if (!playing || figureReader?.active || byId('reader-dialog').open) return;
  if (event.key === 'Escape' && !event.defaultPrevented) { event.preventDefault(); leavePlay(); return; }
  if (event.key !== 'Tab') return;
  const frame = document.querySelector('.world-frame');
  const targets = [...frame.querySelectorAll('button, a[href], input, select, [tabindex]')].filter(element => !element.disabled && element.tabIndex >= 0 && element.getClientRects().length);
  if (!targets.length) return;
  const first = targets[0]; const last = targets.at(-1);
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
});
reducedMotion.addEventListener('change', syncMotion);
byId('explore').addEventListener('click', () => {
  mount.focus({ preventScroll: true });
  status.textContent = sceneView === 'voyage' && !fieldEnabled
    ? 'Hold Right / D to sail forward; Left / A to sail back. Enter reads. Escape releases the helm. Paused motion uses one island per press.'
    : 'Right / Down visit the next island. Left / Up go back. Enter reads. Escape releases exploration.';
});
byId('read-destination').addEventListener('click', () => world.read());
for (const button of document.querySelectorAll('[data-sail]')) {
  button.addEventListener('pointerdown', event => {
    if (event.button !== 0 || !sceneReady || figureReader?.active) return;
    event.preventDefault();
    mount.focus({ preventScroll: true });
    helmPointers.set(event.pointerId, { axis: Number(button.dataset.sail), button });
    button.setPointerCapture(event.pointerId);
    world.setSailingAxis([...helmPointers.values()].reduce((sum, held) => sum + held.axis, 0));
  });
  const release = event => {
    if (!helmPointers.delete(event.pointerId)) return;
    if (button.hasPointerCapture(event.pointerId)) button.releasePointerCapture(event.pointerId);
    world.setSailingAxis([...helmPointers.values()].reduce((sum, held) => sum + held.axis, 0));
  };
  button.addEventListener('pointerup', release);
  button.addEventListener('pointercancel', release);
  button.addEventListener('lostpointercapture', release);
  // Native Enter/Space activation remains a single, deliberate destination step.
  button.addEventListener('click', event => { if (event.detail === 0) world.navigate(Number(button.dataset.sail)); });
}
window.addEventListener('blur', clearHelmPointers);
document.addEventListener('visibilitychange', () => { if (document.hidden) clearHelmPointers(); });
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
  status.textContent = sceneView === 'voyage' ? 'Sailing view. Hold arrows or A / D to sail; Enter reads the selected work.' : 'Atlas view. All five stops form one circular route.';
});
byId('portal-approach').addEventListener('click', () => {
  if (!sceneReady || currentTheme !== 'sea' || figureReader?.active) return;
  fieldEnabled = false;
  world.setField(false, fieldSpacing);
  activate('journey');
  sceneView = 'voyage';
  world.setView(sceneView, { portal: true });
  syncInstruments();
  mount.focus({ preventScroll: true });
  status.textContent = 'Approaching the gateway. Arrows continue the route; Enter reads Journey. Atlas view returns to the overview.';
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
    byId('scene-realm-title').textContent = { sea: 'The Aegean, after dark.', orbital: 'Between distant signals.', woodland: 'A path through the quiet.' }[theme.id];
    document.querySelector('.scene-heading > p:last-child').textContent = { sea: 'Follow the water. Find the work.', orbital: 'A field of instruments and ideas.', woodland: 'Follow a trail. Find what grows.' }[theme.id];
    world.setTheme(theme.id);
    world.setField(false, fieldSpacing);
    world.setView('atlas');
    world.select(selected);
    syncInstruments();
    figureReader?.syncTheme();
}
for (const button of document.querySelectorAll('button[data-theme]')) {
  button.addEventListener('click', () => selectTheme(button.dataset.theme));
}
function focusReader(invoker = document.activeElement) {
  clearHelmPointers();
  const dialog = byId('reader-dialog');
  if ((playing || worldConfig.interface.reader === 'dialog') && typeof dialog.showModal === 'function') {
    if (!dialog.open) {
      readerInvoker = invoker;
      dialog.showModal();
    }
    byId('dialog-reader-label').focus({ preventScroll: true });
    return;
  }
  if (playing) leavePlay({ focus: false });
  byId('reader-label').focus({ preventScroll: true });
  byId('content').scrollIntoView({ behavior:reducedMotion.matches ? 'auto' : 'smooth', block:'start' });
}
byId('close-reader').addEventListener('click', () => byId('reader-dialog').close());
byId('reader-dialog').addEventListener('close', () => {
  const usable = readerInvoker?.isConnected && !readerInvoker.disabled && !readerInvoker.closest('[inert]') && readerInvoker.getClientRects().length;
  const target = usable ? readerInvoker : playing && sceneReady ? mount : byId('reader-label');
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
  if (!playing && config.interface.reader === 'inline' && byId('reader-dialog').open) byId('reader-dialog').close();
  if (initializeInteraction && currentTheme !== config.environment.theme) selectTheme(config.environment.theme);
  world.setAppearance(config.environment);
  // A settings refresh applies changes, rather than resetting the visitor's
  // navigation and instruments to unchanged saved defaults. These setters can
  // reposition a paused camera, so do not call them on appearance/UI-only edits.
  if (currentTheme === 'sea') {
    if (applyFieldEnabled || applyFieldSpacing) {
      if (applyFieldEnabled) fieldEnabled = playing ? false : config.interaction.fieldEnabled;
      if (applyFieldSpacing) fieldSpacing = config.interaction.fieldSpacing;
      world.setField(fieldEnabled, fieldSpacing);
    }
    if (applyView) {
      sceneView = playing ? 'voyage' : config.interaction.startView;
      world.setView(sceneView);
    }
  }
  if (playing && fieldEnabled) { fieldEnabled = false; world.setField(false, fieldSpacing); }
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
window.addEventListener('pagehide', event => { clearHelmPointers(); if (!event.persisted) world.destroy(); });
