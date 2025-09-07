// app/page.tsx
import Link from 'next/link';
import Image from 'next/image';
import {
  fetchExhibitions,
  fileUrl,
  type RelationshipSingle,
  type ExhibitionNode,
  type IncludedArray,
} from '@/lib/drupal';

export const revalidate = 600;

export default async function Page() {
  const { data, included } = await fetchExhibitions();
  const nodes: ExhibitionNode[] = data ?? [];
  const inc: IncludedArray = included ?? [];

  if (!nodes.length) {
    return (
      <main className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-semibold mb-4">Exhibitions</h1>
        <p className="text-gray-600">No exhibitions yet.</p>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-semibold mb-6">Exhibitions</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {nodes.map((n) => {
          // fileUrl expects RelationshipSingle → narrow the union type:
          const thumbRel = n.relationships?.['field_thumbnail'] as RelationshipSingle | undefined;
          const thumb = fileUrl(inc, thumbRel);

          const title = n.attributes.title ?? 'Untitled';
          const slug = n.attributes.field_slug ?? undefined;
          const href = slug ? `/exhibitions/${slug}` : '#';

          return (
            <Link
              key={n.id}
              href={href}
              className="block rounded-xl border overflow-hidden hover:shadow-lg transition"
            >
              <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
                {thumb && (
                  <Image
                    src={thumb}
                    alt={title}
                    fill
                    sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
                  />
                )}
              </div>
              <div className="p-4">
                <h2 className="text-base font-medium line-clamp-2">{title}</h2>
                {n.attributes.field_brief && (
                  <p className="text-sm mt-2 line-clamp-3">{n.attributes.field_brief}</p>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
