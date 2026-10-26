import { readdirSync, readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const decode = text => text.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');

export function checkLinks(directory) {
  const root = path.resolve(directory);
  const pages = new Map();
  function walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(file);
      else if (entry.name.endsWith('.html')) {
        const html = readFileSync(file, 'utf8');
        pages.set(file, { ids: new Set([...html.matchAll(/\bid="([^"]*)"/g)].map(m => decode(m[1]))), html });
      }
    }
  }
  walk(root);
  const errors = [];
  for (const [file, { html }] of pages) {
    const route = '/' + path.relative(root, file).replace(/index\.html$/, '');
    for (const match of html.matchAll(/<a\b[^>]*\bhref="([^"]*)"/g)) {
      const href = decode(match[1]);
      const url = new URL(href, `https://otium.sh${route}`);
      if (url.origin !== 'https://otium.sh') continue;
      const pathname = decodeURIComponent(url.pathname);
      const target = path.join(root, pathname, pathname.endsWith('/') || !path.extname(pathname) ? 'index.html' : '');
      if (!existsSync(target)) errors.push(`${route}: missing target ${href}`);
      else if (url.hash && pages.has(target) && !pages.get(target).ids.has(decodeURIComponent(url.hash.slice(1)))) errors.push(`${route}: missing anchor ${href}`);
    }
  }
  if (errors.length) throw new Error(errors.join('\n'));
  return pages.size;
}

export default function validateLinks() {
  return {
    name: 'otium-check-links',
    hooks: { 'astro:build:done': ({ dir }) => { checkLinks(fileURLToPath(dir)); } },
  };
}
