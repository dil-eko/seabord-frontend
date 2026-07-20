// app/exhibitions/page.tsx
import Link from "next/link";
import Image from "next/image";

export const revalidate = 600;

/* ---------- Minimal JSON:API types (local) ---------- */
type JsonApiIdRef = { id: string; type: string };
type RelationshipMany = { data?: JsonApiIdRef[] | null };

interface ArcgisSection {
  id: string;
  type: "paragraph--arcgis_section" | string;
  attributes?: {
    field_storymap_url?: string | { uri?: string } | null;
    field_experience_url?: string | { uri?: string } | null;
  };
}
type IncludedItem = ArcgisSection;
type IncludedArray = IncludedItem[];

interface ExhibitionAttributes {
  title?: string | null;
  field_slug?: string | null;
  field_brief?: string | null;
  path?: { alias?: string | null } | null;
}
interface ExhibitionNode {
  id: string;
  type: string; // node--exhibition
  attributes: ExhibitionAttributes;
  relationships?: Record<string, RelationshipMany | undefined>;
}
interface ExhibitionsResponse {
  data: ExhibitionNode[];
  included?: IncludedArray;
}

function isArcgisSection(item?: IncludedItem): item is ArcgisSection {
  return !!item && item.type.includes("paragraph--arcgis_section");
}

function pickLink(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "uri" in value) {
    const uri = (value as { uri?: unknown }).uri;
    return typeof uri === "string" ? uri : "";
  }
  return "";
}

function arcgisItemId(raw: string): string | null {
  try {
    const url = new URL(raw);
    const host = url.hostname.toLowerCase();
    if (url.protocol !== "https:" || (host !== "arcgis.com" && !host.endsWith(".arcgis.com"))) return null;

    const pathMatch = url.pathname.match(/\/(?:stories|experience|apps)\/([a-f\d]{32})(?:\/|$)/i);
    const id = pathMatch?.[1] ?? url.searchParams.get("id");
    return id && /^[a-f\d]{32}$/i.test(id) ? id : null;
  } catch {
    return null;
  }
}

function storyMapItemId(node: ExhibitionNode, included: IncludedArray): string | null {
  const refs = node.relationships?.["field_arcgis_sections"]?.data ?? [];
  const byId = new Map(included.map((item) => [item.id, item]));

  for (const ref of refs) {
    const section = byId.get(ref.id);
    if (!isArcgisSection(section)) continue;
    const raw =
      pickLink(section.attributes?.field_storymap_url) ||
      pickLink(section.attributes?.field_experience_url);
    const id = arcgisItemId(raw);
    if (id) return id;
  }
  return null;
}

async function arcgisThumbnail(itemId: string | null): Promise<string | null> {
  if (!itemId) return null;

  try {
    const res = await fetch(`https://www.arcgis.com/sharing/rest/content/items/${itemId}?f=json`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;

    const item = (await res.json()) as { thumbnail?: unknown; error?: unknown };
    if (typeof item.thumbnail !== "string" || !item.thumbnail) return null;

    return `https://www.arcgis.com/sharing/rest/content/items/${itemId}/info/${encodeURIComponent(item.thumbnail)}`;
  } catch {
    return null;
  }
}

/* ---------- Server fetcher ---------- */
async function fetchExhibitions(): Promise<ExhibitionsResponse> {
  const BASE = process.env.DRUPAL_BASE_URL!;
  const fields = [
    "title",
    "field_slug",
    "path",
    "field_brief",
    "field_arcgis_sections",
  ];
  const include = ["field_arcgis_sections"];
  const qs =
    `?filter[status]=1` +
    `&fields[node--exhibition]=${fields.join(",")}` +
    `&include=${include.join(",")}` +
    `&page[limit]=24&sort=-created`;

  const res = await fetch(`${BASE}/jsonapi/node/exhibition${qs}`, { next: { revalidate: 600 } });
  if (!res.ok) throw new Error(`Exhibitions JSON:API ${res.status}: ${await res.text()}`);
  return (await res.json()) as ExhibitionsResponse;
}

/* ---------- Page ---------- */
export default async function Page() {
  const { data, included } = await fetchExhibitions();
  const nodes: ExhibitionNode[] = data ?? [];
  const inc: IncludedArray = included ?? [];
  const thumbnails = new Map(
    await Promise.all(
      nodes.map(async (node) => [node.id, await arcgisThumbnail(storyMapItemId(node, inc))] as const),
    ),
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-semibold mb-6">Exhibitions</h1>

      {nodes.length === 0 ? (
        <p className="text-gray-600">No exhibitions yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {nodes.map((n) => {
            const thumb = thumbnails.get(n.id);
            const title = n.attributes.title ?? "Untitled";
            const slug = n.attributes.field_slug ?? undefined;
            const href = slug ? `/exhibitions/${slug}` : (n.attributes.path?.alias ?? "#");
            const brief = n.attributes.field_brief ?? "";

            return (
              <Link key={n.id} href={href} className="block border rounded-xl overflow-hidden hover:shadow transition">
                <div className="relative aspect-video w-full overflow-hidden bg-zinc-100 dark:bg-zinc-900">
                  {thumb ? (
                    <Image
                      src={thumb}
                      alt={title}
                      fill
                      className="object-cover"
                      sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
                    />
                  ) : (
                    <span className="absolute inset-0 flex items-center justify-center text-sm text-foreground/60">
                      StoryMap preview unavailable
                    </span>
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
