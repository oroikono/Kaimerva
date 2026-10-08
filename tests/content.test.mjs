import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateContent, publishedItems, publicSnapshot, safeLink, safeFigureSource } from '../src/content.js';
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

const figure = fixture.items.find(item => item.figure).figure;
test('optional figure metadata stays backward compatible and owns nested stage records', () => {
  const plain = structuredClone(fixture.items[1]); delete plain.figure;
  assert.equal(validateContent({ ...fixture, items:[plain] }).items[0].figure, undefined);
  const input = { ...fixture, items:[{ ...plain, figure:structuredClone(figure) }] };
  const output = validateContent(input);
  output.items[0].figure.stages[0].description = 'Changed in the consumer';
  output.items[0].figure.stages.push({ id:'extra' });
  assert.notEqual(input.items[0].figure.stages[0].description, 'Changed in the consumer');
  assert.equal(input.items[0].figure.stages.length, 3);
  assert.ok(validateContent({ ...fixture, items:[{ ...plain, figure:{ ...figure, stages:[figure.stages[0]] } }] }));
});
test('figure sources are bounded explicit local filenames, never executable or traversing URLs', () => {
  for (const src of ['./figures/../secret.svg','./figures/%2e%2e/secret.svg','./figures/foo%2fbar.svg','./figures/nested/a.svg','./figures/a.svg?token=secret','./figures/a.svg#fragment','./figures/a.svg\n','./figures/.secret.svg','./figures/a.txt','/figures/a.svg','https://user:secret@example.com/a.svg','javascript:alert(1)','//example.com/a.svg']) assert.equal(safeFigureSource(src), null, src);
  for (const src of ['./figures/a.svg','./figures/source-01.png','./figures/plate_2.jpg','./figures/a.jpeg','./figures/a.webp']) assert.equal(safeFigureSource(src), src);
  assert.throws(() => validateContent({ ...fixture, items:[{ ...fixture.items[1], figure:{ ...figure, src:'./figures/../secret.svg' } }] }), /safe local/);
});
test('malformed figure stages reject the incoming snapshot before it can replace valid content', () => {
  const stable = validateContent(fixture); const before = JSON.stringify(stable);
  const malformed = [null, { ...figure, stages:[] }, { ...figure, stages:[...figure.stages, figure.stages[0]] }, { ...figure, stages:[figure.stages[0],figure.stages[0]] }, { ...figure, alt:'' }, { ...figure, caption:'x'.repeat(2001) }, { ...figure, privateNote:'not public' }, { ...figure, stages:[{ ...figure.stages[0], src:'data:image/svg+xml,hi' }] }, { ...figure, stages:[{ ...figure.stages[0], description:'' }] }, { ...figure, stages:[{ ...figure.stages[0], unknown:'hidden' }] }];
  for (const invalid of malformed) assert.throws(() => validateContent({ ...fixture, items:[fixture.items[0], { ...fixture.items[1], figure:invalid }] }));
  assert.equal(JSON.stringify(stable), before);
});
test('public content omits the entire draft figure record as well as its private captions', () => {
  const input = { ...fixture, items:[fixture.items[0], { ...fixture.items[1], published:false, figure:{ ...figure, src:'./figures/private-draft.svg', caption:'PRIVATE_FIGURE_CAPTION', stages:[{ ...figure.stages[0], src:'./figures/private-stage.svg', description:'PRIVATE_FIGURE_STAGE' }] } }] };
  const published = JSON.stringify(publicSnapshot(validateContent(input)));
  for (const sentinel of ['private-draft.svg','private-stage.svg','PRIVATE_FIGURE_CAPTION','PRIVATE_FIGURE_STAGE']) assert.equal(published.includes(sentinel), false);
});
