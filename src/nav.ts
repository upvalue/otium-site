import { getCollection } from 'astro:content';
import { namespaces } from './reference';
import { navigation, docId } from './docs.mjs';

export type NavSection = { title?: string; items: { label: string; slug: string }[] };
export const titleFor = (doc: { data: { title?: string }; body?: string; id: string }) =>
  doc.data.title ?? doc.body?.match(/^#\s+(.+)$/m)?.[1] ?? doc.id;

export async function getNav(): Promise<NavSection[]> {
  const docs = new Map((await getCollection('docs')).map(doc => [doc.id, doc]));
  return navigation.map(section => {
    if (section.generated) {
      if (section.generated !== 'reference') throw new Error(`Unknown generated navigation: ${section.generated}`);
      return {
        title: section.title,
        items: [
          ...namespaces.map(ns => ({ label: ns.name, slug: `reference/${ns.name}` })),
          { label: 'Error codes', slug: 'reference/diagnostics' },
        ],
      };
    }
    return {
      title: section.title,
      items: section.items.map(item => {
        const file = typeof item === 'string' ? item : item.file;
        const doc = docs.get(docId(file));
        if (!doc) throw new Error(`docs/nav.json: missing document ${file}`);
        const label = typeof item === 'string' ? titleFor(doc) : item.label ?? titleFor(doc);
        return { label: label.replace(/^\s*✨\uFE0F?\s*/u, ''), slug: doc.id };
      }),
    };
  });
}

export function hrefFor(slug: string) {
  return slug === 'index' ? '/' : `/${slug}/`;
}
