// app/articles/page.tsx
import Link from 'next/link';
import Image from 'next/image';
import {
  fetchArticles,
  fileUrl,
  type RelationshipSingle,
  type ArticleNode,
  type IncludedArray,
} from '@/lib/drupal';

export const revalidate = 600;

export default async function Page() {
  const { data, included } = await fetchArticles();
  const nodes: ArticleNode[] = data ?? [];
  const inc: IncludedArray = included ?? [];

  return (
    <main className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-semibold mb-6">Articles</h1>

      {nodes.length === 0 ? (
        <p className="text-gray-600">No articles yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {nodes.map((n) => {
            // field_image is a direct file field on Article (RelationshipSingle)
            const imgRel = n.relationships?.['field_image'] as RelationshipSingle | undefined;
            const img = fileUrl(inc, imgRel);

            const title = n.attributes.title ?? 'Untitled';
            const slug = n.attributes.field_slug ?? undefined;
            const href = slug ? `/articles/${slug}` : '#';
            const brief = n.attributes.field_brief ?? n.attributes.body?.summary ?? '';

            return (
              <Link
                key={n.id}
                href={href}
                className="block border rounded-xl overflow-hidden hover:shadow transition"
              >
                <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
                  {img && (
                    <Image
                      src={img}
                      alt={title}
                      fill
                      sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
                    />
                  )}
                </div>
                <div className="p-4">
                  <h2 className="text-base font-medium line-clamp-2">{title}</h2>
                  {brief && <p className="text-sm mt-2 line-clamp-3">{brief}</p>}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
 