import { namespaces } from './reference';

// Sidebar order. Each slug is a file under src/content/docs (without .md), or
// a reference page.
export type NavSection = { title?: string; items: { label: string; slug: string }[] };

export const nav: NavSection[] = [
  {
    items: [
      { label: 'Introduction', slug: 'index' },
      { label: 'Installation', slug: 'installation' },
    ],
  },
  {
    title: 'Language',
    items: [
      { label: 'Overview', slug: 'language/overview' },
      { label: 'Syntax', slug: 'language/syntax' },
      { label: 'Objects', slug: 'language/objects' },
    ],
  },
  {
    title: 'Reference',
    items: namespaces.map((ns) => ({ label: ns.name, slug: `reference/${ns.name}` })),
  },
  {
    title: 'Manse',
    items: [{ label: 'Overview', slug: 'manse/overview' }],
  },
  {
    title: 'OtOS',
    items: [{ label: 'Overview', slug: 'otos/overview' }],
  },
];

export function hrefFor(slug: string) {
  return slug === 'index' ? '/' : `/${slug}/`;
}
