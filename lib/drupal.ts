// Server-side base URL
const BASE = process.env.DRUPAL_BASE_URL!;
const PUBLIC_BASE = process.env.NEXT_PUBLIC_DRUPAL_BASE_URL!;

// ---- JSON:API minimal types ----
type JsonApiIdRef = { id: string; type: string };

type RelationshipSingle = { data?: JsonApiIdRef | null };
type RelationshipMany = { data?: JsonApiIdRef[] | null };

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

interface ArcgisSection {
  id: string;
  type: 'paragraph--arcgis_section' | string;
  attributes?: {
    field_title?: string | null;
    field_type?: 'storymap' | 'experience' | (string & {}) | null;
    field_url?: string | { uri?: string; title?: string; options?: unknown } | null;
    field_notes?: string | null;
  };
}

// Extract a usable URL string from ArcgisSection (handles Link field objects)
export function arcgisUrlFromSection(s: ArcgisSection): string {
  const val = s.attributes?.field_url as unknown;
  let raw = '';
  if (typeof val === 'string') raw = val;
  else if (val && typeof val === 'object' && 'uri' in val && typeof (val as any).uri === 'string') {
    raw = (val as any).uri;
  }
  return raw ?? '';
}
type IncludedItem = MediaImage | FileResource | ArcgisSection;
export type IncludedArray = IncludedItem[];

interface ExhibitionAttributes {
  title: string;
  field_slug?: string | null;
  field_brief?: string | null;
  path?: { alias?: string | null };
}

export interface ExhibitionNode {
  id: string;
  type: string; // "node--exhibition"
  attributes: ExhibitionAttributes;
  relationships?: {
    field_thumbnail?: RelationshipSingle;
    field_hero?: RelationshipSingle;
    field_arcgis_sections?: RelationshipMany;
  };
}

interface ExhibitionsResponse {
  data: ExhibitionNode[];
  included?: IncludedArray;
}

// Generic fetch with ISR
async function api<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { next: { revalidate: 600 } });
  if (!res.ok) throw new Error(`JSON:API failed ${res.status}: ${await res.text()}`);
  return (await res.json()) as T;
}

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

export async function fetchExhibitionDetailBySlug(
  slug: string
): Promise<ExhibitionsResponse> {
  const include = [
    'field_hero',
    'field_hero.field_media_image',
    'field_thumbnail',
    'field_thumbnail.field_media_image',
    'field_arcgis_sections',
  ];
  const qs =
    `?filter[field_slug][value]=${encodeURIComponent(slug)}` +
    `&filter[status]=1&page[limit]=1` +
    `&include=${include.join(',')}`;
  return api<ExhibitionsResponse>(`/jsonapi/node/exhibition${qs}`);
}

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

// Resolve ArcGIS sections preserving the original order
export function resolveArcgisSections(
  included: IncludedArray = [],
  rel?: RelationshipMany
): ArcgisSection[] {
  const ids = rel?.data?.map((r) => r.id) ?? [];
  const byId = new Map(included.map((it) => [it.id, it]));
  const isArc = (x: IncludedItem | undefined): x is ArcgisSection =>
    !!x && x.type.includes('paragraph--arcgis_section');
  return ids
    .map((id) => byId.get(id))
    .filter(isArc);
}

// Re-export types
export type { ExhibitionsResponse, ArcgisSection, ExhibitionAttributes, JsonApiIdRef };
