const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env"), silent: true });

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

module.exports = nextConfig;
