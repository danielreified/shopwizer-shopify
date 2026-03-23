import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Emit a static site to ./out
  output: 'export',

  // S3 + CloudFront friendly
  trailingSlash: true, // helps avoid 403s for folder indexes
  images: { unoptimized: true }, // next/image becomes regular <img>

  // If you serve under a CF alias like https://aluu.co.za/
  // leave this empty. If you serve under a path, set basePath/assetPrefix.
  // basePath: '',
  // assetPrefix: 'https://<your-cf-domain>',

  // Optional: if you hit dynamic rendering accidentally, fail the build
  experimental: { dynamicIO: false },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
