import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { resolveLink, docsRoot } from '../docs.mjs';
import { checkLinks } from '../../scripts/check-links.mjs';

test('relative documents, fragments, source files and external links', () => {
  const source = path.join(docsRoot, 'otos/guide.md');
  assert.equal(resolveLink('../guide/loops.md#top', source), '/guide/loops/#top');
  assert.equal(resolveLink('../index.md', source), '/');
  assert.match(resolveLink('../../examples/hand/intro-ui.ot', source), /github.com\/upvalue\/otium\/blob\/[a-f0-9]+\/examples\/hand\/intro-ui.ot$/);
  assert.equal(resolveLink('https://example.com/a.md', source), 'https://example.com/a.md');
  assert.throws(() => resolveLink('../missing.md', source), /missing/);
  assert.throws(() => resolveLink('../../../outside.md', source), /out-of-repository/);
});

test('build validation checks page targets and decoded anchors', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'otium-links-'));
  try {
    mkdirSync(path.join(dir, 'guide'));
    writeFileSync(path.join(dir, 'guide/index.html'), '<h2 id="set!">Set</h2>');
    writeFileSync(path.join(dir, 'index.html'), '<a href="/guide/#set%21">Set</a>');
    assert.equal(checkLinks(dir), 2);
    writeFileSync(path.join(dir, 'index.html'), '<a href="/guide/#missing">Bad</a>');
    assert.throws(() => checkLinks(dir), /missing anchor/);
    writeFileSync(path.join(dir, 'index.html'), '<a href="/missing/">Bad</a>');
    assert.throws(() => checkLinks(dir), /missing target/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
