import Image from 'next/image';
import Link from 'next/link';
import { fetchExhibitions, fileUrl } from '@/lib/drupal';

export const revalidate = 600;

export default async function Page() {
  const json = await fetchExhibitions();
  const nodes = json.data;
  const inc = json.included ?? [];

  if (!nodes.length) {
    return <main className="max-w-7xl mx-auto px-4 py-12">No exhibitions yet.</main>;
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-semibold mb-6">Exhibitions</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {nodes.map((n) => {
          const thumb = fileUrl(inc, n.relationships?.field_thumbnail);
          const title = n.attributes.title ?? 'Untitled';
          const slug = n.attributes.field_slug ?? undefined;
          const href = slug ? `/exhibitions/${slug}` : n.attributes.path?.alias ?? '#';

          return (
           // ...
          <Link
            key={n.id}
            href={href}
            className="block rounded-xl border overflow-hidden hover:shadow-lg transition"
          >
            {thumb && (
              <div className="relative aspect-[4/3]">
                <Image
                  src={thumb}
                  alt={title}
                  fill
                  sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
                />
              </div>
            )}
            <div className="p-4">
              <h3 className="text-lg font-semibold">{title}</h3>
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
