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
    serverComponentsExternalPackages: ['pdfkit'],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=(self)" },
        ],
      },
    ];
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
