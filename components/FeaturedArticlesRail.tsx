// components/FeaturedArticlesRail.tsx
import Link from "next/link";
import Image from "next/image";

/** Minimal JSON:API types */
type JsonApiIdRef = { id: string; type: string };
type RelationshipSingle = { data?: JsonApiIdRef | null };
interface FileResource { id: string; type: string; attributes?: { uri?: { url?: string } } }
interface MediaImage { id: string; type: string; relationships?: { field_media_image?: RelationshipSingle } }
type IncludedItem = FileResource | MediaImage;
type IncludedArray = IncludedItem[];
interface ArticleNode {
  id: string;
  type: string;
  attributes: { title?: string | null; field_slug?: string | null; path?: { alias?: string | null } | null };
  relationships?: Record<string, RelationshipSingle | undefined>;
}
interface ArticlesResponse { data: ArticleNode[]; included?: IncludedArray; }

/** Type guards */
function isFile(x?: IncludedItem): x is FileResource {
  return !!x && typeof x.type === "string" && x.type.includes("file--file");
}
function isMedia(x?: IncludedItem): x is MediaImage {
  return !!x && typeof x.type === "string" && x.type.includes("media--image");
}
function fileUrl(included: IncludedArray = [], rel?: RelationshipSingle): string | null {
  const base = process.env.DRUPAL_BASE_URL || process.env.NEXT_PUBLIC_DRUPAL_BASE_URL || "";
  const id = rel?.data?.id;
  if (!id) return null;
  const item = included.find((x) => x.id === id);
  if (isFile(item)) return item.attributes?.uri?.url ? `${base}${item.attributes.uri.url}` : null;
  if (isMedia(item)) {
    const fileRef = item.relationships?.field_media_image?.data?.id;
    const file = included.find((x) => x.id === fileRef);
    if (isFile(file)) return file.attributes?.uri?.url ? `${base}${file.attributes.uri.url}` : null;
  }
  return null;
}

/** Server fetcher: featured articles */
async function fetchFeaturedArticles(limit = 4): Promise<ArticlesResponse> {
  const BASE = process.env.DRUPAL_BASE_URL!;
  const fields = ["title", "field_slug", "path", "field_image", "field_hero"];
  const include = ["field_image", "field_hero", "field_hero.field_media_image"];
  const qs =
    `?filter[status]=1` +
    `&filter[field_featured][value]=1` +
    `&fields[node--article]=${fields.join(",")}` +
    `&include=${include.join(",")}` +
    `&page[limit]=${limit}&sort=-created`;
  const res = await fetch(`${BASE}/jsonapi/node/article${qs}`, { next: { revalidate: 600 } });
  if (!res.ok) throw new Error(`Featured Articles ${res.status}: ${await res.text()}`);
  return (await res.json()) as ArticlesResponse;
}

export default async function FeaturedArticlesRail() {
  const { data, included } = await fetchFeaturedArticles(4);
  if (!data?.length) return null;
  const inc: IncludedArray = included ?? [];

  return (
    <aside className="lg:sticky lg:top-20 space-y-4">
      <h2 className="text-sm font-semibold tracking-wide uppercase">Featured articles</h2>
      <ul className="space-y-3">
        {data.map((n) => {
          const img =
            fileUrl(inc, n.relationships?.["field_hero"]) ??
            fileUrl(inc, n.relationships?.["field_image"]);
          const title = n.attributes.title ?? "Untitled";
          const slug = n.attributes.field_slug ?? undefined;
          const href = slug ? `/articles/${slug}` : n.attributes.path?.alias ?? "#";

          return (
            <li key={n.id} className="flex gap-3">
              {img && (
                <div className="relative flex-shrink-0 w-20 h-14 overflow-hidden rounded border">
                  <Image src={img} alt={title} fill sizes="112px" />
                </div>
              )}
              <div className="min-w-0">
                <Link href={href} className="text-sm font-medium line-clamp-2 hover:underline">
                  {title}
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}