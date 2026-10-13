import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Loaded by server code only; keep them out of the bundle.
  serverExternalPackages: ["mongodb", "mongodb-memory-server"],
};

export default nextConfig;
