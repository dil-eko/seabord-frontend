// app/fortresses/page.tsx
import Link from "next/link";
import Image from "next/image";

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

interface FortressAttributes {
  body: any;
  title?: string | null;
  field_slug?: string | null;
  field_brief?: string | null;
  path?: { alias?: string | null } | null;
}
interface FortressNode {
  id: string;
  type: string; // node--fortress
  attributes: FortressAttributes;
  relationships?: Record<string, RelationshipSingle | undefined>;
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
async function fetchFortresses(): Promise<FortressesResponse> {
  const BASE = process.env.DRUPAL_BASE_URL!;
  const fields = [
    "title",
    "field_slug",
    "path",
    "body",
    "field_image",
    "field_hero",
    "field_brief",
    "field_thumbnail", // media
  ];
  const include = [
    "field_thumbnail",
    "field_thumbnail.field_media_image",
  ];
  const qs =
    `?filter[status]=1` +
    `&fields[node--fortress]=${fields.join(",")}` +
    `&include=${include.join(",")}` +
    `&page[limit]=24&sort=title`;

  const res = await fetch(`${BASE}/jsonapi/node/fortress${qs}`, { next: { revalidate: 600 } });
  if (!res.ok) throw new Error(`Fortresses JSON:API ${res.status}: ${await res.text()}`);
  return (await res.json()) as FortressesResponse;
}

/* ---------- Page ---------- */
export default async function Page() {
  const { data, included } = await fetchFortresses();
  const nodes: FortressNode[] = data ?? [];
  const inc: IncludedArray = included ?? [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-semibold mb-6">Fortresses</h1>

      {nodes.length === 0 ? (
        <p className="text-gray-600">No fortresses yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {nodes.map((n) => {
            const img = fileUrl(inc, n.relationships?.["field_thumbnail"]);
            const title = n.attributes.title ?? "Untitled";
            const slug = n.attributes.field_slug ?? undefined;
            const alias = n.attributes.path?.alias ?? null;
            const href = alias ?? (slug ? `/fortresses/${slug}` : '#');
            const brief = n.attributes.field_brief ?? n.attributes.body?.summary ?? '';

            return (
              <Link
                key={n.id}
                href={href}
                className="block border rounded-xl overflow-hidden hover:shadow transition"
              >
                <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
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
    </div>
  );
}