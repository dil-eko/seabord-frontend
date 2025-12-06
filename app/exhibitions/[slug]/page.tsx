// app/exhibitions/[slug]/page.tsx
import Image from "next/image";
import { notFound } from "next/navigation";

export const revalidate = 600;

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

interface ArcgisSection {
  id: string;
  type: "paragraph--arcgis_section" | string;
  attributes?: {
    field_label?: string | null;
    field_storymap_url?: string | { uri?: string; title?: string } | null;
    field_experience_url?: string | { uri?: string; title?: string } | null;
    field_notes?: string | null;
    field_width?: number | string | null;
  };
}

type IncludedItem = FileResource | MediaImage | ArcgisSection;
type IncludedArray = IncludedItem[];

interface ExhibitionAttributes {
  title?: string | null;
  field_slug?: string | null;
  field_brief?: string | null;
  body?: { processed?: string | null } | null;
  field_body?: { processed?: string | null } | null;
  path?: { alias?: string | null } | null;
}

interface ExhibitionNode {
  id: string;
  type: string;
  attributes: ExhibitionAttributes;
  relationships?: Record<string, RelationshipSingle | RelationshipMany | undefined>;
}

interface ExhibitionsResponse {
  data: ExhibitionNode[];
  included?: IncludedArray;
}

function getType(x?: IncludedItem): string | null {
  if (!x) return null;
  const t = (x as { type?: unknown }).type;
  return typeof t === "string" ? t : null;
}
function isFile(x?: IncludedItem): x is FileResource {
  const t = getType(x);
  return !!t && t.includes("file--file");
}
function isMedia(x?: IncludedItem): x is MediaImage {
  const t = getType(x);
  return !!t && t.includes("media--image");
}
function isArcgis(x?: IncludedItem): x is ArcgisSection {
  const t = getType(x);
  return !!t && t.includes("paragraph--arcgis_section");
}

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

function pickLink(v: unknown): string {
  if (!v) return "";
  if (typeof v === "string") return v;
  if (typeof v === "object" && "uri" in (v as Record<string, unknown>)) {
    const uri = (v as { uri?: string }).uri;
    if (typeof uri === "string") return uri;
  }
  return "";
}

function normalizeArcgisUrl(raw?: string | null): string | null {
  if (!raw) return null;
  try {
    const u = new URL(raw);
    const host = u.hostname.toLowerCase();

    if (host.endsWith("storymaps.arcgis.com") && u.pathname.startsWith("/stories/")) {
      u.searchParams.set("embed", "true");
      u.searchParams.set("header", "false");
      return u.toString();
    }

    if (host.endsWith("experience.arcgis.com")) {
      return u.toString();
    }

    return null;
  } catch {
    return null;
  }
}

function isAllowedArcgisUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    const host = u.hostname.toLowerCase();
    return (
      u.protocol === "https:" &&
      (host.endsWith("storymaps.arcgis.com") || host.endsWith("experience.arcgis.com"))
    );
  } catch {
    return false;
  }
}

function arcgisUrlFromSection(s: ArcgisSection): string | null {
  const raw =
    pickLink(s.attributes?.field_storymap_url) ||
    pickLink(s.attributes?.field_experience_url) ||
    null;

  const normalized = normalizeArcgisUrl(raw);
  return normalized && isAllowedArcgisUrl(normalized) ? normalized : null;
}

function getArcgisRel(node: ExhibitionNode): RelationshipMany | undefined {
  const rels = node.relationships || {};
  return (
    (rels["field_arcgis_sections"] as RelationshipMany | undefined) ??
    (rels["field_arcgis"] as RelationshipMany | undefined)
  );
}

function resolveArcgisSections(included: IncludedArray = [], rel?: RelationshipMany): ArcgisSection[] {
  const ids = rel?.data?.map((r) => r.id) ?? [];
  const byId = new Map(included.map((it) => [it.id, it]));
  return ids.map((id) => byId.get(id)).filter(isArcgis);
}

async function fetchExhibitionDetailBySlug(slug: string): Promise<ExhibitionsResponse> {
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
    "field_arcgis_sections",
  ];
  const include = [
    "field_thumbnail",
    "field_thumbnail.field_media_image",
    "field_hero",
    "field_hero.field_media_image",
    "field_arcgis_sections",
  ];
  const qs =
    `?filter[field_slug][value]=${encodeURIComponent(slug)}` +
    `&filter[status]=1&page[limit]=1` +
    `&fields[node--exhibition]=${fields.join(",")}` +
    `&include=${include.join(",")}`;

  const res = await fetch(`${BASE}/jsonapi/node/exhibition${qs}`, { next: { revalidate: 600 } });
  if (!res.ok) throw new Error(`Exhibition JSON:API ${res.status}: ${await res.text()}`);
  return (await res.json()) as ExhibitionsResponse;
}

function ratioPadding(aspect: string): string {
  const [wRaw, hRaw] = aspect.split("/");
  const w = Number(wRaw);
  const h = Number(hRaw);
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return "56.25%";
  return `${(h / w) * 100}%`;
}

function ResponsiveIframe({
  src,
  title,
  aspect = "16/9",
  minVH = 70,
}: {
  src: string;
  title: string;
  aspect?: string;
  minVH?: number;
}) {
  return (
    <div className="relative w-full bg-black" style={{ paddingTop: ratioPadding(aspect), minHeight: `${minVH}vh` }}>
      <iframe
        className="absolute inset-0 h-full w-full"
        src={src}
        title={title}
        loading="lazy"
        allowFullScreen
        allow="fullscreen"
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  );
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const json = await fetchExhibitionDetailBySlug(slug);
  const node: ExhibitionNode | undefined = json.data?.[0];
  if (!node) return notFound();

  const included: IncludedArray = json.included ?? [];
  const title = node.attributes.title ?? "Untitled";

  const hero =
    fileUrl(included, node.relationships?.["field_hero"] as RelationshipSingle | undefined) ??
    fileUrl(included, node.relationships?.["field_thumbnail"] as RelationshipSingle | undefined);

  const html = node.attributes.body?.processed ?? node.attributes.field_body?.processed ?? null;

  const arcRel = getArcgisRel(node);
  const sections = resolveArcgisSections(included, arcRel);

  return (
    <div className="py-10">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-xl font-semibold mb-4">{title}</h1>

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
      </div>

      {sections.length > 0 && (
        <div className="mt-10 w-full">
          <section className="space-y-8">
            {sections.map((s) => {
              const url = arcgisUrlFromSection(s);
              const label = s.attributes?.field_label ?? "ArcGIS";

              return (
                <div key={s.id} className="w-full">
                  <div className="max-w-3xl mx-auto px-4 mb-3">
                    <h2 className="text-base font-medium">{label}</h2>
                  </div>

                  <div className="w-full border-y">
                    {url ? (
                      <ResponsiveIframe src={url} title={`${title} — ${label}`} aspect="16/9" minVH={80} />
                    ) : (
                      <div className="max-w-3xl mx-auto px-4 py-6 text-sm">Invalid or disallowed ArcGIS URL.</div>
                    )}
                  </div>
                </div>
              );
            })}
          </section>
        </div>
      )}
    </div>
  );
}
