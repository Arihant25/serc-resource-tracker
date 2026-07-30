import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
    // Resource photos are served through the optimizer, which scales them to the
    // size the layout actually asks for and re-encodes as WebP. No AVIF: encoding
    // it takes tens of seconds for a large photo, and whoever loads the page first
    // pays that wait for a few percent more compression.
    formats: ['image/webp'],
    // 70 for photos; 75 stays so it remains the default everywhere else.
    qualities: [70, 75],
    // Optimized output is keyed by the source URL, which carries ?v=<updatedAt>.
    minimumCacheTTL: 31536000,
  },
  async headers() {
    return [
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/manifest+json',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
