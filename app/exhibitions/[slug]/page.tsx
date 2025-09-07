import Image from 'next/image';
import { notFound } from 'next/navigation';
import ArcgisEmbed from '@/components/ArcgisEmbed';
import {
  fetchExhibitionDetailBySlug,
  fileUrl,
  resolveArcgisSections,
  getArcgisRelationship,
  arcgisUrlFromSection,
  arcgisTitleFromSection,
  type RelationshipSingle,
  type ExhibitionNode,
  type IncludedArray,
} from '@/lib/drupal';

// Force fresh render to eliminate ISR/CDN confusion while debugging
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Page({ params }: { params: { slug: string } }) {
  const json = await fetchExhibitionDetailBySlug(params.slug);
  const node: ExhibitionNode | undefined = json.data?.[0];
  if (!node) return notFound();

  const included: IncludedArray = json.included ?? [];
  const title = node.attributes.title ?? 'Untitled';

  const heroRel = node.relationships?.['field_hero'] as RelationshipSingle | undefined;
  const hero = fileUrl(included, heroRel);

  const arcgisRel = getArcgisRelationship(node);
  const sections = resolveArcgisSections(included, arcgisRel);

  const html =
    node.attributes.body?.processed ??
    node.attributes.field_body?.processed ??
    null;

  // ---------- DEBUG BAR (temporary) ----------
  const dbg = {
    slug: params.slug,
    hasBody: Boolean(html),
    arcSections: sections.length,
    attrKeys: Object.keys(node.attributes ?? {}),
    relKeys: Object.keys(node.relationships ?? {}),
    // show first 2 section urls/titles for quick inspection
    firstTwo: sections.slice(0, 2).map(s => ({
      label: arcgisTitleFromSection(s),
      url: arcgisUrlFromSection(s),
    })),
  };
  // ------------------------------------------

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-3">
        <h1 className="text-xl md:text-2xl font-semibold">{title}</h1>
        <p className="text-[11px] text-gray-500">[DBG] detail live • hasBody={String(dbg.hasBody)} • arcSections={dbg.arcSections}</p>
      </div>

      {/* TEMP: dump debug JSON (remove later) */}
      <pre className="text-xs bg-gray-50 border rounded p-3 mb-4 overflow-x-auto">
        {JSON.stringify(dbg, null, 2)}
      </pre>

      {/* Optional hero image */}
      {hero && (
        <div
          className="relative w-full rounded-xl overflow-hidden border mb-6"
          style={{ paddingTop: '56.25%' }} // 16:9
        >
          <Image
            src={hero}
            alt={title}
            fill
            sizes="(min-width:1024px) 768px, 100vw"
          />
        </div>
      )}

      {/* Body HTML first: embeds (iframes) from the editor show up here */}
      {html && (
        <section className="arcgis-rich mb-8">
          <div dangerouslySetInnerHTML={{ __html: html }} />
        </section>
      )}

      {/* ArcGIS Sections (Paragraphs) rendered as responsive embeds */}
      {sections.length > 0 && (
        <section className="mt-8">
          {sections.map((s) => {
            const url = arcgisUrlFromSection(s);
            if (!url) return null; // skip empty rows
            const stitle = arcgisTitleFromSection(s);
            return <ArcgisEmbed key={s.id} url={url} title={stitle} aspect={0.6666} />;
          })}
        </section>
      )}
    </main>
  );
}
