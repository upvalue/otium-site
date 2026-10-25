import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { createHighlighter } from 'shiki';
import otium from './otium.mjs';

const highlighter = await createHighlighter({ themes: ['tokyo-night'], langs: [otium] });
after(() => highlighter.dispose());

function tokens(source) {
  return highlighter.codeToTokens(source, {
    lang: 'otium', theme: 'tokyo-night', includeExplanation: true,
  }).tokens.flatMap((line) => line.flatMap((token) => token.explanation.map((part) => ({
    text: part.content,
    scope: part.scopes.at(-1).scopeName,
  }))));
}

function expectScope(source, scope) {
  const parts = tokens(source);
  assert.equal(parts.map((part) => part.text).join(''), source);
  assert.ok(parts.every((part) => part.scope === `${scope}.otium`), JSON.stringify(parts));
}

test('Otium forms and punctuation-bearing built-ins', () => {
  for (const form of ['def', 'def-', 'fn', 'ns', 'require', 'defmacro', 'when', 'defclass', 'match', 'with-params']) {
    expectScope(form, 'keyword.control');
  }
  for (const name of ['map', 'nil?', 'put!', '+', 'string->symbol', 'otium.core/map']) {
    expectScope(name, 'support.function');
  }
});

test('reader literals and parameter markers', () => {
  for (const keyword of [':as', ':foo/bar', ':reload', ':=']) expectScope(keyword, 'constant.other.keyword');
  for (const number of ['0', '-12', '+0xFF', '.5', '1.', '-2.5e-3']) expectScope(number, 'constant.numeric');
  for (const bool of ['#t', '#false']) expectScope(bool, 'constant.language.boolean');
  expectScope('nil', 'constant.language.nil');
  for (const char of ['#\\space', '#\\x41', '#\\)', '#\\;']) expectScope(char, 'constant.character');
  for (const marker of ['&optional', '&', '=>']) expectScope(marker, 'keyword.other');
});

test('symbols are never partially highlighted as keywords or numbers', () => {
  for (const symbol of ['default', 'def-custom', 'foo/map', 'map-more', 'nil-value', 'x123', 'put!!']) {
    expectScope(symbol, 'variable.other');
  }
  assert.equal(tokens('(tools/work x)')[1].scope, 'entity.name.function.otium');
});

test('comments and multiline strings isolate code and preserve escapes', () => {
  expectScope('; (def :as #t 42)', 'comment.line.semicolon');
  const parts = tokens('"def ; :as\nfn \\n \\x41; \\" end"\n(def x nil)');
  assert.equal(parts.find((part) => part.text === 'def ; :as').scope, 'string.quoted.double.otium');
  assert.equal(parts.find((part) => part.text === '\\x41;').scope, 'constant.character.escape.otium');
  assert.equal(parts.find((part) => part.text === 'def').scope, 'keyword.control.otium');
});

test('reader prefixes and collection delimiters', () => {
  for (const prefix of ["'", '`', '#`', ',', ',@']) expectScope(prefix, 'keyword.operator.quote');
  for (const delimiter of ['(', ')', '[', ']', '{', '}', '#u8(']) expectScope(delimiter, 'punctuation.section');
});
