import Image from 'next/image';
import { notFound } from 'next/navigation';
import {
  fetchFortressDetailBySlug,
  fileUrl,
  fileUrlsFromMany,
  type RelationshipSingle,
  type RelationshipMany,
  type FortressNode,
  type IncludedArray,
} from '@/lib/drupal';

export const revalidate = 600;

export default async function Page({ params }: { params: { slug: string } }) {
  const json = await fetchFortressDetailBySlug(params.slug);
  const node: FortressNode | undefined = json.data?.[0];
  if (!node) return notFound();

  const included: IncludedArray = json.included ?? [];
  const title = node.attributes.title ?? 'Untitled';

  const heroRel = node.relationships?.['field_hero'] as RelationshipSingle | undefined;
  const hero = fileUrl(included, heroRel);

  const galleryRel = node.relationships?.['field_gallery'] as RelationshipMany | undefined;
  const gallery = fileUrlsFromMany(included, galleryRel);

  const html =
    node.attributes.body?.processed ??
    node.attributes.field_body?.processed ??
    null;

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold mb-4">{title}</h1>

      {hero && (
        <div className="relative w-full rounded-xl overflow-hidden border mb-6" style={{ paddingTop: '56.25%' }}>
          <Image src={hero} alt={title} fill sizes="(min-width:1024px) 768px, 100vw" />
        </div>
      )}

      {html && (
        <article className="prose max-w-none mb-8">
          <div dangerouslySetInnerHTML={{ __html: html }} />
        </article>
      )}

      {gallery.length > 0 && (
        <section className="mt-6">
          <h2 className="text-lg font-semibold mb-3">Gallery</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {gallery.map((src, i) => (
              <div key={i} className="relative w-full overflow-hidden rounded-lg border" style={{ paddingTop: '75%' }}>
                <Image src={src} alt={`Gallery ${i + 1}`} fill sizes="(min-width:1024px) 33vw, 50vw" />
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
