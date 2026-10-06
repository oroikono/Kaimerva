import test from 'node:test';
import assert from 'node:assert/strict';
import { cycleDirection, cyclicDestination, targetPhase } from '../src/navigation.js';

const order = Object.freeze(['work', 'research', 'journal', 'journey', 'news']);

test('both arrow pairs visit only adjacent nodes and wrap in either direction', () => {
  for (const key of ['ArrowRight', 'ArrowDown']) {
    let id = 'work';
    const visited = [];
    for (let i = 0; i < 5; i++) { id = cyclicDestination(order, id, key); visited.push(id); }
    assert.deepEqual(visited, ['research', 'journal', 'journey', 'news', 'work']);
  }
  for (const key of ['ArrowLeft', 'ArrowUp']) {
    let id = 'work';
    const visited = [];
    for (let i = 0; i < 5; i++) { id = cyclicDestination(order, id, key); visited.push(id); }
    assert.deepEqual(visited, ['news', 'journey', 'journal', 'research', 'work']);
  }
});

test('navigation respects the authored route order, including a partial route', () => {
  const alternate = Object.freeze(['journal', 'news', 'work']);
  assert.equal(cyclicDestination(alternate, 'journal', 'ArrowLeft'), 'work');
  assert.equal(cyclicDestination(alternate, 'work', 'ArrowRight'), 'journal');
  assert.equal(cyclicDestination(order, 'missing', 'ArrowRight'), null);
  assert.equal(cyclicDestination(order, 'work', 'Enter'), null);
  assert.equal(cyclicDestination(['work'], 'work', 'ArrowRight'), null);
  assert.equal(cycleDirection('Tab'), 0);
});

test('in-flight travel retains the requested direction across the closed-route seam', () => {
  assert.equal(targetPhase(4, 0, 5, 1), 5);
  assert.equal(targetPhase(0, 4, 5, -1), -1);
  assert.equal(targetPhase(4.35, 1, 5, 1), 6);
  assert.equal(targetPhase(4.35, 4, 5, -1), 4);
  assert.equal(targetPhase(-0.7, 3, 5, -1), -2);
  assert.equal(targetPhase(-0.7, 0, 5, 1), 0);
  assert.equal(targetPhase(0.35, 2, 5, 1), 2);
});

test('pointer visits choose the shortest arc while invalid route targets are rejected', () => {
  assert.equal(targetPhase(4.35, 0, 5), 5);
  assert.equal(targetPhase(0.35, 4, 5), -1);
  assert.equal(targetPhase(0.35, 3, 5), -2);
  assert.equal(targetPhase(5, 0, 5), 5);
  assert.equal(targetPhase(NaN, 0, 5), null);
  assert.equal(targetPhase(0, 5, 5), null);
  assert.equal(targetPhase(0, 1, 0), null);
});
