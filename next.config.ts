import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "tuluvluy.digital" },
      { protocol: "https", hostname: "meeting-app-navy.vercel.app" },
      { protocol: "http", hostname: "localhost", port: "3000" },
    ],
  },
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  webpack(config) {
    config.cache = { type: "filesystem" };
    return config;
  },
};

export default nextConfig;
