'use client';

import { useEffect, useState } from 'react';

type TitleNode = { id: string; attributes?: { title?: string } };
type JsonApiTitles = { data?: TitleNode[] };

export default function CorsTestPage() {
  const [titles, setTitles] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_DRUPAL_BASE_URL;
    if (!base) {
      setError('NEXT_PUBLIC_DRUPAL_BASE_URL is not defined in .env.local');
      return;
    }
    const url = `${base}/jsonapi/node/exhibition?filter[status]=1&page[limit]=5`;

    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
        return r.json() as Promise<JsonApiTitles>;
      })
      .then((json) => {
        const data = json.data ?? [];
        setTitles(data.map((d) => d.attributes?.title ?? '(Untitled)'));
      })
      .catch((e) => setError(e.message));
  }, []);

  return (
    <main className="p-6">
      <h1 className="text-xl font-semibold mb-4">CORS Test</h1>
      {error && <p className="text-red-600">Error: {error}</p>}
      {!error && !titles.length && <p>Loading…</p>}
      <ul className="list-disc pl-6">
        {titles.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
      <p className="text-xs text-gray-500 mt-4">
        If you see titles here and no CORS error in DevTools → CORS is OK.
      </p>
    </main>
  );
}
