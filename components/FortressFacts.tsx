type Facts = {
  constructionYear?: string | null;
  towersBastions?: string | null;   // field_towers_bastions
  condition?: string | null;
  areaSqm?: string | null;          // field_area_sqm
  origin?: string | null;
  region?: string | null;
  tags?: string[];
  lat?: number | null;
  lon?: number | null;
};

export default function FortressFacts(f: Facts) {
  const rows: Array<[string, string]> = [];
  if (f.constructionYear) rows.push(["Construction year", f.constructionYear]);
  if (f.towersBastions)   rows.push(["Towers/Bastions", f.towersBastions]);
  if (f.condition)        rows.push(["Condition", f.condition]);
  if (f.areaSqm)          rows.push(["Area", f.areaSqm]);
  if (f.origin)           rows.push(["Origin", f.origin]);
  if (f.region)           rows.push(["Region", f.region]);

  const hasMap = !!(f.lat && f.lon);
  const hasTags = !!(f.tags && f.tags.length);

  if (rows.length === 0 && !hasMap && !hasTags) return null;

  return (
    <aside className="space-y-4">
      <section className="rounded-xl border p-4">
        <h2 className="text-sm font-semibold mb-3">Facts</h2>
        <dl className="space-y-2">
          {rows.map(([k, v]) => (
            <div key={k} className="flex gap-2">
              <dt className="w-40 shrink-0 text-zinc-500 text-sm">{k}</dt>
              <dd className="text-sm">{v}</dd>
            </div>
          ))}
          {hasMap && (
            <div className="mt-3">
              <div className="text-zinc-500 text-sm mb-1">Coordinates</div>
              <div className="text-sm">
                {f.lat!.toFixed(6)}, {f.lon!.toFixed(6)} ·{" "}
                {/* Dış bağlantı: https://… —> ESLint uyarmaz */}
                <a
                  className="underline underline-offset-2"
                  href={`https://www.openstreetmap.org/?mlat=${f.lat}&mlon=${f.lon}#map=16/${f.lat}/${f.lon}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open in OSM
                </a>
              </div>
            </div>
          )}
          {hasTags && (
            <div className="mt-3 flex flex-wrap gap-2">
              {f.tags!.map((t) => (
                <span key={t} className="px-2 py-0.5 rounded-full border text-xs">{t}</span>
              ))}
            </div>
          )}
        </dl>
      </section>
    </aside>
  );
}