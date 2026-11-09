import { reference } from '../docs.mjs';

const core = reference.namespaces.find((ns) => ns.name === 'otium.core').entries;
const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Use reader delimiters rather than word boundaries: ?, !, / and - belong to symbols.
const atom = '[^\\s()\\[\\]{};"\',`]';
const whole = (pattern) => `(?<!${atom})(?:${pattern})(?!${atom})`;
const names = (kinds) => core.filter((entry) => kinds.includes(entry.kind)).map((entry) => escape(entry.name)).join('|');

export default {
  name: 'otium',
  displayName: 'Otium',
  scopeName: 'source.otium',
  aliases: ['ot'],
  patterns: [
    { name: 'comment.line.semicolon.otium', match: ';.*$' },
    {
      name: 'string.quoted.double.otium',
      begin: '"',
      end: '"',
      patterns: [
        { name: 'constant.character.escape.otium', match: '\\\\(?:[nrt0e"\\\\]|x[0-9a-fA-F]+;)' },
        { name: 'invalid.illegal.escape.otium', match: '\\\\.' },
      ],
    },
    { name: 'constant.character.otium', match: whole(`#\\\\(?:${atom}+|[\\s()\\[\\]{};"\',\u0060])`) },
    { name: 'keyword.operator.quote.otium', match: "#`|,@|['`,]" },
    { name: 'constant.language.boolean.otium', match: whole('#(?:t|f|true|false)') },
    { name: 'constant.language.nil.otium', match: whole('nil') },
    { name: 'constant.other.keyword.otium', match: whole(`:${atom}+`) },
    { name: 'constant.numeric.otium', match: whole('[+-]?(?:0[xX][0-9a-fA-F]+|(?:[0-9]+(?:\\.[0-9]*)?|\\.[0-9]+)(?:[eE][+-]?[0-9]+)?)') },
    { name: 'keyword.control.otium', match: whole(`(?:otium\\.core/)?(?:${names(['special', 'macro'])})`) },
    { name: 'support.function.otium', match: whole(`(?:otium\\.core/)?(?:${names(['function'])})`) },
    { name: 'support.constant.otium', match: whole(`(?:otium\\.core/)?(?:${names(['value'])})`) },
    { name: 'keyword.other.otium', match: whole('&optional|&|=>|else') },
    { name: 'punctuation.section.otium', match: '#u8\\(|[()\\[\\]{}]' },
    { name: 'entity.name.function.otium', match: `(?<=\\()${atom}+` },
    { name: 'variable.other.otium', match: `${atom}+` },
  ],
};
