import test from 'node:test';
import assert from 'node:assert/strict';
import { createFigureReader } from '../src/figure-reader.js';

// Controller tests: this small harness models the DOM methods and queued
// dialog close notification used by this controller. It does not render HTML,
// emulate WebGL or prove browser layout, animation or native dialog behavior.
function dom(t) {
  const previous = globalThis.document;
  const ids = new Map();
  const document = { baseURI: 'https://portfolio.test/demo/', activeElement: null };
  const dataKey = key => key.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
  function matches(node, selector) {
    const segments = selector.split(' ');
    const simple = (value, segment) => {
      const tag = segment.match(/^[a-z]+/i)?.[0];
      const id = segment.match(/#([a-z0-9-]+)/i)?.[1];
      const classes = [...segment.matchAll(/\.([a-z0-9-]+)/gi)].map(match => match[1]);
      const data = [...segment.matchAll(/\[data-([a-z0-9-]+)(?:="([^"]*)")?\]/gi)];
      return (!tag || value.tagName === tag.toLowerCase()) && (!id || value.id === id)
        && classes.every(name => value.classList.contains(name))
        && data.every(([, key, expected]) => expected === undefined
          ? value.dataset[dataKey(key)] !== undefined : value.dataset[dataKey(key)] === expected);
    };
    if (!simple(node, segments.pop())) return false;
    let ancestor = node.parent;
    while (segments.length) {
      const segment = segments.pop();
      while (ancestor && !simple(ancestor, segment)) ancestor = ancestor.parent;
      if (!ancestor) return false;
      ancestor = ancestor.parent;
    }
    return true;
  }
  class Element {
    constructor(tagName, id = '') {
      this.tagName = tagName; this.id = id; this.dataset = {};
      this.children = []; this.parent = null; this.attributes = new Map();
      this.listeners = new Map(); this.classes = new Set(); this.text = '';
      this.hidden = false; this.disabled = false; this.open = false; this.scrollTop = 0;
      this.classList = {
        contains: name => this.classes.has(name),
        toggle: (name, enabled) => enabled ? this.classes.add(name) : this.classes.delete(name),
      };
      if (id) ids.set(id, this);
    }
    set className(value) { this.classes = new Set(value.split(/\s+/)); }
    get className() { return [...this.classes].join(' '); }
    set textContent(value) { this.replaceChildren(); this.text = String(value); }
    get textContent() { return this.text + this.children.map(child => child.textContent).join(''); }
    append(...children) {
      for (const child of children) {
        if (child.parent) child.parent.children = child.parent.children.filter(value => value !== child);
        child.parent = this; this.children.push(child);
      }
    }
    replaceChildren(...children) {
      this.children.forEach(child => { child.parent = null; });
      this.children = []; this.text = ''; this.append(...children);
    }
    setAttribute(key, value) { this.attributes.set(key, String(value)); }
    getAttribute(key) { return this.attributes.get(key) ?? null; }
    addEventListener(type, callback) {
      const listeners = this.listeners.get(type) || [];
      listeners.push(callback); this.listeners.set(type, listeners);
    }
    dispatch(type, details = {}) {
      const event = { type, target: this, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; }, ...details };
      for (const callback of this.listeners.get(type) || []) callback(event);
      return event;
    }
    click() { if (!this.disabled) this.dispatch('click'); }
    closest(selector) {
      for (let value = this; value; value = value.parent) if (matches(value, selector)) return value;
      return null;
    }
    querySelectorAll(selector) {
      const values = [];
      for (const child of this.children) {
        if (matches(child, selector)) values.push(child);
        values.push(...child.querySelectorAll(selector));
      }
      return values;
    }
    querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
    get isConnected() { return this === document.body || Boolean(this.parent?.isConnected); }
    getClientRects() { return this.isConnected && !this.hidden ? [{ width: 1, height: 1 }] : []; }
    focus(options) { document.activeElement = this; this.focusOptions = options; }
    showModal() { this.open = true; }
    close() {
      if (!this.open) return;
      this.open = false;
      queueMicrotask(() => this.dispatch('close'));
    }
  }
  document.body = new Element('body'); document.activeElement = document.body;
  document.createElement = tag => new Element(tag);
  document.createTextNode = text => { const value = new Element('#text'); value.text = text; return value; };
  document.getElementById = id => ids.get(id) || null;
  document.querySelector = selector => document.body.querySelector(selector);
  const add = (id, tag = 'div', parent = document.body) => { const element = new Element(tag, id); parent.append(element); return element; };
  const dialog = add('figure-passage', 'dialog');
  const reader = add('native-reader', 'article', dialog); reader.className = 'passage-reader';
  const details = add('flat-details', 'details', reader);
  for (const id of ['passage-title', 'passage-origin', 'passage-summary', 'passage-body', 'passage-caption',
    'passage-links', 'passage-stages', 'passage-stage-number', 'passage-stage-label', 'passage-stage-description',
    'passage-reader-stage', 'passage-progress', 'passage-status', 'passage-instrument-label', 'passage-worlds']) add(id, 'div', reader);
  add('passage-flat-image', 'img', details); add('passage-fallback', 'img', dialog);
  for (const id of ['passage-close', 'passage-index', 'passage-motion']) add(id, 'button', dialog);
  add('passage-source', 'a', details); add('inspect-figure', 'button'); add('entries'); add('world-landmarks');
  for (const theme of ['sea', 'orbital', 'woodland']) {
    const button = new Element('button'); button.dataset.inspectionTheme = theme;
    ids.get('passage-worlds').append(button);
  }
  globalThis.document = document;
  t.after(() => { if (previous === undefined) delete globalThis.document; else globalThis.document = previous; });
  return { document, byId: id => ids.get(id), add, button: () => new Element('button') };
}

function record() {
  return {
    id: 'signal-studio', collection: 'work', kind: 'project', published: true,
    title: 'Signal studio', summary: 'A source-grounded visual project.', body: 'The actual project description.', tags: [],
    links: [{ label: 'Source', url: 'https://example.com/signal' }],
    figure: {
      src: './figures/source.svg', alt: 'Project overview', caption: 'Caption supplied by the author.',
      stages: [
        { id: 'context', label: 'Context', src: './figures/context.svg', description: 'View the supplied context.' },
        { id: 'detail', label: 'Detail', src: './figures/detail.svg', description: 'Read the supplied detail.' },
        { id: 'result', label: 'Result', src: './figures/result.svg', description: 'Inspect the supplied result.' },
      ],
    },
  };
}

function fixture(t, motion = {}) {
  const ui = dom(t);
  const calls = { inspection: [], stage: [], theme: [], select: [], read: [] };
  const state = { paused: false, reduced: false, ready: true, theme: 'sea', ...motion };
  const world = {
    setInspection: value => calls.inspection.push(value),
    setInspectionStage: value => calls.stage.push(value),
  };
  const reader = createFigureReader({
    world, motionState: () => state, sceneState: () => state,
    onTheme: theme => { state.theme = theme; calls.theme.push(theme); },
    onSelect: collection => calls.select.push(collection), onReadIndex: collection => calls.read.push(collection),
    onMotion: () => { state.paused = !state.paused; },
  });
  const entry = ui.button(); entry.dataset.entry = 'signal-studio'; ui.byId('entries').append(entry);
  const view = index => ui.byId('passage-stages').querySelector(`[data-stage="${index}"]`);
  const setting = theme => ui.byId('passage-worlds').querySelector(`[data-inspection-theme="${theme}"]`);
  return { ...ui, calls, state, reader, entry, view, setting };
}

const flushedClose = () => new Promise(resolve => queueMicrotask(resolve));

test('immediate flat reading and full-size links follow the selected supplied view', t => {
  const f = fixture(t);
  f.reader.open(record(), f.entry);
  assert.equal(f.byId('passage-source').href, 'https://portfolio.test/demo/figures/context.svg');
  assert.equal(f.byId('passage-flat-image').src, f.byId('passage-source').href);
  assert.equal(f.byId('passage-body').textContent, record().body, 'reading does not await image loading or animation');
  f.view(2).click();
  assert.equal(f.byId('passage-source').href, 'https://portfolio.test/demo/figures/result.svg');
  assert.equal(f.byId('passage-flat-image').src, f.byId('passage-fallback').src);
  assert.match(f.byId('passage-flat-image').alt, /Result$/);
  const revised = record();
  revised.figure.stages[2].src = './figures/revised-result.svg';
  f.reader.refresh([revised]);
  assert.equal(f.byId('passage-source').href, 'https://portfolio.test/demo/figures/revised-result.svg');
  assert.equal(f.byId('passage-flat-image').src, f.byId('passage-source').href);
});

test('left and right work from initial reading focus without intercepting editing or ordinary Home/End', t => {
  const f = fixture(t);
  f.reader.open(record(), f.entry);
  assert.equal(f.document.activeElement, f.byId('passage-title'));
  const dialog = f.byId('figure-passage');
  const move = dialog.dispatch('keydown', { target: f.document.activeElement, key: 'ArrowRight' });
  assert.equal(move.defaultPrevented, true);
  assert.equal(f.view(1).getAttribute('aria-pressed'), 'true');
  assert.equal(f.document.activeElement, f.view(1));
  for (const tag of ['input', 'textarea', 'select']) {
    const editable = f.document.createElement(tag);
    const untouched = dialog.dispatch('keydown', { target: editable, key: 'ArrowRight' });
    assert.equal(untouched.defaultPrevented, false);
    assert.equal(f.view(1).getAttribute('aria-pressed'), 'true');
  }
  assert.equal(dialog.dispatch('keydown', { target: f.byId('passage-body'), key: 'End' }).defaultPrevented, false);
  assert.equal(dialog.dispatch('keydown', { target: f.view(1), key: 'ArrowRight', ctrlKey: true }).defaultPrevented, false);
  dialog.dispatch('keydown', { target: f.view(1), key: 'End' });
  assert.equal(f.view(2).getAttribute('aria-pressed'), 'true');
  dialog.dispatch('keydown', { target: f.view(2), key: 'Home' });
  assert.equal(f.view(0).getAttribute('aria-pressed'), 'true');
  dialog.dispatch('keydown', { target: f.byId('passage-title'), key: 'ArrowLeft' });
  assert.equal(f.view(2).getAttribute('aria-pressed'), 'true', 'left wraps from the first to last supplied view');
});

test('setting clicks retain the selected project, source view and visited progress', t => {
  const f = fixture(t);
  assert.equal(f.reader.open(record(), f.entry), true);
  f.view(1).click();
  const source = f.byId('passage-fallback').src;
  const callsBefore = structuredClone(f.calls);
  for (const theme of ['orbital', 'woodland', 'sea']) {
    f.setting(theme).click();
    assert.equal(f.byId('passage-title').textContent, 'Signal studio');
    assert.equal(f.byId('passage-fallback').src, source);
    assert.equal(f.view(1).getAttribute('aria-pressed'), 'true');
    assert.equal(f.view(0).classList.contains('is-visited'), true);
    assert.equal(f.setting(theme).getAttribute('aria-pressed'), 'true');
    assert.equal(f.byId('figure-passage').open, true);
    assert.equal(f.reader.active, true);
  }
  assert.deepEqual(f.calls.theme, ['orbital', 'woodland', 'sea']);
  assert.deepEqual(f.calls.inspection, callsBefore.inspection, 'the controller does not reopen or reset the entry');
  assert.deepEqual(f.calls.stage, callsBefore.stage, 'switching shells retains the selected view');
  assert.match(f.byId('passage-status').textContent, /Same entry, view 2 of 3/);
});

test('reduced motion and unavailable WebGL keep the native entry and keyboard source views usable', t => {
  const f = fixture(t, { reduced: true });
  f.reader.open(record(), f.entry);
  assert.equal(f.byId('figure-passage').dataset.motion, 'static');
  assert.equal(f.byId('passage-motion').disabled, true);
  assert.equal(f.byId('passage-body').textContent, record().body);
  assert.equal(f.byId('passage-flat-image').src, 'https://portfolio.test/demo/figures/context.svg');
  f.state.reduced = false; f.state.paused = true; f.reader.syncMotion();
  assert.equal(f.byId('figure-passage').dataset.motion, 'static');
  assert.equal(f.byId('passage-motion').disabled, false);
  assert.equal(f.byId('passage-motion').textContent, 'Resume motion');
  f.byId('passage-motion').click();
  assert.equal(f.byId('figure-passage').dataset.motion, 'moving');
  assert.equal(f.byId('passage-body').textContent, record().body, 'resume changes motion without replacing the native entry');
  const event = f.byId('figure-passage').dispatch('keydown', { target: f.view(0), key: 'ArrowLeft' });
  assert.equal(event.defaultPrevented, true);
  assert.equal(f.document.activeElement, f.view(2), 'arrow navigation moves keyboard focus with the source view');
  assert.equal(f.calls.stage.at(-1).stage, 2);
  f.reader.onSceneImage({ stage: 2, ready: true });
  assert.equal(f.byId('passage-fallback').hidden, true);
  f.reader.onSceneState({ phase: 'unavailable' });
  assert.equal(f.byId('passage-fallback').hidden, false);
  assert.equal(f.byId('passage-motion').hidden, true);
  assert.equal(f.reader.active, true);
  assert.equal(f.byId('figure-passage').open, true);
  f.view(1).click();
  assert.match(f.byId('passage-reader-stage').textContent, /^Detail:/);
  assert.equal(f.byId('passage-fallback').src, 'https://portfolio.test/demo/figures/detail.svg');
  assert.equal(f.byId('passage-caption').textContent, record().figure.caption);
});

test('return waits for the scene restoration, then closes and restores focus to the invoker', async t => {
  const f = fixture(t);
  f.entry.focus(); f.reader.open(record(), f.entry);
  assert.equal(f.document.activeElement, f.byId('passage-title'));
  f.byId('passage-close').click(); await flushedClose();
  assert.equal(f.byId('figure-passage').open, false);
  assert.equal(f.reader.active, true, 'keep return state until the scene finishes restoration');
  assert.deepEqual(f.calls.inspection.at(-1), { active: false });
  assert.equal(f.setting('orbital').disabled, true);
  f.setting('orbital').dispatch('click');
  assert.deepEqual(f.calls.theme, [], 'ignore setting input during return');
  f.reader.onSceneState({ phase: 'closed' });
  assert.equal(f.reader.active, false);
  assert.equal(f.document.body.dataset.inspection, 'false');
  assert.equal(f.document.activeElement, f.entry);
  assert.deepEqual(f.entry.focusOptions, { preventScroll: true });
});

test('a landmark recreated by a setting switch receives return focus by its stable destination', async t => {
  const f = fixture(t);
  const original = f.button(); original.className = 'world-label'; original.dataset.destination = 'work';
  f.byId('world-landmarks').append(original);
  f.reader.open(record(), original); f.setting('orbital').click();
  const replacement = f.button(); replacement.className = 'world-label'; replacement.dataset.destination = 'work';
  f.byId('world-landmarks').replaceChildren(replacement);
  assert.equal(original.isConnected, false);
  f.reader.close(); await flushedClose(); f.reader.onSceneState({ phase: 'closed' });
  assert.equal(f.document.activeElement, replacement, 'resolve the new landmark by semantic destination');
});

test('content refresh retains a stage by ID through reordering, updates facts, and restores stage focus', t => {
  const f = fixture(t);
  const current = record(); f.reader.open(current, f.entry); f.view(1).click(); f.view(1).focus();
  const next = structuredClone(current);
  const previousButton = f.view(1);
  next.title = 'Revised signal studio'; next.body = 'A newly supplied project description.';
  next.figure.stages = [
    { ...next.figure.stages[1], label: 'Revised detail', src: './figures/revised-detail.svg' },
    next.figure.stages[2], next.figure.stages[0],
  ];
  f.reader.refresh([structuredClone(next)]);
  assert.equal(f.byId('passage-title').textContent, next.title);
  assert.equal(f.byId('passage-body').textContent, next.body);
  assert.equal(f.view(0).getAttribute('aria-pressed'), 'true');
  assert.equal(f.byId('passage-stage-label').textContent, 'Revised detail');
  assert.deepEqual(f.calls.stage.at(-1), { imageUrl: 'https://portfolio.test/demo/figures/revised-detail.svg', stage: 0 });
  assert.equal(previousButton.isConnected, false);
  assert.equal(f.document.activeElement, f.view(0));
  assert.equal(f.view(0).classList.contains('is-visited'), true);
});

test('refresh falls back to a valid supplied stage when the old stage is removed and closes unpublished content', async t => {
  const f = fixture(t, { ready: false });
  const current = record(); f.reader.open(current, f.entry); f.view(1).click();
  const next = structuredClone(current);
  next.figure.stages = [next.figure.stages[0], next.figure.stages[2]];
  f.reader.refresh([next]);
  assert.equal(f.byId('passage-stage-number').textContent, '01 / 02');
  assert.equal(f.calls.stage.at(-1).imageUrl, 'https://portfolio.test/demo/figures/context.svg');
  assert.equal(f.view(0).getAttribute('aria-pressed'), 'true');
  f.reader.refresh([{ ...next, published: false }]); await flushedClose();
  assert.equal(f.reader.active, false, 'an unpublished active record leaves the reading controller');
  assert.equal(f.byId('figure-passage').open, false);
  assert.equal(f.document.activeElement, f.entry, 'unavailable graphics must not strand return focus');
  assert.deepEqual(f.calls.inspection.at(-1), { active: false });
  assert.equal(f.reader.open({ ...next, published: false }, f.entry), false);
});

test('moving an active entry to another collection returns before opening its ordinary index', async t => {
  const f = fixture(t);
  const current = record(); f.reader.open(current, f.entry); f.view(1).click();
  f.reader.refresh([{ ...structuredClone(current), collection: 'research' }]);
  await flushedClose();
  assert.equal(f.byId('figure-passage').open, false);
  assert.deepEqual(f.calls.inspection.at(-1), { active: false });
  assert.deepEqual(f.calls.read, [], 'the index callback waits until the old world pose has returned');
  f.reader.onSceneState({ phase: 'closed' });
  assert.equal(f.reader.active, false);
  assert.deepEqual(f.calls.read, ['research'], 'use the new collection after return, not the old anchor');
  f.reader.onSceneState({ phase: 'closed' });
  assert.deepEqual(f.calls.read, ['research'], 'notify the ordinary index only once');
});
