// Error codes and lint rules, read from the otium checkout's
// lib/catalog/diagnostics.json, which the runtime and lint also use.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { otiumRoot } from './docs.mjs';

export type Diagnostic = {
  code: string;
  title: string;
  message: string;
  explanation: string;
  example?: string;
  fixed?: string;
  type?: string;
  name?: string;
  group?: string;
  level?: string;
};

const catalog: Record<string, Omit<Diagnostic, 'code'>> = JSON.parse(
  readFileSync(path.join(otiumRoot, 'lib/catalog/diagnostics.json'), 'utf8'),
);

export const diagnostics: Diagnostic[] = Object.entries(catalog)
  .map(([code, entry]) => ({ code, ...entry }))
  .sort((a, b) => a.code.localeCompare(b.code));

// Codes grouped by error type or lint group, in order of first code.
export function grouped(kind: 'E' | 'L') {
  const groups = new Map<string, Diagnostic[]>();
  for (const d of diagnostics.filter((d) => d.code.startsWith(kind))) {
    const key = (kind === 'E' ? d.type : d.group) ?? 'other';
    groups.set(key, [...(groups.get(key) ?? []), d]);
  }
  return [...groups];
}
