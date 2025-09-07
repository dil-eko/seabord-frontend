// app/articles/[slug]/page.tsx
import Image from 'next/image';
import { notFound } from 'next/navigation';
import {
  fetchArticleDetailBySlug,
  fileUrl,
  type RelationshipSingle,
  type ArticleNode,
  type IncludedArray,
} from '@/lib/drupal';

export const revalidate = 600;

export default async function Page({ params }: { params: { slug: string } }) {
  // Fetch one article by slug
  const json = await fetchArticleDetailBySlug(params.slug);
  const node: ArticleNode | undefined = json.data?.[0];
  if (!node) return notFound();

  const included: IncludedArray = json.included ?? [];
  const title = node.attributes.title ?? 'Untitled';

  // Prefer hero; if missing, fall back to field_image (direct file field)
  const heroRel = node.relationships?.['field_hero'] as RelationshipSingle | undefined;
  const imageRel = node.relationships?.['field_image'] as RelationshipSingle | undefined;
  const hero = fileUrl(included, heroRel) ?? fileUrl(included, imageRel);

  // Render processed body HTML if present
  const html = node.attributes.body?.processed ?? null;

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold mb-4">{title}</h1>

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

      {html ? (
        <section className="mb-8">
          <div dangerouslySetInnerHTML={{ __html: html }} />
        </section>
      ) : (
        <p className="text-gray-600">No content.</p>
      )}
    </main>
  );
}
