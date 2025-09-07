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
  type RelationshipSingle,     // ← added
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

  // Narrow the dynamic relationship access to the expected type:
  const heroRel = node.relationships?.['field_hero'] as RelationshipSingle | undefined;
  const hero = fileUrl(included, heroRel);

  const arcgisRel = getArcgisRelationship(node);
  const sections = resolveArcgisSections(included, arcgisRel);

  // Prefer processed body HTML (Drupal applies text format filtering)
  const html =
    node.attributes.body?.processed ??
    node.attributes.field_body?.processed ??
    null;

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      {/* Smaller title to leave more room for embeds */}
      <h1 className="text-xl md:text-2xl font-semibold mb-3">{title}</h1>

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

      {/* Body HTML first: embeds (iframes) inserted in the editor show up here */}
      {html && (
        <section className="arcgis-rich mb-8">
          {/* Drupal-processed HTML. Safe because the text format already allowed your iframe. */}
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
