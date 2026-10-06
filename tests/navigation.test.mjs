import test from 'node:test';
import assert from 'node:assert/strict';
import { directionalDestination } from '../src/navigation.js';

const map = [
  { id: 'center', x: 150, y: 150 },
  { id: 'west', x: 30, y: 150 },
  { id: 'east', x: 270, y: 150 },
  { id: 'north', x: 150, y: 30 },
  { id: 'south', x: 150, y: 270 },
];

test('arrows follow map geometry rather than content or array order', () => {
  const reversed = [...map].reverse();
  for (const points of [map, reversed]) {
    assert.equal(directionalDestination(points, 'center', 'ArrowLeft'), 'west');
    assert.equal(directionalDestination(points, 'center', 'ArrowRight'), 'east');
    assert.equal(directionalDestination(points, 'center', 'ArrowUp'), 'north');
    assert.equal(directionalDestination(points, 'center', 'ArrowDown'), 'south');
  }
});

test('map edges do not wrap across the scene', () => {
  assert.equal(directionalDestination(map, 'west', 'ArrowLeft'), null);
  assert.equal(directionalDestination(map, 'north', 'ArrowUp'), null);
  assert.equal(directionalDestination(map, 'missing', 'ArrowRight'), null);
  assert.equal(directionalDestination(map, 'center', 'Enter'), null);
});

test('an aligned target wins over a near-perpendicular one; diagonals remain reachable', () => {
  const points = [{ id:'start', x:0, y:0 }, { id:'diagonal', x:2, y:30 }, { id:'right', x:70, y:0 }];
  assert.equal(directionalDestination(points, 'start', 'ArrowRight'), 'right');
  assert.equal(directionalDestination(points.slice(0, 2), 'start', 'ArrowDown'), 'diagonal');
});

test('hidden and invalid destinations are excluded, with stable ties and no input mutation', () => {
  const points = [{ id:'start', x:0, y:0 }, { id:'hidden', x:2, y:0, visible:false }, { id:'invalid', x:NaN, y:0 }, { id:'b', x:70, y:10 }, { id:'a', x:70, y:-10 }];
  const before = structuredClone(points);
  assert.equal(directionalDestination(points, 'start', 'ArrowRight'), 'a');
  assert.equal(directionalDestination([...points].reverse(), 'start', 'ArrowRight'), 'a');
  assert.deepEqual(points, before);
});
