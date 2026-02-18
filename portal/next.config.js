const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env"), silent: true });

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  async redirects() {
    return [
      {
        source: '/services/condo-cleaning',
        destination: '/condo-cleaning',
        permanent: true,
      },
      {
        source: '/services/commercial-cleaning',
        destination: '/commercial-cleaning',
        permanent: true,
      },
      {
        source: '/services/light-maintenance',
        destination: '/light-maintenance',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
