// Do NOT import { NextConfig } — it collides in your setup.
// Instead, use an inline type via `satisfies`.

const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'dev-seabord.pantheonsite.io' },
      { protocol: 'https', hostname: '*.pantheonsite.io' },
    ],
  },
} satisfies import('next').NextConfig;

export default nextConfig;