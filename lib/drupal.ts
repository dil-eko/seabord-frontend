// Server-side base URL (never exposed to the browser)
const BASE = process.env.DRUPAL_BASE_URL!;
const PUBLIC_BASE = process.env.NEXT_PUBLIC_DRUPAL_BASE_URL!;

// If your paragraphs relationship machine name changes, update this once:
export const ARCGIS_REL = 'field_arcgis_sections';

// ---- JSON:API minimal types used by the app ----
export type JsonApiIdRef = { id: string; type: string };

export type RelationshipSingle = { data?: JsonApiIdRef | null };
export type RelationshipMany = { data?: JsonApiIdRef[] | null };

interface FileResource {
  id: string;
  type: 'file--file' | string;
  attributes?: { uri?: { url?: string } };
}

interface MediaImage {
  id: string;
  type: 'media--image' | string;
  relationships?: { field_media_image?: RelationshipSingle };
}

export interface ArcgisSection {
  id: string;
  type: 'paragraph--arcgis_section' | string;
  attributes?: {
    field_label?: string | null;
    // Your real URL fields (either plain string or Link field object with { uri })
    field_storymap_url?: string | { uri?: string; title?: string; options?: unknown } | null;
    field_experience_url?: string | { uri?: string; title?: string; options?: unknown } | null;
    field_notes?: string | null;
    field_width?: number | string | null;
  };
}

type IncludedItem = MediaImage | FileResource | ArcgisSection;
export type IncludedArray = IncludedItem[];

export interface ExhibitionAttributes {
  title: string;
  field_slug?: string | null;
  field_brief?: string | null;
  // One of these will exist depending on your field machine name:
  body?: { processed?: string | null } | null;
  field_body?: { processed?: string | null } | null;
  path?: { alias?: string | null };
}

export interface ExhibitionNode {
  id: string;
  type: string; // "node--exhibition"
  attributes: ExhibitionAttributes;
  // Keep relationships generic; we pick the ones we need by key
  relationships?: Record<string, RelationshipSingle | RelationshipMany | undefined>;
}

interface ExhibitionsResponse {
  data: ExhibitionNode[];
  included?: IncludedArray;
}

// ---- Fetch helpers with ISR ----
async function api<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { next: { revalidate: 600 } });
  if (!res.ok) throw new Error(`JSON:API ${res.status}: ${await res.text()}`);
  return (await res.json()) as T;
}

// LIST page (teasers)
export async function fetchExhibitions(): Promise<ExhibitionsResponse> {
  const fields = ['title', 'field_slug', 'path', 'field_brief', 'field_thumbnail', 'field_hero'];
  const include = [
    'field_thumbnail',
    'field_thumbnail.field_media_image',
    'field_hero',
    'field_hero.field_media_image',
  ];
  const qs =
    `?filter[status]=1` +
    `&fields[node--exhibition]=${fields.join(',')}` +
    `&include=${include.join(',')}` +
    `&page[limit]=24&sort=-created`;
  return api<ExhibitionsResponse>(`/jsonapi/node/exhibition${qs}`);
}

// DETAIL by slug (includes body + arcgis sections)
export async function fetchExhibitionDetailBySlug(
  slug: string
): Promise<ExhibitionsResponse> {
  const fields = [
    'title',
    'field_slug',
    'path',
    'field_brief',
    'body',
    'field_body',
    'field_hero',
    'field_thumbnail',
    ARCGIS_REL,
  ];
  const include = [
    'field_hero',
    'field_hero.field_media_image',
    'field_thumbnail',
    'field_thumbnail.field_media_image',
    ARCGIS_REL,
  ];

  const qs =
    `?filter[field_slug][value]=${encodeURIComponent(slug)}` +
    `&filter[status]=1&page[limit]=1` +
    `&fields[node--exhibition]=${fields.join(',')}` +
    `&include=${include.join(',')}`;

  return api<ExhibitionsResponse>(`/jsonapi/node/exhibition${qs}`);
}

// ---- Resolvers ----

// Resolve image file URL from media/file include chain
export function fileUrl(
  included: IncludedArray = [],
  rel?: RelationshipSingle
): string | null {
  const id = rel?.data?.id;
  if (!id) return null;
  const media = included.find((x) => x.id === id);
  if (media && 'relationships' in media) {
    const fileRef = media.relationships?.field_media_image?.data?.id;
    if (fileRef) {
      const file = included.find((x) => x.id === fileRef) as FileResource | undefined;
      const url = file?.attributes?.uri?.url;
      if (url) {
        const base = process.env.DRUPAL_BASE_URL || PUBLIC_BASE;
        return `${base}${url}`;
      }
    }
  }
  return null;
}

// Pick the ArcGIS relationship from node.relationships
export function getArcgisRelationship(
  node: ExhibitionNode
): RelationshipMany | undefined {
  const rels = node.relationships || {};
  const primary = rels[ARCGIS_REL] as RelationshipMany | undefined;
  if (primary) return primary;

  // Fallback if someone renamed it (rare)
  const alt = rels['field_arcgis'] as RelationshipMany | undefined;
  return alt;
}

// Resolve ArcGIS sections preserving the original order
export function resolveArcgisSections(
  included: IncludedArray = [],
  rel?: RelationshipMany
): ArcgisSection[] {
  const ids = rel?.data?.map((r) => r.id) ?? [];
  const byId = new Map(included.map((it) => [it.id, it]));
  const isArc = (x: IncludedItem | undefined): x is ArcgisSection =>
    !!x && typeof x === 'object' && 'type' in x && String(x.type).includes('paragraph--arcgis_section');
  return ids
    .map((id) => byId.get(id))
    .filter(isArc);
}

// ---- Paragraph helpers (match your real field names) ----
function pickLinkValue(val: unknown): string {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'object' && 'uri' in (val as Record<string, unknown>)) {
    const uri = (val as { uri?: string }).uri;
    if (typeof uri === 'string') return uri;
  }
  return '';
}

export function arcgisUrlFromSection(s: ArcgisSection): string {
  const story = pickLinkValue(s.attributes?.field_storymap_url);
  const exp = pickLinkValue(s.attributes?.field_experience_url);
  return story || exp || '';
}

export function arcgisTitleFromSection(s: ArcgisSection): string | undefined {
  return s.attributes?.field_label ?? undefined;
}

export type { ExhibitionsResponse };
