import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // ✅ This disables ESLint builds during deployment
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
