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
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: false,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
    instrumentationHook: true,
    serverComponentsExternalPackages: ['pdfkit', '@prisma/client', '@prisma/adapter-pg', 'pg'],
    // Next 14.2 reads this under experimental. Keeps the private HTML in the server trace.
    outputFileTracingIncludes: {
      "/admin/docs/business-plan": ["./content/private/business-plan.html"],
      "/api/admin/docs/business-plan": ["./content/private/business-plan.html"],
    },
  },
  async headers() {
    return [
      {
        source: "/docs/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
          { key: "Cache-Control", value: "private, no-store" },
        ],
      },
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
      {
        source: "/login",
        headers: [
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "Cache-Control", value: "no-store" },
        ],
      },
      {
        source: "/forgot-password",
        headers: [
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "Cache-Control", value: "no-store" },
        ],
      },
      {
        source: "/reset-password",
        headers: [
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "Cache-Control", value: "no-store" },
        ],
      },
      {
        source: "/account/password",
        headers: [
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "Cache-Control", value: "no-store" },
        ],
      },
      {
        source: "/api/auth/:path*",
        headers: [
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "Cache-Control", value: "no-store" },
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
        destination: '/facilities-support',
        permanent: true,
      },
      {
        source: '/light-maintenance',
        destination: '/facilities-support',
        permanent: true,
      },
      {
        source: '/pilots',
        destination: '/introductory-offers',
        permanent: true,
      },
      {
        source: '/worker',
        destination: '/jobs',
        permanent: false,
      },
      {
        source: '/vendor',
        destination: '/vendor/jobs',
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
