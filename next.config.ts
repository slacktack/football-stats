import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  devIndicators: false,
  images: {
    // Vercel's free optimizer quota ran out; crests load straight from FotMob.
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.fotmob.com",
      },
    ],
    minimumCacheTTL: 60 * 60 * 24,
    formats: ["image/avif", "image/webp"],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
