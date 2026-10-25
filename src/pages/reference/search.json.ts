// Search index for the reference dialog: [name, namespace, signature, summary].
import { namespaces, summary } from '../../reference';

export function GET() {
  const rows = namespaces.flatMap((ns) =>
    ns.entries.map((e) => [e.name, ns.name, e.signatures?.[0]?.text ?? '', summary(e.doc)]),
  );
  return new Response(JSON.stringify(rows), { headers: { 'Content-Type': 'application/json' } });
}
