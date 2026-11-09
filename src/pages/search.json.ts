import { getCollection, render } from 'astro:content';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { namespaces, entryHref } from '../reference';
import { titleFor, hrefFor } from '../nav';
import { documentRecords } from '../search/documents.mjs';

export async function GET() {
  const records = namespaces.flatMap(ns => ns.entries.map(entry => ({
    id: entryHref(ns.name, entry.name),
    url: entryHref(ns.name, entry.name),
    type: 'reference',
    title: entry.name,
    name: entry.name,
    namespace: ns.name,
    signature: entry.signatures?.map(sig => sig.text).join(' · ') ?? '',
    text: [entry.doc, ...(entry.fields ?? []).map(field => field.name)].join(' '),
  })));
  const container = await AstroContainer.create();
  for (const doc of await getCollection('docs')) {
    const { Content } = await render(doc);
    const html = await container.renderToString(Content);
    records.push(...documentRecords(html, titleFor(doc), hrefFor(doc.id)));
  }
  return new Response(JSON.stringify(records), { headers: { 'Content-Type': 'application/json' } });
}
