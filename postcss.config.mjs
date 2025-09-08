const config = {
  plugins: ["@tailwindcss/postcss"],
};

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'dev-seabord.pantheonsite.io', pathname: '/**' }],
  },
};
export default nextConfig;
