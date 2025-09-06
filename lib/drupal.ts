// Server-side base URL (never exposed to the browser)
const BASE = process.env.DRUPAL_BASE_URL!;
// Public base (for client-side helpers if needed)
const PUBLIC_BASE = process.env.NEXT_PUBLIC_DRUPAL_BASE_URL!;

// ---- Minimal JSON:API types we actually use ----
type JsonApiIdRef = { id: string; type: string };
type RelationshipSingle = { data?: JsonApiIdRef | null };

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

type IncludedItem = MediaImage | FileResource;
type IncludedArray = IncludedItem[];

interface ExhibitionAttributes {
  title: string;
  field_slug?: string | null;
  field_brief?: string | null;
  path?: { alias?: string | null };
}

interface ExhibitionNode {
  id: string;
  type: string; // e.g. "node--exhibition"
  attributes: ExhibitionAttributes;
  relationships?: {
    field_thumbnail?: RelationshipSingle;
    field_hero?: RelationshipSingle;
  };
}

interface ExhibitionsResponse {
  data: ExhibitionNode[];
  included?: IncludedArray;
}

// Generic JSON fetcher with ISR
async function api<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { next: { revalidate: 600 } });
  if (!res.ok) {
    throw new Error(`JSON:API failed ${res.status}: ${await res.text()}`);
  }
  return (await res.json()) as T;
}

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

// Resolve the file URL from included media->file chain.
export function fileUrl(
  included: IncludedArray = [],
  rel?: RelationshipSingle
): string | null {
  const id = rel?.data?.id;
  if (!id) return null;

  const media = included.find((x) => x.id === id);
  // Find nested file from media->field_media_image
  if (media && 'relationships' in media) {
    const fileRef = media.relationships?.field_media_image?.data?.id;
    if (fileRef) {
      const file = included.find((x) => x.id === fileRef);
      const url = (file as FileResource | undefined)?.attributes?.uri?.url;
      if (url) {
        const base = process.env.DRUPAL_BASE_URL || PUBLIC_BASE;
        return `${base}${url}`;
      }
    }
  }
  return null;
}
export type { ExhibitionNode, IncludedArray };