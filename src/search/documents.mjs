import { parse } from 'node-html-parser';

export function documentRecords(html, title, url) {
  const root = parse(html, { blockTextElements: { script: true, style: true } });
  root.querySelectorAll('script, style, nav').forEach(node => node.remove());
  const records = [];
  let heading = '';
  let href = url;
  let chunks = [];
  const flush = () => {
    const text = chunks.join('').replace(/\s+/g, ' ').trim();
    if (text || heading) records.push({ id: href, url: href, type: 'docs', title: heading ? `${title} → ${heading}` : title, text });
    chunks = [];
  };
  function visit(node) {
    if (/^H[1-6]$/.test(node.tagName ?? '') && node.id) {
      flush();
      heading = node.textContent.trim();
      href = `${url}#${encodeURIComponent(node.id)}`;
    } else if (node.nodeType === 3) chunks.push(node.textContent);
    else {
      const block = /^(P|DIV|SECTION|PRE|LI|TR|TD|TH|BR|BLOCKQUOTE|UL|OL)$/.test(node.tagName ?? '');
      if (block) chunks.push(' ');
      for (const child of node.childNodes ?? []) visit(child);
      if (block) chunks.push(' ');
    }
  }
  visit(root);
  flush();
  return records;
}
