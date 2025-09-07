// app/fortresses/[slug]/page.tsx
import Image from "next/image";
import { notFound } from "next/navigation";

export const revalidate = 600;

/* ---------- Minimal JSON:API types (local) ---------- */
type JsonApiIdRef = { id: string; type: string };
type RelationshipSingle = { data?: JsonApiIdRef | null };
type RelationshipMany = { data?: JsonApiIdRef[] | null };

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

interface FortressAttributes {
  title?: string | null;
  field_slug?: string | null;
  field_brief?: string | null;
  body?: { processed?: string | null } | null;
  field_body?: { processed?: string | null } | null;
  path?: { alias?: string | null } | null;
}
interface FortressNode {
  id: string;
  type: string; // node--fortress
  attributes: FortressAttributes;
  relationships?: Record<string, RelationshipSingle | RelationshipMany | undefined>;
}
interface FortressesResponse {
  data: FortressNode[];
  included?: IncludedArray;
}

/* ---------- Type guards ---------- */
function isFile(x: IncludedItem | undefined): x is FileResource {
  return !!x && typeof x.type === "string" && x.type.includes("file--file");
}
function isMedia(x: IncludedItem | undefined): x is MediaImage {
  return !!x && typeof x.type === "string" && x.type.includes("media--image");
}

/* ---------- URL resolvers ---------- */
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

function fileUrlsFromMany(included: IncludedArray = [], rel?: RelationshipMany): string[] {
  const base = process.env.DRUPAL_BASE_URL || process.env.NEXT_PUBLIC_DRUPAL_BASE_URL || "";
  const ids = rel?.data?.map((r) => r.id) ?? [];
  const byId = new Map(included.map((it) => [it.id, it]));
  const out: string[] = [];

  for (const id of ids) {
    const item = byId.get(id);
    if (isFile(item)) {
      const p = item.attributes?.uri?.url;
      if (p) out.push(`${base}${p}`);
      continue;
    }
    if (isMedia(item)) {
      const fileRef = item.relationships?.field_media_image?.data?.id;
      if (fileRef) {
        const file = byId.get(fileRef);
        if (isFile(file)) {
          const p = file.attributes?.uri?.url;
          if (p) out.push(`${base}${p}`);
        }
      }
    }
  }

  return out;
}

/* ---------- Server fetcher (direct JSON:API) ---------- */
async function fetchFortressDetailBySlug(slug: string): Promise<FortressesResponse> {
  const BASE = process.env.DRUPAL_BASE_URL!;
  const fields = [
    "title",
    "field_slug",
    "path",
    "field_brief",
    "body",
    "field_body",
    "field_thumbnail",
    "field_hero",
    "field_gallery",
  ];
  const include = [
    "field_thumbnail",
    "field_thumbnail.field_media_image",
    "field_hero",
    "field_hero.field_media_image",
    "field_gallery",
    "field_gallery.field_media_image",
  ];
  const qs =
    `?filter[field_slug][value]=${encodeURIComponent(slug)}` +
    `&filter[status]=1&page[limit]=1` +
    `&fields[node--fortress]=${fields.join(",")}` +
    `&include=${include.join(",")}`;

  const res = await fetch(`${BASE}/jsonapi/node/fortress${qs}`, { next: { revalidate: 600 } });
  if (!res.ok) throw new Error(`Fortress JSON:API ${res.status}: ${await res.text()}`);
  return (await res.json()) as FortressesResponse;
}

/* ---------- Page ---------- */
export default async function Page({ params }: { params: { slug: string } }) {
  const json = await fetchFortressDetailBySlug(params.slug);
  const node: FortressNode | undefined = json.data?.[0];
  if (!node) return notFound();

  const included: IncludedArray = json.included ?? [];
  const title = node.attributes.title ?? "Untitled";

  const hero = fileUrl(included, node.relationships?.["field_hero"] as RelationshipSingle | undefined);

  const html =
    node.attributes.body?.processed ??
    node.attributes.field_body?.processed ??
    null;

  const gallery = fileUrlsFromMany(included, node.relationships?.["field_gallery"] as any);

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold mb-4">{title}</h1>

      {hero && (
        <div className="relative w-full rounded-xl overflow-hidden border mb-6" style={{ paddingTop: "56.25%" }}>
          <Image src={hero} alt={title} fill sizes="(min-width:1024px) 768px, 100vw" />
        </div>
      )}

      {html && (
        <article className="prose max-w-none mb-8">
          <div dangerouslySetInnerHTML={{ __html: html }} />
        </article>
      )}

      {gallery.length > 0 && (
        <section className="mt-6">
          <h2 className="text-lg font-semibold mb-3">Gallery</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {gallery.map((src, i) => (
              <div key={i} className="relative w-full overflow-hidden rounded-lg border" style={{ paddingTop: "75%" }}>
                <Image src={src} alt={`Gallery ${i + 1}`} fill sizes="(min-width:1024px) 33vw, 50vw" />
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}