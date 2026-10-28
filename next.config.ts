import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Baton is almost entirely per-request, real-time UI; Cache Components stays off to keep rendering semantics simple.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  serverExternalPackages: ["postgres"],
};

export default nextConfig;
