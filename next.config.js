/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  
  // Use default Next.js optimizations instead of disabling them
  output: 'standalone',
};

module.exports = nextConfig;