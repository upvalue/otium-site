import MiniSearch from 'minisearch';

export function createSearch(records) {
  const index = new MiniSearch({ fields: ['title', 'name', 'namespace', 'signature', 'text'] });
  index.addAll(records);
  const byId = new Map(records.map(record => [record.id, record]));
  return (query, scope = 'all') => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const matches = new Map();
    for (const hit of index.search(q, {
      boost: { name: 8, title: 4, namespace: 2, signature: 2 },
      prefix: true,
      fuzzy: term => term.length >= 5 ? 0.2 : false,
      combineWith: 'AND',
    })) matches.set(hit.id, { ...byId.get(hit.id), score: hit.score, rank: 3 });
    for (const record of records) {
      if (record.type !== 'reference') continue;
      const name = record.name.toLowerCase();
      const rank = name === q ? 0 : name.startsWith(q) ? 1 : name.includes(q) ? 2 : -1;
      if (rank >= 0) matches.set(record.id, { ...record, score: matches.get(record.id)?.score ?? 0, rank });
    }
    return [...matches.values()]
      .filter(record => scope === 'all' || record.type === scope)
      .sort((a, b) => a.rank - b.rank || b.score - a.score || a.title.localeCompare(b.title));
  };
}

