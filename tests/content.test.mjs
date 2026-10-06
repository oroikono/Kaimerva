import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateContent, publishedItems, publicSnapshot, safeLink } from '../src/content.js';
const fixture = JSON.parse(await readFile(new URL('../data/site.json', import.meta.url), 'utf8'));

test('a successful empty collection stays empty', () => {
  const result = validateContent({ ...fixture, items: [] });
  assert.deepEqual(publishedItems(result, 'research'), []);
});
test('publication requires an explicit true flag', () => {
  const result = validateContent({ ...fixture, items: fixture.items.map((item, index) => ({ ...item, published:index === 0 ? true : index === 1 ? undefined : false })) });
  assert.equal(result.items.filter(item => item.published).length, 1);
});
test('the public payload omits draft bodies, rather than only hiding them in the UI', () => {
  const input = { ...fixture, items: [fixture.items[0], { ...fixture.items[1], published:false, body:'PRIVATE DRAFT SENTINEL' }, { ...fixture.items[2], published:undefined, body:'MISSING FLAG SENTINEL' }] };
  const snapshot = validateContent(input);
  const serialized = JSON.stringify(publicSnapshot(snapshot));
  assert.equal(publicSnapshot(snapshot).items.length, 1);
  assert.equal(serialized.includes('PRIVATE DRAFT SENTINEL'), false);
  assert.equal(serialized.includes('MISSING FLAG SENTINEL'), false);
  assert.equal(snapshot.items.length, 3);
});
test('duplicate IDs and malformed data reject the whole incoming snapshot', () => {
  assert.throws(() => validateContent({ ...fixture, items: [fixture.items[0], fixture.items[0]] }), /duplicate/);
  assert.throws(() => validateContent({ ...fixture, items: [{ ...fixture.items[0], published:'yes' }] }), /boolean/);
  assert.throws(() => validateContent({ ...fixture, items: [{ ...fixture.items[0], collection:'secret' }] }), /unknown/);
});
test('unsafe content links cannot become executable DOM URLs', () => {
  for (const url of ['javascript:alert(1)', 'data:text/html,hi', 'file:///tmp/a', '//example.com']) assert.equal(safeLink(url), null);
  assert.equal(safeLink('https://example.com/work'), 'https://example.com/work');
  assert.throws(() => validateContent({ ...fixture, items:[{ ...fixture.items[0], links:[{ label:'Click', url:'javascript:alert(1)' }] }] }), /unsafe/);
});
test('date validation rejects calendar rollover and returned data owns its arrays', () => {
  assert.throws(() => validateContent({ ...fixture, items:[{ ...fixture.items[0], date:'2026-02-30' }] }), /real/);
  const result = validateContent(fixture);
  result.items[0].tags.push('Changed');
  assert.equal(fixture.items[0].tags.includes('Changed'), false);
});
