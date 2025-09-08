// components/OtherFortresses.tsx
import Link from "next/link";
import Image from "next/image";

/** Minimal JSON:API types */
type JsonApiIdRef = { id: string; type: string };
type RelationshipSingle = { data?: JsonApiIdRef | null };
interface FileResource { id: string; type: string; attributes?: { uri?: { url?: string } } }
interface MediaImage { id: string; type: string; relationships?: { field_media_image?: RelationshipSingle } }
type IncludedItem = FileResource | MediaImage;
type IncludedArray = IncludedItem[];
interface FortressNode {
  id: string;
  type: string;
  attributes: { title?: string | null; field_slug?: string | null; path?: { alias?: string | null } | null; };
  relationships?: Record<string, RelationshipSingle | undefined>;
}
interface FortressesResponse { data: FortressNode[]; included?: IncludedArray; }

/** Guards + helpers */
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

/** Server fetcher: similar or latest excluding current */
async function fetchOtherFortresses(opts: {
  currentSlug: string;
  regionId?: string; // optional
  limit?: number;
}): Promise<FortressesResponse> {
  const BASE = process.env.DRUPAL_BASE_URL!;
  const limit = opts.limit ?? 6;
  const fields = ["title", "field_slug", "path", "field_thumbnail"];
  const include = ["field_thumbnail", "field_thumbnail.field_media_image"];

  // Base filters
  const params: string[] = [];
  params.push("filter[status]=1");
  params.push(`fields[node--fortress]=${fields.join(",")}`);
  params.push(`include=${include.join(",")}`);
  params.push(`page[limit]=${limit}`);

  // Exclude current by slug
  // Drupal JSON:API operator syntax (condition group):
  params.push("filter[cur][condition][path]=field_slug");
  params.push("filter[cur][condition][operator]=<>");
  params.push(`filter[cur][condition][value]=${encodeURIComponent(opts.currentSlug)}`);

  // Same region if provided
  if (opts.regionId) {
    params.push("filter[rg][condition][path]=field_region.id");
    params.push(`filter[rg][condition][value]=${encodeURIComponent(opts.regionId)}`);
    params.push("sort=title"); // stable
  } else {
    params.push("sort=-created"); // latest
  }

  const qs = `?${params.join("&")}`;
  const res = await fetch(`${BASE}/jsonapi/node/fortress${qs}`, { next: { revalidate: 600 } });
  if (!res.ok) throw new Error(`Other Fortresses ${res.status}: ${await res.text()}`);
  return (await res.json()) as FortressesResponse;
}

export default async function OtherFortresses(props: { currentSlug: string; regionId?: string }) {
  const { data, included } = await fetchOtherFortresses({ currentSlug: props.currentSlug, regionId: props.regionId, limit: 6 });
  if (!data?.length) return null;
  const inc: IncludedArray = included ?? [];

  return (
    <section className="mt-10">
      <h2 className="text-lg font-semibold mb-3">Other fortresses</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {data.map((n) => {
          const img = fileUrl(inc, n.relationships?.["field_thumbnail"]);
          const title = n.attributes.title ?? "Untitled";
          const slug = n.attributes.field_slug ?? undefined;
          const href = slug ? `/fortresses/${slug}` : n.attributes.path?.alias ?? "#";
          return (
            <Link key={n.id} href={href} className="group">
              <div className="relative w-full overflow-hidden rounded-lg border" style={{ paddingTop: "75%" }}>
                {img && <Image src={img} alt={title} fill sizes="(min-width:1024px) 33vw, 50vw" />}
              </div>
              <div className="mt-2 text-sm font-medium line-clamp-2 group-hover:underline">{title}</div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}