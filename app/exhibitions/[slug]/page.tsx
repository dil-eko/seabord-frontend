// app/exhibitions/[slug]/page.tsx
import { notFound } from "next/navigation";

export const revalidate = 600;

type JsonApiIdRef = { id: string; type: string };
type RelationshipSingle = { data?: JsonApiIdRef | null };
type RelationshipMany = { data?: JsonApiIdRef[] | null };

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

type IncludedItem = ArcgisSection;
type IncludedArray = IncludedItem[];

interface ExhibitionAttributes {
  title?: string | null;
  field_slug?: string | null;
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
function isArcgis(x?: IncludedItem): x is ArcgisSection {
  const t = getType(x);
  return !!t && t.includes("paragraph--arcgis_section");
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
  const fields = ["title", "field_slug", "path", "field_arcgis_sections"];
  const include = ["field_arcgis_sections"];
  const qs =
    `?filter[field_slug][value]=${encodeURIComponent(slug)}` +
    `&filter[status]=1&page[limit]=1` +
    `&fields[node--exhibition]=${fields.join(",")}` +
    `&include=${include.join(",")}`;

  const res = await fetch(`${BASE}/jsonapi/node/exhibition${qs}`, { next: { revalidate: 600 } });
  if (!res.ok) throw new Error(`Exhibition JSON:API ${res.status}: ${await res.text()}`);
  return (await res.json()) as ExhibitionsResponse;
}

function ResponsiveIframe({ src, title }: { src: string; title: string }) {
  return (
    <div className="relative h-[calc(100dvh-3.5rem)] w-full bg-black">
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

  const arcRel = getArcgisRel(node);
  const sections = resolveArcgisSections(included, arcRel);

  return (
    <div className="relative left-1/2 -my-10 w-screen -translate-x-1/2">
      <h1 className="sr-only">{title}</h1>
      {sections.length > 0 && (
        <section className="w-full">
          {sections.map((s) => {
            const url = arcgisUrlFromSection(s);
            const label = s.attributes?.field_label ?? "ArcGIS";

            return (
              <div key={s.id} className="w-full">
                <h2 className="sr-only">{label}</h2>
                <div className="w-full">
                  {url ? (
                    <ResponsiveIframe src={url} title={`${title} — ${label}`} />
                  ) : (
                    <div className="max-w-3xl mx-auto px-4 py-6 text-sm">Invalid or disallowed ArcGIS URL.</div>
                  )}
                </div>
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
}
