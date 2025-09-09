// app/fortresses/[slug]/page.tsx
import Image from "next/image";
import { notFound } from "next/navigation";
import OtherFortresses from "@/components/OtherFortresses";
import Prose from "@/components/Prose";
import Figure from "@/components/Figure";
import FortressFacts from "@/components/FortressFacts";

export const revalidate = 300;

/* ---------- Utilities ---------- */
function cleanHtml(html: string) {
  return html
    .replace(/\sdir="ltr"/gi, "")
    .replace(/&nbsp;/g, " ")
    .replace(/<h([2-3])[^>]*>\s*<strong>(.*?)<\/strong>\s*<\/h\1>/gi, "<h$1>$2</h$1>");
}

/* ---------- Minimal JSON:API types (local) ---------- */
type JsonApiIdRef = { id: string; type: string };
type RelationshipSingle = { data?: (JsonApiIdRef & { meta?: any }) | null };
type RelationshipMany = { data?: (JsonApiIdRef & { meta?: any })[] | null };

interface FileResource {
  id: string;
  type: "file--file" | string;
  attributes?: { uri?: { url?: string } };
}

interface MediaImage {
  id: string;
  type: "media--image" | string;
  attributes?: Record<string, any>;
  relationships?: { field_media_image?: RelationshipSingle };
}

interface TaxonomyTerm {
  id: string;
  type: `taxonomy_term--${string}`;
  attributes?: { name?: string | null };
}

type IncludedItem = FileResource | MediaImage | TaxonomyTerm;
type IncludedArray = IncludedItem[];

interface FortressAttributes {
  title?: string | null;
  field_slug?: string | null;
  field_brief?: string | null;
  body?: { processed?: string | null } | null;
  field_body?: { processed?: string | null } | null;

  // facts
  field_construction_year?: string | null;
  field_towers_bastions?: string | null;
  field_condition?: string | null;
  field_area_sqm?: string | null;
  field_location?: any;

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
  return !!x && typeof (x as any).type === "string" && (x as any).type.includes("file--file");
}
function isMedia(x: IncludedItem | undefined): x is MediaImage {
  return !!x && typeof (x as any).type === "string" && (x as any).type.includes("media--image");
}
function isTerm(x: IncludedItem | undefined): x is TaxonomyTerm {
  return !!x && typeof (x as any).type === "string" && (x as any).type.startsWith("taxonomy_term--");
}

/* ---------- URL & term resolvers ---------- */
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
      const p = (item as FileResource).attributes?.uri?.url;
      if (p) out.push(`${base}${p}`);
      continue;
    }
    if (isMedia(item)) {
      const fileRef = (item as MediaImage).relationships?.field_media_image?.data?.id;
      if (fileRef) {
        const file = byId.get(fileRef);
        if (isFile(file)) {
          const p = (file as FileResource).attributes?.uri?.url;
          if (p) out.push(`${base}${p}`);
        }
      }
    }
  }

  return out;
}

function termName(included: IncludedArray = [], rel?: RelationshipSingle): string | null {
  const id = rel?.data?.id;
  if (!id) return null;
  const t = included.find((x) => x.id === id);
  return isTerm(t) ? (t.attributes?.name ?? null) : null;
}

function termsNamesFromMany(included: IncludedArray = [], rel?: RelationshipMany): string[] {
  const ids = rel?.data?.map((r) => r.id) ?? [];
  const byId = new Map(included.map((it) => [it.id, it]));
  const out: string[] = [];
  for (const id of ids) {
    const t = byId.get(id);
    if (isTerm(t) && t.attributes?.name) out.push(t.attributes.name);
  }
  return out;
}

function extractLatLon(attr: FortressAttributes): { lat: number | null; lon: number | null } {
  const loc: any = attr.field_location;
  if (!loc) return { lat: null, lon: null };

  if (typeof loc === "object" && ("lat" in loc) && ("lon" in loc || "lng" in loc)) {
    const lat = Number(loc.lat);
    const lon = Number((loc.lon ?? loc.lng));
    return { lat: isFinite(lat) ? lat : null, lon: isFinite(lon) ? lon : null };
  }

  if (typeof loc === "object" && "geojson" in loc && Array.isArray(loc.geojson?.coordinates)) {
    const [lon, lat] = loc.geojson.coordinates;
    const nlat = Number(lat), nlon = Number(lon);
    return { lat: isFinite(nlat) ? nlat : null, lon: isFinite(nlon) ? nlon : null };
  }

  if (typeof loc === "string") {
    const m = loc.match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i);
    if (m) {
      const lon = Number(m[1]), lat = Number(m[2]);
      return { lat: isFinite(lat) ? lat : null, lon: isFinite(lon) ? lon : null };
    }
  }

  return { lat: null, lon: null };
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
    "field_construction_year",
    "field_towers_bastions",
    "field_condition",
    "field_area_sqm",
    "field_location",
    "field_origin",
    "field_region",
    "field_fortress_tags",
  ];
  const include = [
    "field_thumbnail",
    "field_thumbnail.field_media_image",
    "field_hero",
    "field_hero.field_media_image",
    "field_gallery",
    "field_gallery.field_media_image",
    "field_origin",
    "field_region",
    "field_fortress_tags",
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
export default async function Page({
  params,
}: {
  // IMPORTANT: params is async now → await it
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const json = await fetchFortressDetailBySlug(slug);
  const node: FortressNode | undefined = json.data?.[0];
  if (!node) return notFound();

  const included: IncludedArray = json.included ?? [];
  const a = node.attributes;

  const title = a.title ?? "Untitled";
  const brief = a.field_brief ?? null;

  const heroUrl = fileUrl(included, node.relationships?.["field_hero"] as RelationshipSingle | undefined);

  const bodyHtml =
    a.body?.processed ??
    a.field_body?.processed ??
    null;

  const galleryRel = node.relationships?.["field_gallery"] as RelationshipMany | undefined;
  const gallery = fileUrlsFromMany(included, galleryRel);

  const { lat, lon } = extractLatLon(a);
  const facts = {
    constructionYear: a.field_construction_year ?? null,
    towersBastions: a.field_towers_bastions ?? null,
    condition: a.field_condition ?? null,
    areaSqm: a.field_area_sqm ?? null,
    origin: termName(included, node.relationships?.["field_origin"] as RelationshipSingle | undefined),
    region: termName(included, node.relationships?.["field_region"] as RelationshipSingle | undefined),
    tags: termsNamesFromMany(included, node.relationships?.["field_fortress_tags"] as RelationshipMany | undefined),
    lat, lon,
  };

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Main content */}
      <div className="col-span-12 lg:col-span-8">
        <h1 className="text-3xl font-semibold mb-2">{title}</h1>
        {brief && <p className="text-foreground/70 mb-4">{brief}</p>}

        {heroUrl && (
          <Figure
            src={heroUrl}
            alt={title}
            // caption/credit wiring: Sprint 1'de Media alanından eklenecek
            priority
          />
        )}

        {bodyHtml && (
          <Prose>
            <div dangerouslySetInnerHTML={{ __html: cleanHtml(bodyHtml) }} />
          </Prose>
        )}

        {gallery.length > 0 && (
          <section className="mt-8">
            <h2 className="text-lg font-semibold mb-3">Gallery</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {gallery.map((src, i) => (
                <div key={i} className="relative w-full overflow-hidden rounded-lg border aspect-[4/3]">
                  <Image src={src} alt={`Gallery ${i + 1}`} fill sizes="(min-width:1024px) 33vw, 50vw" />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Sidebar facts */}
      <div className="col-span-12 lg:col-span-4">
        <FortressFacts
          constructionYear={facts.constructionYear}
          towersBastions={facts.towersBastions}
          condition={facts.condition}
          areaSqm={facts.areaSqm}
          origin={facts.origin}
          region={facts.region}
          tags={facts.tags}
          lat={facts.lat}
          lon={facts.lon}
        />
      </div>

      {/* Related */}
      <div className="col-span-12">
        <OtherFortresses currentSlug={slug} />
      </div>
    </div>
  );
}
