// app/articles/page.tsx
// app/articles/page.tsx
// Self-contained Articles list: no dependency on lib/drupal

import Image from 'next/image';
import Link from 'next/link';

export const revalidate = 600;

// ---- Minimal JSON:API types (local to this file) ----
type JsonApiIdRef = { id: string; type: string };
type RelationshipSingle = { data?: JsonApiIdRef | null };

interface FileResource {
  id: string;
  type: 'file--file' | string;
  attributes?: { uri?: { url?: string } };
}

interface MediaImage {
  id: string;
  type: 'media--image' | string;
  relationships?: { field_media_image?: RelationshipSingle };
}

type IncludedItem = FileResource | MediaImage;
type IncludedArray = IncludedItem[];

interface ArticleAttributes {
  title?: string | null;
  field_slug?: string | null;
  field_brief?: string | null;
  body?: { processed?: string | null; summary?: string | null } | null;
  path?: { alias?: string | null } | null;
}

interface ArticleNode {
  id: string;
  type: string; // node--article
  attributes: ArticleAttributes;
  relationships?: Record<string, RelationshipSingle | undefined>;
}

interface ArticlesResponse {
  data: ArticleNode[];
  included?: IncludedArray;
}

// ---- Type guards ----
function isFile(x: IncludedItem | undefined): x is FileResource {
  return !!x && typeof x.type === 'string' && x.type.includes('file--file');
}
function isMedia(x: IncludedItem | undefined): x is MediaImage {
  return !!x && typeof x.type === 'string' && x.type.includes('media--image');
}

// ---- Resolve URL from either direct file or media→file ----
function fileUrl(included: IncludedArray = [], rel?: RelationshipSingle): string | null {
  const base = process.env.DRUPAL_BASE_URL || process.env.NEXT_PUBLIC_DRUPAL_BASE_URL || '';
  const id = rel?.data?.id;
  if (!id) return null;

  const item = included.find((x) => x.id === id);
  if (isFile(item)) {
    const p = item.attributes?.uri?.url;
    return p ? `${base}${p}` : null;
  }
  if (isMedia(item)) {
    const fileRef = item.relationships?.field_media_image?.data?.id;
    if (fileRef) {
      const file = included.find((x) => x.id === fileRef);
      if (isFile(file)) {
        const p = file.attributes?.uri?.url;
        return p ? `${base}${p}` : null;
      }
    }
  }
  return null;
}

// ---- Server fetcher (JSON:API) ----
async function fetchArticles(): Promise<ArticlesResponse> {
  const BASE = process.env.DRUPAL_BASE_URL!;
  const fields = [
    'title',
    'field_slug',
    'path',
    'field_brief',
    'body',
    'field_image', // direct file on Article
    'field_hero',  // optional media
  ];
  const include = [
    'field_image',                 // direct file (no nested include)
    'field_hero',
    'field_hero.field_media_image' // media chain
  ];
  const qs =
    `?filter[status]=1` +
    `&fields[node--article]=${fields.join(',')}` +
    `&include=${include.join(',')}` +
    `&page[limit]=24&sort=-created`;

  const res = await fetch(`${BASE}/jsonapi/node/article${qs}`, { next: { revalidate: 600 } });
  if (!res.ok) throw new Error(`Articles JSON:API ${res.status}: ${await res.text()}`);
  return (await res.json()) as ArticlesResponse;
}

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
            // Article uses `field_image` (direct file) for the card; hero is for detail.
            const img = fileUrl(inc, n.relationships?.['field_image']);
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
