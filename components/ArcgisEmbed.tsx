'use client';

// Allow all *.arcgis.com subdomains and the arcg.is shortener
function isAllowedHost(url: string): boolean {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    if (host === 'arcgis.com' || host.endsWith('.arcgis.com')) return true;
    if (host === 'arcg.is') return true; // Esri short URLs
    return false;
  } catch {
    return false;
  }
}

// If a full <iframe ... src="..."> was pasted, extract the src URL
function extractUrl(input: string): string {
  if (!input) return '';
  const raw = input.trim();
  if (raw.startsWith('<')) {
    const m = raw.match(/src\s*=\s*["']([^"']+)["']/i);
    return m?.[1] ?? '';
  }
  return raw;
}

// Force https protocol
function toHttps(u: string): string {
  if (!u) return '';
  try {
    const url = new URL(u);
    if (url.protocol !== 'https:') {
      url.protocol = 'https:';
    }
    return url.toString();
  } catch {
    return u; // let caller validate
  }
}

export default function ArcgisEmbed({
  url,
  title,
  aspect = 0.5625, // 16:9 by default (56.25%). Use 0.6666 (3:2) or 0.75 (4:3) for taller maps.
}: {
  url: string;
  title?: string;
  aspect?: number;
}) {
  const normalized = toHttps(extractUrl(url));

  if (!normalized || !isAllowedHost(normalized)) {
    return (
      <p className="text-sm">
        Invalid or disallowed ArcGIS URL.{' '}
        {url ? (
          <a
            className="text-blue-600 underline"
            href={normalized || url}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open in new tab
          </a>
        ) : (
          <span>(no URL provided)</span>
        )}
      </p>
    );
  }

  const paddingTop = `${aspect * 100}%`;

  return (
    <div className="my-6">
      {title && <h3 className="text-base font-medium mb-2">{title}</h3>}
      <div
        className="relative w-full rounded-xl overflow-hidden border"
        style={{ paddingTop }}
      >
        <iframe
          src={normalized}
          title={title ?? 'ArcGIS Embed'}
          loading="lazy"
          allow="fullscreen"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          className="absolute inset-0 h-full w-full"
        />
      </div>
    </div>
  );
}
