// app/exhibitions/[slug]/page.tsx
import { notFound } from 'next/navigation';

async function fetchExhibitionBySlug(slug: string) {
  const base = process.env.DRUPAL_BASE_URL!;
  const qs = `?filter[field_slug]=${encodeURIComponent(slug)}&filter[status]=1&page[limit]=1`;
  const res = await fetch(`${base}/jsonapi/node/exhibition${qs}`, { next: { revalidate: 600 } });
  if (!res.ok) return null;
  const json = await res.json();
  return json.data?.[0] ?? null;
}

export default async function Page({ params }: { params: { slug: string } }) {
  const node = await fetchExhibitionBySlug(params.slug);
  if (!node) return notFound();
  const title = node.attributes?.title ?? 'Untitled';

  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-semibold mb-4">{title}</h1>
      <p className="text-sm text-gray-600">Detay sayfası iskeleti. Embed ve diğer alanları birazdan ekleyeceğiz.</p>
    </main>
  );
}
