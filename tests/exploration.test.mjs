import test from 'node:test';
import assert from 'node:assert/strict';
import { createExploration } from '../src/exploration.js';

const order = ['work', 'research', 'journal', 'journey', 'news'];
const worldDistances = (id, distance = 0) => Object.fromEntries(order.map(destination => [destination, destination === id ? distance : 20]));

test('an unobserved or empty session cannot award a place or report a false completion', () => {
  const session = createExploration({ order });
  assert.equal(session.snapshot().phase, null); assert.equal(session.snapshot().nearId, null);
  assert.equal(session.snapshot().distance, null);
  assert.deepEqual(session.interact(), { id: null, newDiscovery: false, complete: false });
  for (const options of [{}, { order: [] }]) {
    const empty = createExploration(options);
    assert.equal(empty.update({ phase: -120 }).total, 0);
    assert.equal(empty.snapshot().nearId, null); assert.equal(empty.snapshot().distance, null);
    assert.deepEqual(empty.interact(), { id: null, newDiscovery: false, complete: false });
    assert.equal(empty.restore(JSON.parse(JSON.stringify(empty.snapshot()))).complete, false);
  }
  const single = createExploration({ order: ['home'] });
  assert.equal(single.update({ phase: 7.1 }).nearId, 'home');
  assert.deepEqual(single.interact(), { id: 'home', newDiscovery: true, complete: true });
});

test('passing, selecting or reading remotely never charts a destination; nearby deliberate interaction charts once', () => {
  const session = createExploration({ order });
  for (let index = 0; index < 100; index++) session.update({ phase: index / 20, moving: true });
  assert.deepEqual(session.snapshot().discovered, []);
  assert.equal(session.snapshot().revision, 0);
  // Content selection is irrelevant to this physical traveler sample.
  assert.equal(session.update({ phase: 2.65, selectedId: 'work' }).nearId, null);
  assert.deepEqual(session.interact(), { id: null, newDiscovery: false, complete: false });
  const near = session.update({ phase: 2.99, moving: true, selectedId: 'work' });
  assert.equal(near.nearId, 'journey'); assert.equal(near.moving, true);
  assert.deepEqual(session.interact(), { id: 'journey', newDiscovery: true, complete: false });
  assert.deepEqual(session.interact(), { id: 'journey', newDiscovery: false, complete: false });
  assert.deepEqual(session.snapshot().discovered, ['journey']); assert.equal(session.snapshot().revision, 1);
  session.update({ phase: 3.4 });
  assert.equal(session.interact().newDiscovery, false); assert.equal(session.snapshot().count, 1);
});

test('phase-only proximity wraps across the seam, supports reverse travel and includes stable range boundaries', () => {
  const session = createExploration({ order });
  for (const phase of [-0.27, 0.27, 4.73, 5.27, -5.27, 10.27]) {
    const sample = session.update({ phase });
    assert.equal(sample.nearId, 'work', `phase ${phase}`);
    assert.ok(Math.abs(sample.distance - 0.27) < 1e-12); assert.equal(sample.metric, 'phase');
  }
  for (const phase of [0.28, 5.28, -0.28, -5.28]) assert.equal(session.update({ phase }).nearId, 'work');
  for (const phase of [0.281, -0.281, 0.5, 4.5]) assert.equal(session.update({ phase }).nearId, null);
  assert.equal(session.update({ phase: -1.01 }).nearId, 'news');
  assert.equal(session.update({ phase: -2.01 }).nearId, 'journey');
  assert.deepEqual(session.snapshot().discovered, [], 'reverse traversal also needs an interaction');
  const exact = createExploration({ order, radius: 0 });
  assert.equal(exact.update({ phase: 5 }).nearId, 'work'); assert.equal(exact.update({ phase: 0.001 }).nearId, null);
});

test('actual approach distances override phase proximity and are never replaced by content selection', () => {
  const session = createExploration({ order });
  assert.equal(session.update({ phase: 0, distances: worldDistances(null), selectedId: 'work' }).nearId, null);
  assert.deepEqual(session.interact(), { id: null, newDiscovery: false, complete: false });
  const near = session.update({ phase: 0, distances: worldDistances('research', 0.3), selectedId: 'work' });
  assert.equal(near.nearId, 'research'); assert.equal(near.metric, 'world'); assert.equal(near.distance, 0.3);
  assert.deepEqual(session.interact(), { id: 'research', newDiscovery: true, complete: false });
  assert.equal(session.update({ phase: 0, distances: worldDistances('journal', 1.4) }).nearId, 'journal');
  assert.equal(session.update({ phase: 0, distances: worldDistances('journal', 1.401) }).nearId, null);
  const tied = worldDistances(null); tied.work = 0.5; tied.news = 0.5;
  assert.equal(session.update({ phase: 4, distances: tied }).nearId, 'work', 'physical ties use stable route order');
  const phaseOnly = session.update({ phase: 3 });
  assert.equal(phaseOnly.metric, 'phase'); assert.equal(phaseOnly.distances, null); assert.equal(phaseOnly.nearId, 'journey');
});

test('a stretched real route can be outside the physical approach range while still within its phase window', () => {
  const session = createExploration({ order });
  const point = phase => [Math.cos(phase / order.length * Math.PI * 2) * 10, Math.sin(phase / order.length * Math.PI * 2) * 10];
  const phase = 0.2; const traveler = point(phase);
  const distances = Object.fromEntries(order.map((id, index) => {
    const anchor = point(index);
    return [id, Math.hypot(traveler[0] - anchor[0], traveler[1] - anchor[1])];
  }));
  assert.equal(session.update({ phase }).nearId, 'work', 'phase-only hosts use their declared fallback range');
  const physical = session.update({ phase, distances });
  assert.ok(physical.distance > 1.4); assert.equal(physical.nearId, null);
  assert.equal(session.interact().newDiscovery, false, 'an actual traveler distance is the authority when supplied');
});

test('discovery sequence survives reader/theme samples and snapshot restoration, with completion only after every place', () => {
  const session = createExploration({ order });
  for (const id of ['journey', 'work', 'news']) {
    session.update({ phase: order.indexOf(id), distances: worldDistances(id), moving: false });
    assert.equal(session.interact().newDiscovery, true);
  }
  const beforeReader = JSON.parse(JSON.stringify(session.snapshot()));
  const resumed = createExploration({ order }); assert.deepEqual(resumed.restore(beforeReader), beforeReader);
  // A different setting supplies fresh approach distances; progress is still
  // keyed to shared content roles, not scene objects or the open reader.
  resumed.update({ phase: 1, distances: worldDistances('research', 0.1) });
  assert.deepEqual(resumed.snapshot().discovered, ['journey', 'work', 'news']);
  assert.equal(resumed.interact().complete, false);
  resumed.update({ phase: 2, distances: worldDistances('journal', 0.1) });
  assert.deepEqual(resumed.interact(), { id: 'journal', newDiscovery: true, complete: true });
  assert.deepEqual(resumed.snapshot().discovered, ['journey', 'work', 'news', 'research', 'journal']);
  assert.equal(resumed.snapshot().count, 5); assert.equal(resumed.snapshot().revision, 5);
  resumed.update({ phase: 2.5, distances: worldDistances(null) });
  assert.deepEqual(resumed.interact(), { id: null, newDiscovery: false, complete: true });
  const fresh = resumed.reset();
  assert.equal(fresh.phase, null); assert.equal(fresh.count, 0); assert.equal(fresh.revision, 0); assert.equal(fresh.complete, false);
  assert.deepEqual(session.snapshot(), beforeReader, 'restored sessions do not share arrays or maps');
});

test('input/output mutation cannot change the session and invalid traveler samples are atomic', () => {
  const mutableOrder = order.slice(); const session = createExploration({ order: mutableOrder });
  mutableOrder[0] = 'changed';
  const supplied = worldDistances('work', 0.2); session.update({ phase: 0, distances: supplied }); supplied.work = 99;
  session.interact();
  const output = session.snapshot(); output.order[0] = 'changed'; output.discovered.length = 0; output.distances.work = 99;
  const before = session.snapshot();
  assert.equal(before.nearId, 'work'); assert.equal(before.distances.work, 0.2); assert.deepEqual(before.discovered, ['work']);
  for (const bad of [null, [], {}, { phase: '1' }, { phase: Infinity }, { phase: NaN }, { phase: 0, moving: 1 },
    { phase: 0, distances: [] }, { phase: 0, distances: {} }, { phase: 0, distances: { ...supplied, unknown: 0 } },
    { phase: 0, distances: { ...supplied, news: -1 } }, { phase: 0, distances: { ...supplied, news: Infinity } },
    { phase: 0, distances: { ...supplied, news: '0' } }, { phase: 0, distances: Object.create(supplied) }]) {
    assert.throws(() => session.update(bad)); assert.deepEqual(session.snapshot(), before);
  }
});

test('malformed or mismatched saved state cannot partially replace valid chart progress', () => {
  const session = createExploration({ order }); session.update({ phase: 0, distances: worldDistances('work') }); session.interact();
  const before = session.snapshot();
  const candidates = [null, [], {}, { ...before, schemaVersion: 2 }, { ...before, radius: 0.3 },
    { ...before, distanceRadius: 2 }, { ...before, order: [...order].reverse() }, { ...before, phase: Infinity },
    { ...before, phase: null }, { ...before, moving: 'no' }, { ...before, discovered: ['unknown'] },
    { ...before, discovered: ['work', 'work'] }, { ...before, count: 2 }, { ...before, revision: 2 },
    { ...before, total: 9 }, { ...before, complete: true }, { ...before, nearId: 'news' },
    { ...before, distance: 99 }, { ...before, metric: 'phase' }, { ...before, distances: { ...before.distances, work: 99 } }];
  for (const bad of candidates) {
    assert.throws(() => session.restore(bad)); assert.deepEqual(session.snapshot(), before);
  }
  const saved = JSON.parse(JSON.stringify(before)); session.reset(); assert.deepEqual(session.restore(saved), before);
  saved.distances.work = 99; saved.discovered.length = 0;
  assert.deepEqual(session.snapshot(), before);
});

test('configuration rejects ambiguous phase ranges and malformed destination orders', () => {
  for (const value of [null, 'work', [null], [''], [' work'], ['work', 'work'], new Array(257).fill('work')]) {
    assert.throws(() => createExploration({ order: value }));
  }
  for (const radius of [-0.01, 0.5, 1, NaN, Infinity, '0.2']) assert.throws(() => createExploration({ order, radius }));
  for (const distanceRadius of [-1, NaN, Infinity, '1']) assert.throws(() => createExploration({ order, distanceRadius }));
});
