import { fileURLToPath } from 'node:url';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

export const otiumRoot = path.resolve(process.env.OTIUM_ROOT || 'otium');
export const docsRoot = path.join(otiumRoot, 'docs');
export const docId = (file) => file.replace(/\.md$/, '');
export const docHref = (file) => file === 'index.md' ? '/' : `/${docId(file)}/`;
export const redirects = {
};
export const reference = JSON.parse(readFileSync(path.join(docsRoot, 'reference.json'), 'utf8'));
export const navigation = JSON.parse(readFileSync(path.join(docsRoot, 'nav.json'), 'utf8'));
export const commit = execFileSync('git', ['-C', otiumRoot, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();

export function resolveLink(url, source, image = false) {
  if (/^(?:[a-z][a-z\d+.-]*:|\/\/|\/|#)/i.test(url)) return url;
  const [, pathname, suffix = ''] = url.match(/^([^?#]*)(.*)$/);
  if (!pathname) return url;
  const target = path.resolve(path.dirname(source), decodeURIComponent(pathname));
  const relative = path.relative(otiumRoot, target);
  if (relative.startsWith('../') || path.isAbsolute(relative) || !existsSync(target)) {
    throw new Error(`${source}: missing or out-of-repository link ${url}`);
  }
  const doc = path.relative(docsRoot, target);
  if (!image && !doc.startsWith('../') && doc.endsWith('.md')) return docHref(doc) + suffix;
  const encoded = relative.split(path.sep).map(encodeURIComponent).join('/');
  return image
    ? `https://raw.githubusercontent.com/upvalue/otium/${commit}/${encoded}${suffix}`
    : `https://github.com/upvalue/otium/blob/${commit}/${encoded}${suffix}`;
}

export const documentLinks = {
  name: 'otium-document-links',
  link: rewrite,
  definition: rewrite,
  image: rewrite,
};

function rewrite(node, ctx) {
  ctx.setProperty(node, 'url', resolveLink(node.url, fileURLToPath(ctx.fileURL), node.type === 'image'));
}

export function documentTitle({ source, data }) {
  let removeTitle = !data.astro.frontmatter.title && /^#\s/.test(source.trimStart());
  return {
    name: 'otium-document-title',
    heading(node, ctx) {
      if (removeTitle && node.depth === 1) {
        removeTitle = false;
        ctx.removeNode(node);
      }
    },
  };
}

// Guide pages that link to the API reference, so reference pages can link
// back. Maps "ns" (links to the namespace page) and "ns#name" to
// [{ href, title }] in sidebar order.
export function guideLinks() {
  const files = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(file);
      else if (entry.name.endsWith('.md') && entry.name !== 'ui-revisions.md') files.push(path.relative(docsRoot, file));
    }
  };
  walk(docsRoot);
  const order = navigation.flatMap((section) => (section.items ?? []).map((item) => item.file ?? item));
  files.sort((a, b) => (order.indexOf(a) + 1 || Infinity) - (order.indexOf(b) + 1 || Infinity));
  const links = new Map();
  const add = (key, page) => {
    const pages = links.get(key) ?? [];
    if (!pages.some((p) => p.href === page.href)) pages.push(page);
    links.set(key, pages);
  };
  for (const file of files) {
    const source = readFileSync(path.join(docsRoot, file), 'utf8');
    const title = source.match(/^title:\s*"?(.+?)"?\s*$/m)?.[1]
      ?? source.match(/^#\s+(?:✨\s*)?(.+)$/m)?.[1]
      ?? docId(file);
    const page = { href: docHref(file), title };
    for (const [, ns, anchor] of source.matchAll(/\]\(\/reference\/([^/)#\s]+)\/(?:#([^)\s]+))?\)/g)) {
      add(anchor ? `${ns}#${decodeURIComponent(anchor)}` : ns, page);
    }
  }
  return links;
}
