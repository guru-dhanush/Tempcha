/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.simpleicons.org' },
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: 'paddle-billing.vercel.app' },
      { protocol: 'https', hostname: '*.replit.dev' },
    ],
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ignored: [
          '**/.git/**',
          '**/.local/**',
          '**/.cache/**',
          '**/.agents/**',
          '**/node_modules/**',
          '**/.next/**',
        ],
        aggregateTimeout: 300,
        poll: false,
      };
    }
    return config;
  },
};

export default nextConfig;
