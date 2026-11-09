import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSearch } from '../search/engine.mjs';
import { documentRecords } from '../search/documents.mjs';
import { excerpt } from '../search/excerpt.mjs';

test('reference names preserve operators and outrank prose', () => {
  const records = ['+', '<=', 'array?', 'buffer-push!'].map(name => ({ id: name, title: name, name, type: 'reference', text: 'A binding.' }));
  records.push({ id: 'guide', type: 'docs', title: 'Array guide', text: 'Use array? to check arrays. A buffer holds bytes.' });
  const search = createSearch(records);
  for (const name of ['+', '<=', 'array?', 'buffer-push!']) assert.equal(search(name)[0].name, name);
  assert.equal(search('buffer-p')[0].name, 'buffer-push!');
  assert.deepEqual(search('array', 'docs').map(hit => hit.id), ['guide']);
  assert.equal(search('  ').length, 0);
});

test('full text matches multiple terms and spelling mistakes', () => {
  const search = createSearch([{ id: 'ref', type: 'reference', title: 'decode', name: 'decode', text: 'First sentence. Convert bytes into a string.' }]);
  assert.equal(search('convert string')[0].id, 'ref');
  assert.equal(search('converrt')[0].id, 'ref');
  assert.equal(search('unfindable').length, 0);
});

test('documentation records use rendered anchors and decode entities', () => {
  const records = documentRecords('<p>Introduction.</p><h2 id="repeat-2">Repeated heading</h2><p>Use <code>&lt;=</code> here.</p><nav>Ignore me</nav><h3 id="nested">Nested</h3><pre>example</pre>', 'Guide', '/guide/');
  assert.deepEqual(records.map(row => row.url), ['/guide/', '/guide/#repeat-2', '/guide/#nested']);
  assert.equal(records[1].text, 'Use <= here.');
  assert.equal(records[2].title, 'Guide → Nested');
  assert.ok(!records.some(row => row.text.includes('Ignore me')));
});

test('excerpts show matches deep in a document', () => {
  const text = 'Introduction. '.repeat(40) + 'needle appears here.';
  assert.ok(excerpt(text, 'needle').includes('needle'));
  assert.ok(excerpt(text, 'needle').startsWith('…'));
});

test('syntax highlighting does not split searchable identifiers', () => {
  const records = documentRecords('<pre><span>buffer</span><span>-push!</span></pre><p>Next paragraph.</p>', 'Guide', '/guide/');
  assert.equal(records[0].text, 'buffer-push! Next paragraph.');
});
