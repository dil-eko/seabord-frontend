// app/articles/[slug]/page.tsx
import Image from "next/image";
import { notFound } from "next/navigation";
import FeaturedArticlesRail from "@/components/FeaturedArticlesRail";

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
  return !!x && typeof (x as any).type === "string" && (x as any).type.includes("file--file");
}
function isMedia(x: IncludedItem | undefined): x is MediaImage {
  return !!x && typeof (x as any).type === "string" && (x as any).type.includes("media--image");
}

/* ---------- Resolve URL from either direct file or media→file ---------- */
function fileUrl(included: IncludedArray = [], rel?: RelationshipSingle): string | null {
  const base = process.env.DRUPAL_BASE_URL || process.env.NEXT_PUBLIC_DRUPAL_BASE_URL || "";
  const id = rel?.data?.id;
  if (!id) return null;

  const item = included.find((x) => x.id === id);
  if (isFile(item)) {
    const p = (item as FileResource).attributes?.uri?.url;
    return p ? `${base}${p}` : null;
  }
  if (isMedia(item)) {
    const fileRef = (item as MediaImage).relationships?.field_media_image?.data?.id;
    if (fileRef) {
      const file = included.find((x) => x.id === fileRef);
      if (isFile(file)) {
        const p = (file as FileResource).attributes?.uri?.url;
        return p ? `${base}${p}` : null;
      }
    }
  }
  return null;
}

/* ---------- HTML cleanup (optional but useful) ---------- */
function cleanHtml(html: string) {
  return html
    .replace(/\sdir="ltr"/gi, "")
    .replace(/&nbsp;/g, " ")
    .replace(/<h([2-3])[^>]*>\s*<strong>(.*?)<\/strong>\s*<\/h\1>/gi, "<h$1>$2</h$1>");
}

/* ---------- Server fetchers ---------- */
const BASE = process.env.DRUPAL_BASE_URL!;

const FIELDS = [
  "title",
  "field_slug",
  "path",
  "field_brief",
  "body",
  "field_image", // direct file on Article
  "field_hero",
  "field_gallery",
];
const INCLUDE = [
  "field_image", // direct file (no nested include)
  "field_hero",
  "field_hero.field_media_image",
  "field_gallery",
  "field_gallery.field_media_image",
];

function commonQS(extraFilters: string) {
  return (
    `?${extraFilters}` +
    `&filter[status]=1&page[limit]=1` +
    `&fields[node--article]=${FIELDS.join(",")}` +
    `&include=${INCLUDE.join(",")}`
  );
}

async function fetchByQS(qs: string): Promise<ArticlesResponse> {
  const res = await fetch(`${BASE}/jsonapi/node/article${qs}`, { next: { revalidate: 600 } });
  if (!res.ok) throw new Error(`Article JSON:API ${res.status}: ${await res.text()}`);
  return (await res.json()) as ArticlesResponse;
}

/** 1) Try by field_slug == slug */
async function fetchByFieldSlug(slug: string): Promise<ArticlesResponse> {
  const qs = commonQS(`filter[field_slug][value]=${encodeURIComponent(slug)}`);
  return fetchByQS(qs);
}

/** 2) Try by path.alias == /articles/${slug} (JSON:API condition syntax) */
async function fetchByAliasArticles(slug: string): Promise<ArticlesResponse> {
  const alias = `/articles/${slug}`;
  const filter =
    `filter[alias][condition][path]=path.alias` +
    `&filter[alias][condition][operator]==` +
    `&filter[alias][condition][value]=${encodeURIComponent(alias)}`;
  const qs = commonQS(filter);
  return fetchByQS(qs);
}

/** 3) Fallback: path.alias == /${slug} */
async function fetchByAliasRoot(slug: string): Promise<ArticlesResponse> {
  const alias = `/${slug}`;
  const filter =
    `filter[alias][condition][path]=path.alias` +
    `&filter[alias][condition][operator]==` +
    `&filter[alias][condition][value]=${encodeURIComponent(alias)}`;
  const qs = commonQS(filter);
  return fetchByQS(qs);
}

/** Try all strategies in order; return first that yields a node */
async function fetchArticleDetailBySlugOrAlias(slug: string): Promise<ArticlesResponse> {
  // 1) field_slug
  let r = await fetchByFieldSlug(slug);
  if (r.data?.length) return r;

  // 2) alias /articles/slug
  r = await fetchByAliasArticles(slug);
  if (r.data?.length) return r;

  // 3) alias /slug
  r = await fetchByAliasRoot(slug);
  return r; // possibly empty
}

/* ---------- Page ---------- */
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const json = await fetchArticleDetailBySlugOrAlias(slug);
  const node: ArticleNode | undefined = json.data?.[0];
  if (!node) return notFound();

  const included: IncludedArray = json.included ?? [];
  const a = node.attributes;
  const title = a.title ?? "Untitled";

  // Prefer hero; fallback to field_image
  const hero =
    fileUrl(included, node.relationships?.["field_hero"]) ??
    fileUrl(included, node.relationships?.["field_image"]);

  const html = a.body?.processed ? cleanHtml(a.body.processed) : null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10">
        <article>
          <h1 className="text-2xl font-semibold mb-4">{title}</h1>

          {hero && (
            <div className="relative w-full rounded-xl overflow-hidden border mb-6 aspect-[16/9]">
              <Image src={hero} alt={title} fill sizes="(min-width:1024px) 768px, 100vw" />
            </div>
          )}

          {html ? (
            <section className="prose max-w-none">
              <div dangerouslySetInnerHTML={{ __html: html }} />
            </section>
          ) : (
            <p className="text-gray-600">No content.</p>
          )}
        </article>

        {/* Sidebar */}
        <div className="lg:pt-10">
          <FeaturedArticlesRail />
        </div>
      </div>
    </div>
  );
}
