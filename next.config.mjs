/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  images: {
    domains: ['cdn.simpleicons.org', 'localhost', 'paddle-billing.vercel.app'],
  },
};

export default nextConfig;
