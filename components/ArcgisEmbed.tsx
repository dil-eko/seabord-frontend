'use client';

const ALLOWED = [
  'storymaps.arcgis.com',
  'experience.arcgis.com',
  'www.arcgis.com',
];

// allow *.maps.arcgis.com too (org subdomains)
function isAllowedHost(url: string): boolean {
  try {
    const u = new URL(url);
    if (ALLOWED.includes(u.hostname)) return true;
    if (u.hostname.endsWith('.maps.arcgis.com')) return true;
    return false;
  } catch {
    return false;
  }
}

export default function ArcgisEmbed({
  url,
  title,
}: {
  url: string;
  title?: string;
}) {
  if (!isAllowedHost(url)) {
    return (
      <p className="text-sm">
        Invalid or disallowed ArcGIS URL.{' '}
        <a
          className="text-blue-600 underline"
          href={url}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open in new tab
        </a>
      </p>
    );
  }

  // Responsive 16:9 without Tailwind aspect plugin
  return (
    <div className="my-6">
      {title && <h3 className="text-base font-medium mb-2">{title}</h3>}
      <div
        className="relative w-full rounded-xl overflow-hidden border"
        style={{ paddingTop: '56.25%' }} // 16:9
      >
        <iframe
          src={url}
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
