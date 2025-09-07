import Image from 'next/image';
import { notFound } from 'next/navigation';
import ArcgisEmbed from '@/components/ArcgisEmbed';
import {
  fetchExhibitionDetailBySlug,
  fileUrl,
  resolveArcgisSections,
  type ExhibitionNode,
  type IncludedArray,
} from '@/lib/drupal';

export const revalidate = 600;

export default async function Page({ params }: { params: { slug: string } }) {
  const json = await fetchExhibitionDetailBySlug(params.slug);
  const node: ExhibitionNode | undefined = json.data?.[0];
  if (!node) return notFound();

  const included: IncludedArray = json.included ?? [];
  const title = node.attributes.title ?? 'Untitled';
  const hero = fileUrl(included, node.relationships?.field_hero);
  const sections = resolveArcgisSections(included, node.relationships?.field_arcgis_sections);

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      {/* Smaller title to leave more space for the embed */}
      <h1 className="text-xl md:text-2xl font-semibold mb-4">{title}</h1>

      {/* Optional hero image */}
      {hero && (
        <div className="relative w-full rounded-xl overflow-hidden border mb-6" style={{ paddingTop: '56.25%' }}>
          <Image
            src={hero}
            alt={title}
            fill
            sizes="(min-width:1024px) 768px, 100vw"
          />
        </div>
      )}

      {/* ArcGIS Sections */}
      {sections.length > 0 ? (
        <section>
          {sections.map((s) => {
            const url = s.attributes?.field_url ?? '';
            const stitle = s.attributes?.field_title ?? undefined;
            return <ArcgisEmbed key={s.id} url={url} title={stitle} />;
          })}
        </section>
      ) : (
        <p className="text-sm text-gray-600">No ArcGIS sections were provided.</p>
      )}
    </main>
  );
}
