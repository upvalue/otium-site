export function excerpt(text, query, length = 180) {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const lower = text.toLowerCase();
  const offsets = terms.map(term => lower.indexOf(term)).filter(offset => offset >= 0);
  const start = Math.max(0, (offsets.length ? Math.min(...offsets) : 0) - 50);
  return `${start ? '…' : ''}${text.slice(start, start + length)}${start + length < text.length ? '…' : ''}`;
}
