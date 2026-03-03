import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Prevent Next.js from resolving to the monorepo root node_modules
  outputFileTracingRoot: path.join(__dirname, "./"),
  // Ensure @bghcore packages are transpiled from node_modules
  transpilePackages: [
    "@bghcore/dynamic-forms-core",
    "@bghcore/dynamic-forms-mui",
  ],
};

export default nextConfig;
