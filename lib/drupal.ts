// Server-side base URLs
const BASE = process.env.DRUPAL_BASE_URL!;
const PUBLIC_BASE = process.env.NEXT_PUBLIC_DRUPAL_BASE_URL!;

// If your Paragraphs relationship machine name changes, update this once:
export const ARCGIS_REL = 'field_arcgis_sections';

// ---------- JSON:API base types ----------
export type JsonApiIdRef = { id: string; type: string };

export type RelationshipSingle = { data?: JsonApiIdRef | null };
export type RelationshipMany = { data?: JsonApiIdRef[] | null };

// Included resources we'll resolve (media/file/paragraph)
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
    field_storymap_url?: string | { uri?: string; title?: string; options?: unknown } | null;
    field_experience_url?: string | { uri?: string; title?: string; options?: unknown } | null;
    field_notes?: string | null;
    field_width?: number | string | null;
  };
}

type IncludedItem = MediaImage | FileResource | ArcgisSection;
export type IncludedArray = IncludedItem[];

// ---------- Exhibitions ----------
export interface ExhibitionAttributes {
  title: string;
  field_slug?: string | null;
  field_brief?: string | null;
  body?: { processed?: string | null } | null;
  field_body?: { processed?: string | null } | null;
  path?: { alias?: string | null };
}
export interface ExhibitionNode {
  id: string;
  type: string; // node--exhibition
  attributes: ExhibitionAttributes;
  relationships?: Record<string, RelationshipSingle | RelationshipMany | undefined>;
}
interface ExhibitionsResponse {
  data: ExhibitionNode[];
  included?: IncludedArray;
}

function isFileResource(x: IncludedItem | undefined): x is FileResource {
  return !!x && typeof x.type === 'string' && x.type.includes('file--file');
}
function isMediaImage(x: IncludedItem | undefined): x is MediaImage {
  return !!x && typeof x.type === 'string' && x.type.includes('media--image');
}
// ---------- Articles ----------
export interface ArticleAttributes {
  title: string;
  field_slug?: string | null;
  field_brief?: string | null;
  body?: { processed?: string | null; summary?: string | null } | null;
  path?: { alias?: string | null };
}
export interface ArticleNode {
  id: string;
  type: string; // node--article
  attributes: ArticleAttributes;
  relationships?: Record<string, RelationshipSingle | RelationshipMany | undefined>;
}
interface ArticlesResponse {
  data: ArticleNode[];
  included?: IncludedArray;
}

// ---------- Fortresses ----------
export interface FortressAttributes {
  title: string;
  field_slug?: string | null;
  field_brief?: string | null;
  body?: { processed?: string | null } | null;
  field_body?: { processed?: string | null } | null;
  path?: { alias?: string | null };
}
export interface FortressNode {
  id: string;
  type: string; // node--fortress
  attributes: FortressAttributes;
  relationships?: Record<string, RelationshipSingle | RelationshipMany | undefined>;
}
interface FortressesResponse {
  data: FortressNode[];
  included?: IncludedArray;
}

// ---------- fetch helper with ISR ----------
async function api<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { next: { revalidate: 600 } });
  if (!res.ok) throw new Error(`JSON:API ${res.status}: ${await res.text()}`);
  return (await res.json()) as T;
}

// ---------- Exhibitions fetchers ----------
export async function fetchExhibitions(): Promise<ExhibitionsResponse> {
  const fields = [
    'title',
    'field_slug',
    'path',
    'field_brief',
    'field_thumbnail',
    'field_hero',
  ];
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

export async function fetchExhibitionDetailBySlug(slug: string): Promise<ExhibitionsResponse> {
  const fields = [
    'title',
    'field_slug',
    'path',
    'field_brief',
    'body',
    'field_body',
    'field_thumbnail',
    'field_hero',
    ARCGIS_REL,
  ];
  const include = [
    'field_thumbnail',
    'field_thumbnail.field_media_image',
    'field_hero',
    'field_hero.field_media_image',
    ARCGIS_REL,
  ];
  const qs =
    `?filter[field_slug][value]=${encodeURIComponent(slug)}` +
    `&filter[status]=1&page[limit]=1` +
    `&fields[node--exhibition]=${fields.join(',')}` +
    `&include=${include.join(',')}`;
  return api<ExhibitionsResponse>(`/jsonapi/node/exhibition${qs}`);
}

// ---------- Articles fetchers (field_image is direct file field) ----------
export async function fetchArticles(): Promise<ArticlesResponse> {
  const fields = [
    'title',
    'field_slug',
    'path',
    'field_brief',
    'body',
    'field_image', // direct file
    'field_hero',  // media
  ];
  const include = [
    'field_image',                 // file--file (no nested include)
    'field_hero',
    'field_hero.field_media_image'
  ];
  const qs =
    `?filter[status]=1` +
    `&fields[node--article]=${fields.join(',')}` +
    `&include=${include.join(',')}` +
    `&page[limit]=24&sort=-created`;
  return api<ArticlesResponse>(`/jsonapi/node/article${qs}`);
}

export async function fetchArticleDetailBySlug(slug: string): Promise<ArticlesResponse> {
  const fields = [
    'title',
    'field_slug',
    'path',
    'field_brief',
    'body',
    'field_image', // file
    'field_hero',  // media
  ];
  const include = [
    'field_image',
    'field_hero',
    'field_hero.field_media_image'
  ];
  const qs =
    `?filter[field_slug][value]=${encodeURIComponent(slug)}` +
    `&filter[status]=1&page[limit]=1` +
    `&fields[node--article]=${fields.join(',')}` +
    `&include=${include.join(',')}`;
  return api<ArticlesResponse>(`/jsonapi/node/article${qs}`);
}

// ---------- Fortresses fetchers ----------
export async function fetchFortresses(): Promise<FortressesResponse> {
  const fields = [
    'title',
    'field_slug',
    'path',
    'field_brief',
    'field_thumbnail', // media
    'field_hero',      // media
    'field_gallery',   // media[]
  ];
  const include = [
    'field_thumbnail',
    'field_thumbnail.field_media_image',
    'field_hero',
    'field_hero.field_media_image',
    'field_gallery',
    'field_gallery.field_media_image',
  ];
  const qs =
    `?filter[status]=1` +
    `&fields[node--fortress]=${fields.join(',')}` +
    `&include=${include.join(',')}` +
    `&page[limit]=24&sort=title`;
  return api<FortressesResponse>(`/jsonapi/node/fortress${qs}`);
}

export async function fetchFortressDetailBySlug(slug: string): Promise<FortressesResponse> {
  const fields = [
    'title',
    'field_slug',
    'path',
    'field_brief',
    'body',
    'field_body',
    'field_thumbnail',
    'field_hero',
    'field_gallery',
  ];
  const include = [
    'field_thumbnail',
    'field_thumbnail.field_media_image',
    'field_hero',
    'field_hero.field_media_image',
    'field_gallery',
    'field_gallery.field_media_image',
  ];
  const qs =
    `?filter[field_slug][value]=${encodeURIComponent(slug)}` +
    `&filter[status]=1&page[limit]=1` +
    `&fields[node--fortress]=${fields.join(',')}` +
    `&include=${include.join(',')}`;
  return api<FortressesResponse>(`/jsonapi/node/fortress${qs}`);
}

// ---------- Resolvers / helpers ----------

// Resolve URL from either:
// (A) direct file--file item, or
// (B) media--image → field_media_image → file--file
export function fileUrl(
  included: IncludedArray = [],
  rel?: RelationshipSingle
): string | null {
  const id = rel?.data?.id;
  if (!id) return null;

  const item = included.find((x) => x.id === id);
  const base = process.env.DRUPAL_BASE_URL || PUBLIC_BASE;

  // (B) direct file--file attached on the node
  if (isFileResource(item)) {
    const path = item.attributes?.uri?.url;
    return path ? `${base}${path}` : null;
    }

  // (A) media--image → field_media_image → file--file
  if (isMediaImage(item)) {
    const fileRef = item.relationships?.field_media_image?.data?.id;
    if (fileRef) {
      const file = included.find((x) => x.id === fileRef);
      if (isFileResource(file)) {
        const url = file.attributes?.uri?.url;
        return url ? `${base}${url}` : null;
      }
    }
  }

  return null;
}
// Resolve multiple image URLs from RelationshipMany (gallery)
export function fileUrlsFromMany(
  included: IncludedArray = [],
  rel?: RelationshipMany
): string[] {
  const ids = rel?.data?.map((r) => r.id) ?? [];
  const byId = new Map(included.map((it) => [it.id, it]));
  const base = process.env.DRUPAL_BASE_URL || PUBLIC_BASE;
  const out: string[] = [];

  for (const id of ids) {
    const item = byId.get(id);

    // direct file
    if (isFileResource(item)) {
      const p = item.attributes?.uri?.url;
      if (p) out.push(`${base}${p}`);
      continue;
    }

    // media → file
    if (isMediaImage(item)) {
      const fileRef = item.relationships?.field_media_image?.data?.id;
      if (fileRef) {
        const file = byId.get(fileRef);
        if (isFileResource(file)) {
          const p = file.attributes?.uri?.url;
          if (p) out.push(`${base}${p}`);
        }
      }
    }
  }

  return out;
}

// Paragraph relationship accessor
export function getArcgisRelationship(node: ExhibitionNode): RelationshipMany | undefined {
  const rels = node.relationships || {};
  const primary = rels[ARCGIS_REL] as RelationshipMany | undefined;
  if (primary) return primary;
  const alt = rels['field_arcgis'] as RelationshipMany | undefined;
  return alt;
}

// Resolve ArcGIS sections preserving original order
export function resolveArcgisSections(
  included: IncludedArray = [],
  rel?: RelationshipMany
): ArcgisSection[] {
  const ids = rel?.data?.map((r) => r.id) ?? [];
  const byId = new Map(included.map((it) => [it.id, it]));
  const isArc = (x: IncludedItem | undefined): x is ArcgisSection =>
    !!x && typeof x === 'object' && 'type' in x && String(x.type).includes('paragraph--arcgis_section');

  return ids.map((id) => byId.get(id)).filter(isArc);
}

// Link field value extractor
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