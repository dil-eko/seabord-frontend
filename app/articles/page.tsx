// app/articles/page.tsx
// Self-contained Articles list: no dependency on lib/drupal

import Image from "next/image";
import Link from "next/link";

export const revalidate = 600;

// ---- Minimal JSON:API types (local to this file) ----
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

// ---- Type guards ----
function isFile(x: IncludedItem | undefined): x is FileResource {
  return !!x && typeof x.type === "string" && x.type.includes("file--file");
}
function isMedia(x: IncludedItem | undefined): x is MediaImage {
  return !!x && typeof x.type === "string" && x.type.includes("media--image");
}

// ---- Resolve URL from either direct file or media→file ----
function fileUrl(included: IncludedArray = [], rel?: RelationshipSingle): string | null {
  const base =
    process.env.DRUPAL_BASE_URL || process.env.NEXT_PUBLIC_DRUPAL_BASE_URL || "";

  if (!base) {
    // Show a warning if the base URL is missing
    console.warn("DRUPAL_BASE_URL is not set. Images may not display correctly.");
    return null;
  }

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

// ---- Derive slug for routing (/articles/[slug]) ----
function deriveArticleSlug(a: ArticleAttributes): string | null {
  // 1) Prefer explicit field_slug
  if (a.field_slug && a.field_slug.trim()) return a.field_slug.trim();

  // 2) Fallback from path.alias like "/articles/koroni-sister-citadel-modon"
  const alias = a.path?.alias || "";
  if (alias.startsWith("/articles/")) {
    const seg = alias.split("/").filter(Boolean).pop();
    if (seg) return seg;
  }

  // 3) Last resort: if alias is "/something", still try last segment
  if (alias.startsWith("/")) {
    const seg = alias.split("/").filter(Boolean).pop();
    if (seg) return seg;
  }

  return null;
}

// ---- Server fetcher (JSON:API) ----
async function fetchArticles(): Promise<ArticlesResponse | { error: string }> {
  const BASE =
    process.env.DRUPAL_BASE_URL ||
    process.env.NEXT_PUBLIC_DRUPAL_BASE_URL ||
    "";
  if (!BASE) {
    return { error: "DRUPAL_BASE_URL is not set." };
  }

  const fields = [
    "title",
    "field_slug",
    "path",
    "field_brief",
    "body",
    "field_image", // direct file on Article (card)
    "field_hero", // optional media (detail)
  ];
  const include = [
    "field_image", // direct file (no nested include)
    "field_hero",
    "field_hero.field_media_image", // media chain
  ];
  const qs =
    `?filter[status]=1` +
    `&fields[node--article]=${fields.join(",")}` +
    `&include=${include.join(",")}` +
    `&page[limit]=24&sort=-created`;

  try {
    const res = await fetch(`${BASE}/jsonapi/node/article${qs}`, {
      next: { revalidate: 600 },
    });
    if (!res.ok) {
      return { error: `Articles JSON:API ${res.status}: ${await res.text()}` };
    }
    return (await res.json()) as ArticlesResponse;
  } catch (err: any) {
    return { error: `Failed to fetch articles: ${err.message}` };
  }
}

export default async function Page() {
  const response = await fetchArticles();
  if ("error" in response) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-semibold mb-6">Articles</h1>
        <p className="text-red-600">Error: {response.error}</p>
      </div>
    );
  }

  const { data, included } = response;
  const nodes: ArticleNode[] = data ?? [];
  const inc: IncludedArray = included ?? [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-semibold mb-6">Articles</h1>

      {nodes.length === 0 ? (
        <p className="text-foregound/70">No articles yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {nodes.map((n) => {
            const title = n.attributes.title ?? "Untitled";
            const brief = n.attributes.field_brief ?? n.attributes.body?.summary ?? "";
            const img = fileUrl(inc, n.relationships?.["field_image"]);

            const slug = deriveArticleSlug(n.attributes);
            if (!slug) {
              // Slug türetilemiyorsa kartı göstermiyoruz (bozuk link istemeyiz)
              return null;
            }

            const href = `/articles/${encodeURIComponent(slug)}`;

            return (
              <Link
                key={n.id}
                href={href}
                className="block border rounded-xl overflow-hidden hover:shadow transition"
              >
                <ArticleCardImage img={img} title={title} />
                <ArticleCardBody title={title} brief={brief} />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Extracted card image for accessibility/fallback
function ArticleCardImage({ img, title }: { img: string | null; title: string }) {
  return (
    <div className="relative aspect-[16/9] w-full">
      {img ? (
        <Image
          src={img}
          alt={title}
          fill
          sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
        />
      ) : (
        <div className="absolute inset-0 bg-gray-200 flex items-center justify-center text-gray-400 text-xs">
          No image
        </div>
      )}
    </div>
  );
}

// Extracted card body for clarity
function ArticleCardBody({ title, brief }: { title: string; brief: string | null }) {
  return (
    <div className="p-4">
      <h2 className="text-base font-medium line-clamp-2">{title}</h2>
      {brief && <p className="text-sm mt-2 line-clamp-3">{brief}</p>}
    </div>
  );
}