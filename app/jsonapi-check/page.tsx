'use client';
import type { ExhibitionNode, IncludedArray } from '@/lib/drupal';
import { useEffect, useState } from 'react';

type Row = { id: string; title: string };
type TitleNode = { id: string; attributes?: { title?: string } };
type JsonApiTitles = { data?: TitleNode[] };

async function fetchTitles(endpoint: string): Promise<Row[]> {
  const res = await fetch(endpoint);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  const json = (await res.json()) as JsonApiTitles;
  const data = json.data ?? [];
  return data.map((d) => ({
    id: d.id,
    title: d.attributes?.title ?? '(Untitled)',
  }));
}

export default function JsonApiCheck() {
  const base = process.env.NEXT_PUBLIC_DRUPAL_BASE_URL;
  const [exh, setExh] = useState<Row[]>([]);
  const [fort, setFort] = useState<Row[]>([]);
  const [art, setArt] = useState<Row[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!base) {
      setErr('NEXT_PUBLIC_DRUPAL_BASE_URL is not set');
      return;
    }
    const E = `${base}/jsonapi/node/exhibition?filter[status]=1&page[limit]=5`;
    const F = `${base}/jsonapi/node/fortress?filter[status]=1&page[limit]=5`;
    const A = `${base}/jsonapi/node/article?filter[status]=1&page[limit]=5`;
    Promise.all([fetchTitles(E), fetchTitles(F), fetchTitles(A)])
      .then(([e, f, a]) => {
        setExh(e);
        setFort(f);
        setArt(a);
      })
      .catch((e) => setErr(e.message));
  }, [base]);

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-xl font-semibold mb-4">JSON:API Check</h1>
      {err && <p className="text-red-600">Error: {err}</p>}

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <h2 className="font-semibold mb-2">Exhibitions</h2>
          {!exh.length ? <p>None / not published</p> : (
            <ul className="list-disc pl-5">{exh.map((x) => <li key={x.id}>{x.title}</li>)}</ul>
          )}
        </div>
        <div>
          <h2 className="font-semibold mb-2">Fortresses</h2>
          {!fort.length ? <p>None / not published</p> : (
            <ul className="list-disc pl-5">{fort.map((x) => <li key={x.id}>{x.title}</li>)}</ul>
          )}
        </div>
        <div>
          <h2 className="font-semibold mb-2">Articles</h2>
          {!art.length ? <p>None / not published</p> : (
            <ul className="list-disc pl-5">{art.map((x) => <li key={x.id}>{x.title}</li>)}</ul>
          )}
        </div>
      </section>
    </main>
  );
}
