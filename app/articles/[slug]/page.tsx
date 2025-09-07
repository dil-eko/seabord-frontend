// app/articles/[slug]/page.tsx
import Image from "next/image";
import { notFound } from "next/navigation";

export const revalidate = 600;

/* ---------- Minimal JSON:API types (local) ---------- */
type JsonApiIdRef = { id: string; type: string };
type RelationshipSingle = { data?: JsonApiIdRef | null };

interface FileResource {
  id: string;
  type: "file--file" | string;
  attributes?: { uri?: { url?: string } };
}

interface MediaImage {
  id: string;
  type: "media--image" | string;
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

/* ---------- Type guards ---------- */
function isFile(x: IncludedItem | undefined): x is FileResource {
  return !!x && typeof x.type === "string" && x.type.includes("file--file");
}
function isMedia(x: IncludedItem | undefined): x is MediaImage {
  return !!x && typeof x.type === "string" && x.type.includes("media--image");
}

/* ---------- Resolve URL from either direct file or media→file ---------- */
function fileUrl(included: IncludedArray = [], rel?: RelationshipSingle): string | null {
  const base = process.env.DRUPAL_BASE_URL || process.env.NEXT_PUBLIC_DRUPAL_BASE_URL || "";
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

/* ---------- Server fetcher (direct JSON:API) ---------- */
async function fetchArticleDetailBySlug(slug: string): Promise<ArticlesResponse> {
  const BASE = process.env.DRUPAL_BASE_URL!;
  const fields = [
    "title",
    "field_slug",
    "path",
    "field_brief",
    "body",
    "field_image", // direct file on Article
    "field_hero",  // optional media
  ];
  const include = [
    "field_image",                 // direct file (no nested include)
    "field_hero",
    "field_hero.field_media_image" // media chain
  ];
  const qs =
    `?filter[field_slug][value]=${encodeURIComponent(slug)}` +
    `&filter[status]=1&page[limit]=1` +
    `&fields[node--article]=${fields.join(",")}` +
    `&include=${include.join(",")}`;

  const res = await fetch(`${BASE}/jsonapi/node/article${qs}`, { next: { revalidate: 600 } });
  if (!res.ok) throw new Error(`Article JSON:API ${res.status}: ${await res.text()}`);
  return (await res.json()) as ArticlesResponse;
}

/* ---------- Page ---------- */
export default async function Page({ params }: { params: { slug: string } }) {
  const json = await fetchArticleDetailBySlug(params.slug);
  const node: ArticleNode | undefined = json.data?.[0];
  if (!node) return notFound();

  const included: IncludedArray = json.included ?? [];
  const title = node.attributes.title ?? "Untitled";

  // Prefer hero; fallback to field_image
  const hero =
    fileUrl(included, node.relationships?.["field_hero"]) ??
    fileUrl(included, node.relationships?.["field_image"]);

  const html = node.attributes.body?.processed ?? null;

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold mb-4">{title}</h1>

      {hero && (
        <div className="relative w-full rounded-xl overflow-hidden border mb-6" style={{ paddingTop: "56.25%" }}>
          <Image src={hero} alt={title} fill sizes="(min-width:1024px) 768px, 100vw" />
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
