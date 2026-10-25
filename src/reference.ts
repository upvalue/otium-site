// The function reference, read from the otium submodule's docs/reference.json.
// tools/export-reference.ot in the otium repo writes that file.
import { execFileSync } from 'node:child_process';
import reference from '../otium/docs/reference.json';

export type Arg = {
  name?: string;
  group?: Arg[];
  optional?: boolean;
  repeat?: boolean;
  default?: string;
};

export type Signature = { text: string; args?: Arg[] };

export type Entry = {
  name: string;
  kind: 'function' | 'macro' | 'special' | 'value';
  doc: string;
  runtimes: string[];
  signatures?: Signature[];
  source?: { file: string; line: number };
};

export type Namespace = { name: string; entries: Entry[] };

const OTIUM = 'otium';

export const namespaces = reference.namespaces as Namespace[];

const commit = (() => {
  try {
    return execFileSync('git', ['-C', OTIUM, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  } catch {
    return 'main';
  }
})();

export function sourceUrl(entry: Entry) {
  if (!entry.source) return undefined;
  return `https://github.com/upvalue/otium/blob/${commit}/${entry.source.file}#L${entry.source.line}`;
}

export function namespaceHref(ns: string) {
  return `/reference/${ns}/`;
}

export function entryHref(ns: string, name: string) {
  return `${namespaceHref(ns)}#${encodeURIComponent(name)}`;
}

// The first sentence of the doc, for search results and the index.
export function summary(doc: string) {
  const text = doc.replace(/\s+/g, ' ').trim();
  const end = text.search(/\.(\s|$)/);
  return end === -1 ? text : text.slice(0, end + 1);
}

const escape = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Doc text is plain prose with `code` spans. Backticked names that are in the
// namespace link to their entries.
export function renderDoc(doc: string, ns: Namespace) {
  const names = new Set(ns.entries.map((e) => e.name));
  return doc
    .split(/\n\s*\n/)
    .map((para) => {
      const html = escape(para).replace(/`([^`]+)`/g, (_, code: string) => {
        const raw = code.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
        return names.has(raw)
          ? `<a href="#${encodeURIComponent(raw)}"><code>${code}</code></a>`
          : `<code>${code}</code>`;
      });
      return `<p>${html}</p>`;
    })
    .join('');
}

// An optional group such as [start [end]] is written with brackets alone; a
// required group is a pattern such as dotimes's (index count).
function renderArg(arg: Arg): string {
  const inner = arg.group?.map(renderArg).join(' ');
  const body = arg.group
    ? arg.optional ? inner! : `(${inner})`
    : `<span class="sig-param">${escape(arg.name ?? '')}</span>`;
  const repeated = arg.repeat ? `${body}<span class="sig-repeat"> …</span>` : body;
  const defaulted = arg.default ? `${repeated}<span class="sig-default"> = ${escape(arg.default)}</span>` : repeated;
  return arg.optional ? `<span class="sig-optional">[${defaulted}]</span>` : defaulted;
}

export function renderSignature(name: string, sig: Signature) {
  if (!sig.args) return escape(sig.text);
  const args = sig.args.map(renderArg).join(' ');
  return `(<span class="sig-name">${escape(name)}</span>${args ? ' ' + args : ''})`;
}

export const kindLabel: Record<Entry['kind'], string> = {
  function: 'function',
  macro: 'macro',
  special: 'special form',
  value: 'value',
};

export const runtimeLabel: Record<string, string> = { chez: 'Chez', c: 'C' };
