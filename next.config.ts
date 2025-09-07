// next.config.ts
// Use a single config object and export once.
// No `import type { NextConfig }` — we use `satisfies` for typing.

const nextConfig = {
  images: {
    // Allow images from your Drupal (Pantheon) hosts
    remotePatterns: [
      { protocol: 'https', hostname: 'dev-seabord.pantheonsite.io', pathname: '/**' },
      // add the live domain when ready:
      { protocol: 'https', hostname: 'seabord.pantheonsite.io', pathname: '/**' },
    ],
    // Alternative (older): domains: ['dev-seabord.pantheonsite.io']
  },

  eslint: {
    // Let production builds pass even if ESLint finds issues
    ignoreDuringBuilds: true,
  },

  // Optional quality-of-life:
  // reactStrictMode: true,
} satisfies import('next').NextConfig;

export default nextConfig;